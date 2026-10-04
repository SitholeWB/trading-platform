using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Photino.NET;
using TradingPlatform.Api;

namespace TradingPlatform.Desktop;

public static class Program
{
    [STAThread]
    public static async Task Main(string[] args)
    {
        // 1. Force GTK Dark Theme on Linux
        Environment.SetEnvironmentVariable("GTK_THEME", "Adwaita:dark");

        // 2. Setup user database path in standard OS User Data folder
        var userDataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "trading-platform");
        Directory.CreateDirectory(userDataDir);
        var dbPath = Path.Combine(userDataDir, "trading_platform.db");

        // 3. Configure local port & environment variables
        var appUrl = "http://localhost:5000";
        Environment.SetEnvironmentVariable("ASPNETCORE_URLS", appUrl);
        Environment.SetEnvironmentVariable("Spa__AutoLaunchBrowser", "false");
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", $"Data Source={dbPath}");

        // 4. Start in-process ASP.NET Core Kestrel Web Application
        var app = AppHost.CreateWebApplication(args);
        using var cts = new CancellationTokenSource();
        await app.StartAsync(cts.Token);

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
            Console.Error.WriteLine($"[DESKTOP WARNING] Native window initialization encountered an issue: {ex.Message}");
            Console.WriteLine($"[FALLBACK] The application server is currently serving at {appUrl}.");
            Console.WriteLine("You can open it in your browser. Press Ctrl+C to terminate.");
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
}
