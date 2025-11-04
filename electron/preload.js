const { contextBridge } = require('electron');

// Exposer des API sécurisées au renderer process si nécessaire
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isDesktop: true
});
