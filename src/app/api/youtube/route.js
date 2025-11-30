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

        if (targetDuration > 0) {
            // Tier 1: Exact duration match (+/- 5s)
            const exactMatch = searchPool.find(v => Math.abs(v.duration.seconds - targetDuration) <= 5);
            if (exactMatch) {
                bestMatch = exactMatch;
            } else {
                // Tier 2: Close duration match (+/- 15s)
                const closeMatch = searchPool.find(v => Math.abs(v.duration.seconds - targetDuration) <= 15);
                if (closeMatch) {
                    bestMatch = closeMatch;
                } else if (candidates.length > 0) {
                    // Tier 3: Best filtered match
                    bestMatch = candidates[0];
                }
            }
        } else if (candidates.length > 0) {
            // No duration provided, use best filtered match
            bestMatch = candidates[0];
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
