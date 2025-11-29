const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    searchYouTube: (query) => ipcRenderer.invoke('youtube:search', query),
    proxyDeezer: (url) => ipcRenderer.invoke('deezer:proxy', { url }),
    getArtist: (id, name) => ipcRenderer.invoke('music:getArtist', { id, name }),
    getAlbum: (id) => ipcRenderer.invoke('music:getAlbum', { id })
});
