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

    const query = `${artist} - ${title} Official Audio`;

    try {
        console.log(`[Main] Searching yt-search for: ${query}`);
        const r = await ytSearch(query);
        const videos = r.videos;

        if (!videos || videos.length === 0) {
            throw new Error('No video found');
        }

        // Filter Logic
        const cleanTitle = title.toLowerCase();

        // Words to avoid unless they are in the original title
        const negativeWords = ['live', 'concert', 'cover', 'remix', 'karaoke', 'tour'];
        const allowedNegativeWords = negativeWords.filter(w => cleanTitle.includes(w));
        const bannedWords = negativeWords.filter(w => !allowedNegativeWords.includes(w));

        const candidates = videos.filter(v => {
            const vTitle = v.title.toLowerCase();

            // Must contain song title (loose check)
            if (!vTitle.includes(cleanTitle)) return false;

            // Check for banned words
            if (bannedWords.some(w => vTitle.includes(w))) return false;

            return true;
        });

        const searchPool = candidates.length > 0 ? candidates : videos;

        if (duration) {
            const targetDuration = parseInt(duration);

            // Tier 1: Exact duration match (+/- 5s)
            const exactMatch = searchPool.find(v => Math.abs(v.seconds - targetDuration) <= 5);
            if (exactMatch) {
                console.log(`[Main] Exact duration match: ${exactMatch.title}`);
                return { videoId: exactMatch.videoId };
            }

            // Tier 2: Close duration match (+/- 15s)
            const closeMatch = searchPool.find(v => Math.abs(v.seconds - targetDuration) <= 15);
            if (closeMatch) {
                console.log(`[Main] Close duration match: ${closeMatch.title}`);
                return { videoId: closeMatch.videoId };
            }
        }

        // Tier 3: Best filtered match
        if (candidates.length > 0) {
            console.log(`[Main] Best filtered match: ${candidates[0].title}`);
            return { videoId: candidates[0].videoId };
        }

        // Fallback
        console.log(`[Main] Fallback match: ${videos[0].title}`);
        return { videoId: videos[0].videoId };

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
