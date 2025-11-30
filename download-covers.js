const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, 'public', 'images', 'playlist-covers');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const downloadImage = (index) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(dir, `cover-${index}.jpg`));
        https.get(`https://picsum.photos/500/500?random=${index}`, function(response) {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log(`Downloaded cover-${index}.jpg`);
                    resolve();
                });
            });
        }).on('error', (err) => {
            fs.unlink(path.join(dir, `cover-${index}.jpg`), () => {}); // Delete the file async. (But we don't check the result)
            reject(err.message);
        });
    });
};

async function downloadAll() {
    for (let i = 1; i <= 20; i++) {
        await downloadImage(i);
    }
    console.log('All 20 images downloaded.');
}

downloadAll();
