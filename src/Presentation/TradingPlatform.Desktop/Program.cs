using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Photino.NET;
using TradingPlatform.Api;
using TradingPlatform.Application;

namespace TradingPlatform.Desktop;

public static class Program
{
    [STAThread]
    public static async Task Main(string[] args)
    {
        // 1. Force GTK Dark Theme and disable WebKit hardware compositing on Linux
        // This prevents EGL_BAD_PARAMETER and DRM crashes inside Snap / Flatpak / strict sandboxes
        Environment.SetEnvironmentVariable("GTK_THEME", "Adwaita:dark");
        Environment.SetEnvironmentVariable("WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS", "1");
        Environment.SetEnvironmentVariable("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        Environment.SetEnvironmentVariable("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        Environment.SetEnvironmentVariable("WEBKIT_DMABUF_RENDERER_DISABLE_GBM", "1");

        // 2. Setup user database path in standard OS User Data folder
        var dbPath = AppStoragePaths.DatabasePath;

        // 3. Configure OS to dynamically allocate a free ephemeral port (port 0)
        // This guarantees zero port collisions regardless of other apps or lingering processes
        Environment.SetEnvironmentVariable("ASPNETCORE_URLS", "http://127.0.0.1:0");
        Environment.SetEnvironmentVariable("Spa__AutoLaunchBrowser", "false");
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", $"Data Source={dbPath}");

        // 4. Start in-process ASP.NET Core Kestrel Web Application
        var app = AppHost.CreateWebApplication(args);
        using var cts = new CancellationTokenSource();
        await app.StartAsync(cts.Token);

        // 4.5. Retrieve the dynamically bound address assigned by the OS
        var serverAddresses = app.Services.GetRequiredService<IServer>()
            .Features.Get<IServerAddressesFeature>();
        var appUrl = serverAddresses?.Addresses.FirstOrDefault() ?? app.Urls.FirstOrDefault() ?? "http://127.0.0.1:5000";

        // 5. Check if running in headless mode or without a display server
        bool isHeadless = args.Contains("--headless") || args.Contains("--server") ||
            (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DISPLAY")) &&
             string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WAYLAND_DISPLAY")));

        if (isHeadless)
        {
            Console.WriteLine($"[HEADLESS] Trading Platform active at {appUrl} (Press Ctrl+C to stop)...");
            await app.WaitForShutdownAsync();
            return;
        }

        // 6. Resolve icon file
        var iconPath = Path.Combine(AppContext.BaseDirectory, "wwwroot", "app-icon.png");
        if (!File.Exists(iconPath))
        {
            iconPath = Path.Combine(AppContext.BaseDirectory, "wwwroot", "favicon-512x512.png");
        }

        // 7. Initialize Photino Window
        try
        {
            var window = new PhotinoWindow()
                .SetTitle("Trading Platform")
                .SetSize(1440, 900)
                .Center()
                .SetUseOsDefaultSize(false)
                .SetLogVerbosity(0);

            if (File.Exists(iconPath))
            {
                try
                {
                    window.SetIconFile(iconPath);
                }
                catch
                {
                    // Ignore icon loading error on platforms without supported icon format
                }
            }

            window.Load(new Uri(appUrl));
            window.WaitForClose();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[DESKTOP ERROR] Native window initialization failed: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.Error.WriteLine($"[DESKTOP INNER EXCEPTION] {ex.InnerException.Message}");
            }
            Console.WriteLine($"[DESKTOP] Automatically launching user interface at {appUrl}...");
            LaunchAppWindow(appUrl);
            await app.WaitForShutdownAsync();
        }
        finally
        {
            cts.Cancel();
            try
            {
                await app.StopAsync();
            }
            catch
            {
                // Ignore normal cancellation during application exit
            }
        }
    }

    private static void LaunchAppWindow(string url)
    {
        // 1. Try launching in application window mode (frameless, native-like UI)
        string[] browsers = [ "google-chrome", "chromium", "chromium-browser", "brave-browser", "microsoft-edge" ];
        foreach (var browser in browsers)
        {
            try
            {
                var profileDir = Path.Combine(AppStoragePaths.DataDirectory, "browser-profile");
                var psi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = browser,
                    Arguments = $"--app={url} --user-data-dir=\"{profileDir}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                var p = System.Diagnostics.Process.Start(psi);
                if (p != null)
                {
                    Console.WriteLine($"[DESKTOP] Interface launched in application window mode ({browser}).");
                    return;
                }
            }
            catch
            {
                // Try next browser candidate
            }
        }

        // 2. Standard desktop launcher via xdg-open / open / cmd
        try
        {
            if (System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Linux))
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("xdg-open", url) { UseShellExecute = false, CreateNoWindow = true });
            }
            else if (System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Windows))
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("cmd", $"/c start {url}") { CreateNoWindow = true });
            }
            else if (System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.OSX))
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("open", url) { UseShellExecute = false, CreateNoWindow = true });
            }
            Console.WriteLine($"[DESKTOP] Interface opened in system default browser ({url}).");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[DESKTOP WARNING] Could not auto-launch browser: {ex.Message}");
        }
    }
}
