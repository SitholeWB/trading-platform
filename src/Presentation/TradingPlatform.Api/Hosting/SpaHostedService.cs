using System.Diagnostics;
using System.Runtime.InteropServices;

namespace TradingPlatform.Api;

public class SpaHostedService : IHostedService, IDisposable
{
    private readonly IWebHostEnvironment _env;
    private readonly IHostApplicationLifetime _lifetime;
    private readonly IConfiguration _config;
    private readonly ILogger<SpaHostedService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private Process? _spaProcess;

    public SpaHostedService(
        IWebHostEnvironment env,
        IHostApplicationLifetime lifetime,
        IConfiguration config,
        ILogger<SpaHostedService> logger,
        IServiceProvider serviceProvider)
    {
        _env = env;
        _lifetime = lifetime;
        _config = config;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    public Task StartAsync(CancellationToken ct)
    {
        // Skip background SPA watcher and browser auto-launch during automated test runs
        if (IsRunningInTestEnvironment())
        {
            return Task.CompletedTask;
        }

        bool autoStartSpa = _config.GetValue<bool>("Spa:AutoStart", true);
        string webDir = Path.GetFullPath(Path.Combine(_env.ContentRootPath, "../TradingPlatform.Web"));

        if (autoStartSpa && _env.IsDevelopment() && Directory.Exists(webDir))
        {
            try
            {
                // 1. Ensure initial build exists in wwwroot
                string wwwrootIndex = Path.Combine(_env.ContentRootPath, "wwwroot", "index.html");
                if (!File.Exists(wwwrootIndex))
                {
                    _logger.LogInformation("[SPA HOST] Initial wwwroot bundle not found. Building SPA...");
                    RunOneTimeBuild(webDir);
                }

                // 2. Launch background Vite build watcher for continuous hot recompilation
                _logger.LogInformation("[SPA HOST] Auto-starting Vite continuous watcher in {Path}...", webDir);
                var isWindows = RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
                var psi = new ProcessStartInfo
                {
                    FileName = isWindows ? "cmd.exe" : "npm",
                    Arguments = isWindows ? "/c npm run build -- --watch" : "run build -- --watch",
                    WorkingDirectory = webDir,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                _spaProcess = new Process { StartInfo = psi };
                _spaProcess.OutputDataReceived += (_, e) =>
                {
                    if (!string.IsNullOrWhiteSpace(e.Data) && e.Data.Contains("built in"))
                    {
                        _logger.LogInformation("[SPA VITE] Frontend build updated in wwwroot ({Status})", e.Data.Trim());
                    }
                };
                _spaProcess.ErrorDataReceived += (_, e) =>
                {
                    if (!string.IsNullOrWhiteSpace(e.Data) && !e.Data.Contains("warning", StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogDebug("[SPA VITE] {Data}", e.Data);
                    }
                };

                _spaProcess.Start();
                _spaProcess.BeginOutputReadLine();
                _spaProcess.BeginErrorReadLine();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[SPA HOST] Could not auto-start Vite watcher. Static wwwroot bundle will be served.");
            }
        }

        // 3. Register auto-launch browser on ApplicationStarted
        _lifetime.ApplicationStarted.Register(() =>
        {
            string primaryUrl;
            try
            {
                var server = _serviceProvider.GetService<Microsoft.AspNetCore.Hosting.Server.IServer>();
                var addresses = server?.Features.Get<Microsoft.AspNetCore.Hosting.Server.Features.IServerAddressesFeature>()?.Addresses;
                primaryUrl = addresses?.FirstOrDefault() ?? _config["ASPNETCORE_URLS"] ?? "http://localhost:5000";
            }
            catch
            {
                var rawUrls = _config["ASPNETCORE_URLS"] ?? "http://localhost:5000";
                primaryUrl = rawUrls.Split(';').FirstOrDefault() ?? "http://localhost:5000";
            }
            primaryUrl = primaryUrl.Replace("0.0.0.0", "localhost").Replace("127.0.0.1", "localhost");

            _logger.LogInformation("========================================================================");
            _logger.LogInformation("[SPA HOST] Trading Platform live at: {Url}", primaryUrl);
            _logger.LogInformation("[SPA HOST] REST API and Swagger Docs: {Url}/openapi/v1.json", primaryUrl);
            _logger.LogInformation("========================================================================");

            bool autoLaunchBrowser = _config.GetValue<bool>("Spa:AutoLaunchBrowser", true);
            if (autoLaunchBrowser)
            {
                TryLaunchBrowser(primaryUrl);
            }
        });

        return Task.CompletedTask;
    }

    private static bool IsRunningInTestEnvironment()
    {
        return AppDomain.CurrentDomain.GetAssemblies()
            .Any(a => a.FullName != null && (a.FullName.Contains("xunit", StringComparison.OrdinalIgnoreCase) ||
                                             a.FullName.Contains("testhost", StringComparison.OrdinalIgnoreCase)));
    }

    private void RunOneTimeBuild(string webDir)
    {
        try
        {
            var isWindows = RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
            var psi = new ProcessStartInfo
            {
                FileName = isWindows ? "cmd.exe" : "npm",
                Arguments = isWindows ? "/c npm run build" : "run build",
                WorkingDirectory = webDir,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var p = Process.Start(psi);
            p?.WaitForExit(30000);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[SPA HOST] Failed to run initial npm build.");
        }
    }

    private void TryLaunchBrowser(string url)
    {
        try
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                Process.Start(new ProcessStartInfo("cmd", $"/c start {url}") { CreateNoWindow = true });
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                // Only launch if a desktop display manager is detected
                if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DISPLAY")) ||
                    !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WAYLAND_DISPLAY")))
                {
                    Process.Start(new ProcessStartInfo("xdg-open", url) { UseShellExecute = false, CreateNoWindow = true });
                }
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                Process.Start(new ProcessStartInfo("open", url) { UseShellExecute = false, CreateNoWindow = true });
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "[SPA HOST] Browser auto-launch skipped (headless/non-desktop environment).");
        }
    }

    public Task StopAsync(CancellationToken ct)
    {
        CleanupProcess();
        return Task.CompletedTask;
    }

    private void CleanupProcess()
    {
        if (_spaProcess != null && !_spaProcess.HasExited)
        {
            try
            {
                _logger.LogInformation("[SPA HOST] Stopping background Vite watcher...");
                _spaProcess.Kill(entireProcessTree: true);
                _spaProcess.WaitForExit(3000);
            }
            catch
            {
                // Silently ignore during shutdown
            }
            finally
            {
                _spaProcess.Dispose();
                _spaProcess = null;
            }
        }
    }

    public void Dispose()
    {
        CleanupProcess();
        GC.SuppressFinalize(this);
    }
}
