import yts from 'yt-search';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query) {
            return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400 });
        }

        console.log(`[Search API] Processing query: "${query}"`);

        // Perform the search
        const r = await yts(query);
        const allItems = r.all || [];

        // Initialize Categories
        const response = {
            topResult: null,
            songs: [],
            albums: [],
            artists: [],
            playlists: []
        };

        // Helper to score "Song-ness"
        const scoreSong = (item) => {
            let score = 0;
            const title = item.title.toLowerCase();
            const author = item.author?.name?.toLowerCase() || "";

            // Boost Official Content
            if (title.includes('official audio')) score += 20;
            if (title.includes('official video')) score += 10;
            if (author.includes('topic')) score += 30;
            if (author.includes('vevo')) score += 20;

            // Penalize Live/Covers (unless query asks for them)
            if (!query.toLowerCase().includes('live')) {
                if (title.includes('live')) score -= 15;
                if (title.includes('concert')) score -= 15;
            }
            if (!query.toLowerCase().includes('cover')) {
                if (title.includes('cover')) score -= 10;
            }

            return score;
        };

        // Categorize Items
        allItems.forEach(item => {
            if (item.type === 'video') {
                // Filter out shorts or very long videos (likely podcasts/mixes)
                if (item.duration.seconds < 60 || item.duration.seconds > 1200) return;

                const score = scoreSong(item);
                const songItem = {
                    id: item.videoId,
                    title: item.title,
                    artist: item.author?.name,
                    duration: item.duration.seconds,
                    thumbnail: item.thumbnail,
                    url: item.url,
                    score: score,
                    type: 'song'
                };

                response.songs.push(songItem);
            } else if (item.type === 'list' || item.type === 'playlist') {
                response.playlists.push({
                    id: item.listId,
                    title: item.title,
                    author: item.author?.name,
                    thumbnail: item.thumbnail,
                    trackCount: item.videoCount,
                    type: 'playlist'
                });
            } else if (item.type === 'channel' || item.type === 'artist') {
                response.artists.push({
                    id: item.url || `${item.name}-${Math.random().toString(36).substr(2, 9)}`,
                    name: item.name,
                    thumbnail: item.thumbnail,
                    subscribers: item.subCountLabel,
                    type: 'artist'
                });
            }
        });

        // Sort Songs by Score
        response.songs.sort((a, b) => b.score - a.score);

        // Determine Top Result
        // Usually the first song or artist, but let's prioritize the highest scored song
        if (response.songs.length > 0) {
            response.topResult = response.songs[0];
            // Remove top result from songs list to avoid duplication
            response.songs.shift();
        }

        // Limit Results
        response.songs = response.songs.slice(0, 10);
        response.playlists = response.playlists.slice(0, 5);
        response.artists = response.artists.slice(0, 5);

        return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[Search API] Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
