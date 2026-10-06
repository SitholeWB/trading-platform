const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

// 0. Essential Chromium flags for sandboxed environments (Snap / Flatpak / Docker)
// Disables /dev/shm usage to eliminate AppArmor shared memory permission denied crashes
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');

let mainWindow = null;
let backendProcess = null;
let isQuitting = false;

let userDataDir = '';

function getUserDataDir() {
  if (!userDataDir) {
    try {
      userDataDir = path.join(app.getPath('userData'), 'data');
    } catch {
      userDataDir = path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.trading-platform', 'data');
    }
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }
  }
  return userDataDir;
}

function resolveBackendExecutable() {
  const isWin = process.platform === 'win32';
  const binName = isWin ? 'TradingPlatform.Api.exe' : 'TradingPlatform.Api';
  const desktopBinName = isWin ? 'TradingPlatform.Desktop.exe' : 'TradingPlatform.Desktop';

  const candidates = [
    // 1. Extra resources in packaged Electron app
    path.join(process.resourcesPath, 'backend', binName),
    path.join(process.resourcesPath, 'backend', desktopBinName),
    // 2. Pre-built local directory in development
    path.join(__dirname, 'dist', 'backend', binName),
    path.join(__dirname, 'dist', 'backend', desktopBinName),
    // 3. Project payload folder
    path.join(__dirname, '..', '..', '..', 'dist', 'snap-payload', desktopBinName),
    path.join(__dirname, '..', 'TradingPlatform.Desktop', 'bin', 'Release', 'net10.0', 'linux-x64', desktopBinName),
    path.join(__dirname, '..', 'TradingPlatform.Api', 'bin', 'Release', 'net10.0', 'linux-x64', binName),
    path.join(__dirname, '..', 'TradingPlatform.Desktop', 'bin', 'Debug', 'net10.0', desktopBinName),
    path.join(__dirname, '..', 'TradingPlatform.Api', 'bin', 'Debug', 'net10.0', binName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log(`[ELECTRON] Located backend executable at: ${candidate}`);
      return candidate;
    }
  }

  return null;
}

// 2. Spawn backend and wait for dynamic port
function startBackend() {
  return new Promise((resolve, reject) => {
    // If user provided a remote or pre-running server URL
    if (process.env.BACKEND_URL) {
      console.log(`[ELECTRON] Using external backend URL: ${process.env.BACKEND_URL}`);
      return resolve(process.env.BACKEND_URL);
    }

    const backendBin = resolveBackendExecutable();
    const dataDir = getUserDataDir();
    const env = {
      ...process.env,
      ASPNETCORE_URLS: 'http://127.0.0.1:0',
      Spa__AutoLaunchBrowser: 'false',
      TRADING_PLATFORM_DATA_DIR: dataDir,
      ConnectionStrings__DefaultConnection: `Data Source=${path.join(dataDir, 'trading_platform.db')}`,
    };

    let child = null;
    if (backendBin) {
      console.log(`[ELECTRON] Spawning compiled backend: ${backendBin}`);
      child = spawn(backendBin, ['--headless'], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } else {
      console.log(`[ELECTRON] No pre-built backend found. Falling back to dotnet run...`);
      const apiProj = path.resolve(__dirname, '..', 'TradingPlatform.Api', 'TradingPlatform.Api.csproj');
      child = spawn('dotnet', ['run', '--project', apiProj, '--no-launch-profile'], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    }

    backendProcess = child;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.warn('[ELECTRON] Port discovery timed out after 30s. Attempting fallback to http://127.0.0.1:5000...');
        resolve('http://127.0.0.1:5000');
      }
    }, 30000);

    function onStdoutData(chunk) {
      const text = chunk.toString();
      process.stdout.write(`[BACKEND] ${text}`);

      // Match: "Now listening on: http://127.0.0.1:45625"
      const match = text.match(/Now listening on:\s*(http:\/\/[0-9a-zA-Z.:]+)/i);
      if (match && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        const url = match[1].replace('0.0.0.0', '127.0.0.1');
        console.log(`[ELECTRON] Successfully connected to backend at: ${url}`);
        resolve(url);
      }
    }

    child.stdout.on('data', onStdoutData);
    child.stderr.on('data', (data) => {
      process.stderr.write(`[BACKEND ERR] ${data.toString()}`);
    });

    child.on('error', (err) => {
      console.error('[ELECTRON] Failed to start backend process:', err);
      if (!resolved) {
        clearTimeout(timeout);
        reject(err);
      }
    });

    child.on('exit', (code, signal) => {
      console.log(`[ELECTRON] Backend process exited with code ${code}, signal ${signal}`);
      if (!isQuitting && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(
          `console.warn('Backend server disconnected (code ${code})');`
        );
      }
    });
  });
}

// 3. Stop backend cleanly
function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    console.log('[ELECTRON] Gracefully shutting down backend server...');
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
      } else {
        backendProcess.kill('SIGTERM');
        setTimeout(() => {
          if (backendProcess && !backendProcess.killed) {
            backendProcess.kill('SIGKILL');
          }
        }, 2000);
      }
    } catch (e) {
      console.error('[ELECTRON] Error stopping backend:', e);
    }
  }
}

// 4. Create Main Desktop Window
async function createMainWindow(backendUrl) {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    title: 'Trading Platform',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a0e17',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Native dark theme header & standard menus
  createApplicationMenu();

  // Load inline splash HTML while checking server readiness
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Trading Platform</title>
        <style>
          body {
            margin: 0;
            background-color: #0a0e17;
            color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            user-select: none;
          }
          .spinner {
            width: 44px;
            height: 44px;
            border: 3px solid rgba(59, 130, 246, 0.2);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 24px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          h2 { font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: #f8fafc; }
          p { font-size: 13px; color: #64748b; margin: 0; }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h2>Trading Platform</h2>
        <p>Initializing algorithmic engine and live charts...</p>
      </body>
    </html>
  `)}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Verify backend endpoint is responding before loading
  await pollUntilReady(backendUrl);

  console.log(`[ELECTRON] Loading application view: ${backendUrl}`);
  mainWindow.loadURL(backendUrl);

  // External URLs open in system default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function pollUntilReady(targetUrl, timeoutMs = 25000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    function check() {
      const req = http.get(targetUrl, (res) => {
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - startTime < timeoutMs) {
          setTimeout(check, 300);
        } else {
          resolve(false);
        }
      });
      req.end();
    }
    check();
  });
}

function createApplicationMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [])
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation & API Docs',
          click: async () => {
            if (mainWindow) {
              const currentUrl = mainWindow.webContents.getURL();
              const apiDocs = new URL('/openapi/v1.json', currentUrl).href;
              shell.openExternal(apiDocs);
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 5. App Lifecycle Events
app.whenReady().then(async () => {
  try {
    const backendUrl = await startBackend();
    await createMainWindow(backendUrl);
  } catch (err) {
    console.error('[ELECTRON FATAL] Error initializing app:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
      createMainWindow(process.env.BACKEND_URL || 'http://127.0.0.1:5000');
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  stopBackend();
});

app.on('window-all-closed', () => {
  isQuitting = true;
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('SIGINT', () => {
  isQuitting = true;
  stopBackend();
  process.exit(0);
});

process.on('SIGTERM', () => {
  isQuitting = true;
  stopBackend();
  process.exit(0);
});

// IPC window controls
ipcMain.on('open-external', (_, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());
