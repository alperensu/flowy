const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const ytSearch = require('yt-search');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Flowy',
        backgroundColor: '#121212',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // Allow loading local resources if needed, but be careful
        },
        autoHideMenuBar: true,
        frame: true,
    });

    // Load the app
    // In production, load the static file
    const isDev = !app.isPackaged;
    const startUrl = isDev
        ? (process.env.ELECTRON_START_URL || 'http://localhost:3000')
        : `file://${path.join(__dirname, '../out/index.html')}`;

    mainWindow.loadURL(startUrl);

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
}

const musicService = require('./music-service');

// IPC Handler for Deezer Proxy
ipcMain.handle('deezer:proxy', async (event, { url }) => {
    console.log(`[Main] Deezer Proxy Request: ${url}`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('[Main] Deezer Proxy Error:', error);
        throw error;
    }
});

// IPC Handlers for Music Service
ipcMain.handle('music:getArtist', async (event, { id, name }) => {
    return await musicService.getArtist(id, name);
});

ipcMain.handle('music:getAlbum', async (event, { id }) => {
    return await musicService.getAlbum(id);
});

// IPC Handler for YouTube Search
ipcMain.handle('youtube:search', async (event, { artist, title, duration }) => {
    console.log(`[Main] YouTube Search Request: ${artist} - ${title} (${duration}s)`);

    if (!artist || !title) {
        throw new Error('Missing artist or title');
    }

    let query = `${artist} - ${title} official audio`;

    try {
        console.log(`[Main] Searching yt-search for: ${query}`);
        let r = await ytSearch(query);
        let videos = r.videos;

        if (videos.length === 0) {
            query = `${artist} - ${title}`;
            console.log(`[Main] Retry: ${query}`);
            r = await ytSearch(query);
            videos = r.videos;
        }

        if (videos.length === 0) {
            query = title;
            console.log(`[Main] Retry title: ${query}`);
            r = await ytSearch(query);
            videos = r.videos;
        }

        if (videos.length > 0) {
            // Filter logic (simplified from API route)
            const filterVideos = (tolerance) => {
                return videos.filter(v => {
                    if (!duration) return true;
                    const targetDuration = parseInt(duration);
                    return Math.abs(targetDuration - v.seconds) <= tolerance;
                });
            };

            let candidates = filterVideos(5);
            if (candidates.length === 0) candidates = filterVideos(15);
            if (candidates.length === 0) candidates = filterVideos(30);
            if (candidates.length === 0) candidates = [videos[0]];

            const bestMatch = candidates[0];
            console.log(`[Main] Match: ${bestMatch.title} (${bestMatch.videoId})`);
            return { videoId: bestMatch.videoId };
        } else {
            throw new Error('No video found');
        }
    } catch (error) {
        console.error('[Main] Search Error:', error);
        throw error;
    }
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
