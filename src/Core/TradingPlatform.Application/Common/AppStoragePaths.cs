using System;
using System.IO;

namespace TradingPlatform.Application.Common;

/// <summary>
/// Provides cross-platform, confinement-safe paths for writable application data.
/// Safely detects Snap ($SNAP_USER_DATA), Flatpak ($XDG_DATA_HOME), and standard OS local application storage,
/// with robust fallback to temporary directories when running in constrained environments.
/// </summary>
public static class AppStoragePaths
{
    private static readonly Lazy<string> _dataDirectory = new(ResolveDataDirectory);

    public static string DataDirectory => _dataDirectory.Value;

    public static string ChartsDirectory
    {
        get
        {
            var dir = Path.Combine(DataDirectory, "Charts");
            TryEnsureDirectory(dir);
            return dir;
        }
    }

    public static string DatabasePath => Path.Combine(DataDirectory, "trading_platform.db");

    private static string ResolveDataDirectory()
    {
        // 1. Explicit override via environment variable
        var explicitDir = Environment.GetEnvironmentVariable("TRADING_PLATFORM_DATA_DIR");
        if (!string.IsNullOrWhiteSpace(explicitDir) && TryEnsureDirectory(explicitDir))
        {
            return explicitDir;
        }

        // 2. Canonical Snap environment ($SNAP_USER_DATA) - only when running as trading-platform snap
        var snapName = Environment.GetEnvironmentVariable("SNAP_NAME");
        var snapUserData = Environment.GetEnvironmentVariable("SNAP_USER_DATA");
        if (!string.IsNullOrWhiteSpace(snapUserData) &&
            (string.Equals(snapName, "trading-platform", StringComparison.OrdinalIgnoreCase) ||
             snapUserData.Contains("trading-platform", StringComparison.OrdinalIgnoreCase)))
        {
            var snapDir = Path.Combine(snapUserData, "data");
            if (TryEnsureDirectory(snapDir))
            {
                return snapDir;
            }
        }

        // 3. Flatpak / XDG environment ($XDG_DATA_HOME)
        var xdgDataHome = Environment.GetEnvironmentVariable("XDG_DATA_HOME");
        if (!string.IsNullOrWhiteSpace(xdgDataHome))
        {
            var xdgDir = Path.Combine(xdgDataHome, "trading-platform", "data");
            if (TryEnsureDirectory(xdgDir))
            {
                return xdgDir;
            }
        }

        // 4. Standard OS Local Application Data directory (~/.local/share/trading-platform/data or %LocalAppData%\trading-platform\data)
        try
        {
            var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            if (!string.IsNullOrWhiteSpace(localAppData))
            {
                var userDir = Path.Combine(localAppData, "trading-platform", "data");
                if (TryEnsureDirectory(userDir))
                {
                    return userDir;
                }
            }
        }
        catch
        {
            // Ignore and fall through
        }

        // 5. Fallback: BaseDirectory/Data if writable
        try
        {
            var baseDir = Path.Combine(AppContext.BaseDirectory, "Data");
            if (TryEnsureDirectory(baseDir))
            {
                return baseDir;
            }
        }
        catch
        {
            // Read-only filesystem (e.g. Snap squashfs or /opt)
        }

        // 6. Universal Fallback: Temp directory is always writable
        try
        {
            var tmp = Path.Combine(Path.GetTempPath(), "trading-platform", "data");
            Directory.CreateDirectory(tmp);
            return tmp;
        }
        catch
        {
            return Path.GetTempPath();
        }
    }

    private static bool TryEnsureDirectory(string path)
    {
        try
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }

            // Verify write permission with a probe
            var testProbe = Path.Combine(path, $".probe_{Guid.NewGuid():N}");
            File.WriteAllText(testProbe, "ok");
            File.Delete(testProbe);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
