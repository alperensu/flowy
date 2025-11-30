import yts from 'yt-search';
import ytdl from '@distube/ytdl-core';

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

        // 1. Improved Query: Force "Official Audio"
        const query = `${artist} - ${title} Official Audio`;
        console.log(`[YouTube API] Searching for: ${query}`);

        const r = await yts(query);
        let videos = r.videos;

        // 1.5. Secondary Search: If "Official Audio" yields nothing, try a broader search
        if (!videos || videos.length === 0) {
            console.warn(`[YouTube API] No results for "${query}". Trying broader search...`);
            const fallbackQuery = `${artist} - ${title}`;
            const r2 = await yts(fallbackQuery);
            videos = r2.videos;
        }

        if (!videos || videos.length === 0) {
            return new Response(JSON.stringify({ error: 'No video found' }), { status: 404 });
        }

        // 2. Studio Version Enforcer Logic
        const cleanTitle = title.toLowerCase();
        const cleanArtist = artist.toLowerCase();
        const negativeWords = ['live', 'concert', 'tour', 'cover', 'remix', 'karaoke', 'instrumental', 'performed by', 'crowd'];

        // Only ban negative words if the original song title DOESN'T have them
        const bannedWords = negativeWords.filter(w => !cleanTitle.includes(w));

        // Filter Candidates
        const candidates = videos.filter(v => {
            const vTitle = v.title.toLowerCase();

            // Must contain song title (loose check)
            if (!vTitle.includes(cleanTitle)) return false;

            // Must NOT contain banned words
            if (bannedWords.some(w => vTitle.includes(w))) return false;

            // Duration Check (±5 seconds)
            if (targetDuration > 0) {
                const diff = Math.abs(v.duration.seconds - targetDuration);
                if (diff > 5) return false;
            }

            return true;
        });

        // Fallback: If strict filtering fails, try a slightly looser duration (±10s) but keep keyword bans
        let searchPool = candidates;
        if (searchPool.length === 0 && targetDuration > 0) {
            searchPool = videos.filter(v => {
                const vTitle = v.title.toLowerCase();
                if (bannedWords.some(w => vTitle.includes(w))) return false;
                const diff = Math.abs(v.duration.seconds - targetDuration);
                return diff <= 10;
            });
        }

        // 3. Last Resort: If still no match, take the top result that isn't completely irrelevant
        if (searchPool.length === 0) {
            console.warn(`[YouTube API] No strict match for "${query}". Using fallback.`);
            // Filter out obvious garbage (shorts, extremely long mixes)
            searchPool = videos.filter(v => v.duration.seconds > 30 && v.duration.seconds < 1200);

            // If even that fails, just take the first video
            if (searchPool.length === 0 && videos.length > 0) {
                searchPool = [videos[0]];
            }
        }

        if (searchPool.length === 0) {
            return new Response(JSON.stringify({ error: 'No video found after fallback' }), { status: 404 });
        }

        // 3. Score Candidates
        let bestMatch = searchPool[0];
        let bestScore = -Infinity;

        searchPool.forEach(v => {
            let score = 0;
            const vTitle = v.title.toLowerCase();
            const vChannel = v.author?.name?.toLowerCase() || "";
            const durationDiff = targetDuration > 0 ? Math.abs(v.duration.seconds - targetDuration) : 0;

            // Duration Score
            if (durationDiff <= 2) score += 100;
            else if (durationDiff <= 5) score += 50;

            // Channel Score
            if (vChannel.includes('topic')) score += 50; // High priority for Topic
            if (vChannel.includes('vevo')) score += 30;
            if (vChannel.includes(cleanArtist)) score += 20;

            // Title Score
            if (vTitle.includes('official audio')) score += 20;
            if (vTitle.includes('official video')) score += 10;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = v;
            }
        });

        // 4. Return Best Match (Stream is handled by /api/stream)
        console.log(`[YouTube API] Best match: ${bestMatch.title} (${bestMatch.videoId}) Score: ${bestScore}`);

        return new Response(JSON.stringify({
            videoId: bestMatch.videoId,
            streamUrl: null, // Client uses /api/stream proxy
            title: bestMatch.title,
            duration: bestMatch.duration.seconds,
            thumbnail: bestMatch.thumbnail,
            score: bestScore
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0'
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
