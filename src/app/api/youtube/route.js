import yts from 'yt-search';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const artist = searchParams.get('artist');
        const title = searchParams.get('title');
        const durationParam = searchParams.get('duration');
        const targetDuration = durationParam ? parseInt(durationParam) : 0;

        if (!artist || !title) {
            return new Response(JSON.stringify({ error: 'Missing artist or title' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Improved query for better accuracy
        const query = `${artist} - ${title} Official Audio`;
        const r = await yts(query);
        const videos = r.videos;

        if (!videos || videos.length === 0) {
            return new Response(JSON.stringify({ error: 'No video found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        let bestMatch = videos[0];

        // Filter out obviously wrong titles (e.g. "Full Album" when looking for a track)
        const cleanTitle = title.toLowerCase();
        const candidateVideos = videos.filter(v => {
            const vTitle = v.title.toLowerCase();
            // Basic check: Video title should contain the song title
            return vTitle.includes(cleanTitle);
        });

        // Use filtered list if we have candidates, otherwise fallback to all
        const searchPool = candidateVideos.length > 0 ? candidateVideos : videos;

        // If we have a target duration, try to find a video that matches it closely
        if (targetDuration > 0) {
            const tolerance = 5; // +/- 5 seconds
            const durationMatch = searchPool.find(v => {
                const diff = Math.abs(v.duration.seconds - targetDuration);
                return diff <= tolerance;
            });

            if (durationMatch) {
                bestMatch = durationMatch;
            } else {
                // If no exact match, try to find one that is not too far off (e.g. within 15s)
                // Tightened from 30s to 15s to avoid wrong versions
                const closeMatch = searchPool.find(v => {
                    const diff = Math.abs(v.duration.seconds - targetDuration);
                    return diff <= 15;
                });
                if (closeMatch) {
                    bestMatch = closeMatch;
                }
            }
        } else {
            // If no duration provided, just take the first one from the filtered pool
            bestMatch = searchPool[0];
        }

        return new Response(JSON.stringify({
            videoId: bestMatch.videoId,
            title: bestMatch.title,
            duration: bestMatch.duration.seconds,
            thumbnail: bestMatch.thumbnail
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200' // Cache for 24h
            },
        });
    } catch (error) {
        console.error('YouTube Search Error:', error);
        return new Response(JSON.stringify({ error: 'Internal error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
