const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API if needed later
contextBridge.exposeInMainWorld('electronAPI', {
  // placeholder for future ipc calls
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, cb) => ipcRenderer.on(channel, (e, ...args) => cb(...args))
});
