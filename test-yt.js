const ytSearch = require('yt-search');

async function testSearch(query) {
    console.log(`Searching for: ${query}`);
    try {
        const r = await ytSearch(query);
        const videos = r.videos;
        if (videos.length > 0) {
            console.log(`Found video: ${videos[0].title} (${videos[0].videoId})`);
        } else {
            console.log('No videos found.');
        }
    } catch (err) {
        console.error('Search failed:', err);
    }
}

testSearch('Daft Punk - Get Lucky audio');
testSearch('Tarkan - Kuzu Kuzu audio');
