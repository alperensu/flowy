
const fetch = require('node-fetch');

async function testSearch(query) {
    try {
        const res = await fetch(`https://open.spotify.com/search/${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        console.log("Status:", res.status);

        // Look for artist ID pattern
        // "spotify:artist:..." or "/artist/..."

        // Check for initial state
        const resourceMatch = html.match(/<script id="resource" type="application\/json">\s*(.*?)\s*<\/script>/s);
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">\s*(.*?)\s*<\/script>/s);
        const sessionMatch = html.match(/Spotify\.Entity\s*=\s*({.*?});/s);

        if (resourceMatch) console.log("Found resource script");
        if (nextDataMatch) console.log("Found NEXT_DATA script");
        if (sessionMatch) console.log("Found Spotify.Entity");

        // Simple regex search for artist link
        const artistLinkMatch = html.match(/"uri":"spotify:artist:([a-zA-Z0-9]+)"/);
        if (artistLinkMatch) {
            console.log("Found Artist ID via regex:", artistLinkMatch[1]);
        }

    } catch (e) {
        console.error(e);
    }
}

testSearch('UZI');
