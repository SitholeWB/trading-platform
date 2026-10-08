const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  openExternal: (url) => ipcRenderer.send('open-external', url),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onOpenAbout: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:open-about', handler);
    return () => ipcRenderer.removeListener('menu:open-about', handler);
  },
  onOpenShortcuts: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:open-shortcuts', handler);
    return () => ipcRenderer.removeListener('menu:open-shortcuts', handler);
  },
});
