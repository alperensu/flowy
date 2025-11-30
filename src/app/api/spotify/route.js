import { NextResponse } from 'next/server';
import { searchTracks } from '@/lib/api';

// Extract playlist ID from URL
function extractPlaylistId(url) {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

// Scrape playlist page for track information
async function scrapePlaylistPage(playlistId) {
    try {
        console.log('Fetching Spotify page for playlist:', playlistId);
        const response = await fetch(
            `https://open.spotify.com/playlist/${playlistId}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }
        );

        if (!response.ok) {
            console.error('Failed to fetch playlist page:', response.status);
            return null;
        }

        const html = await response.text();
        console.log('Received HTML, length:', html.length);

        // Extract playlist name from meta tags
        const nameMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

        // Extract track data from embedded JSON
        const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);

        let tracks = [];
        if (scriptMatch) {
            try {
                const jsonData = JSON.parse(scriptMatch[1]);
                console.log('Parsed __NEXT_DATA__, checking for tracks...');

                const playlistData = jsonData?.props?.pageProps?.state?.data?.entity;

                if (playlistData?.contents?.items) {
                    tracks = playlistData.contents.items.map(item => {
                        const track = item.itemV2?.data || item.track;
                        if (!track) return null;

                        return {
                            name: track.name,
                            artists: (track.artists?.items || track.artists || []).map(a => a.profile?.name || a.name),
                            album: track.album?.name || track.albumOfTrack?.name,
                            duration_ms: track.duration?.totalMilliseconds || track.duration_ms
                        };
                    }).filter(Boolean);
                } else if (playlistData?.tracks?.items) {
                    tracks = playlistData.tracks.items.map(item => {
                        const track = item.track;
                        if (!track) return null;

                        return {
                            name: track.name,
                            artists: track.artists.map(a => a.name),
                            album: track.album.name,
                            duration_ms: track.duration_ms
                        };
                    }).filter(Boolean);
                }

                console.log(`Found ${tracks.length} tracks in __NEXT_DATA__`);
            } catch (e) {
                console.error('Failed to parse embedded JSON:', e.message);
            }
        } else {
            console.log('No __NEXT_DATA__ script found');
        }

        return {
            name: nameMatch ? nameMatch[1] : 'Imported Playlist',
            description: descMatch ? descMatch[1] : '',
            cover: imageMatch ? imageMatch[1] : null,
            tracks
        };
    } catch (e) {
        console.error('Scraping method failed:', e);
    }
    return null;
}

export async function POST(request) {
    try {
        const { playlistId: rawId } = await request.json();

        if (!rawId) {
            return NextResponse.json(
                { error: 'Playlist ID or URL is required' },
                { status: 400 }
            );
        }

        // Extract playlist ID from URL if needed
        const playlistId = extractPlaylistId(rawId) || rawId;

        console.log('=== SPOTIFY IMPORT START ===');
        console.log('Playlist ID:', playlistId);

        // Try scraping for full data
        const scrapedData = await scrapePlaylistPage(playlistId);

        if (!scrapedData) {
            console.error('Failed to scrape playlist');
            return NextResponse.json(
                { error: 'Failed to fetch playlist. Make sure the playlist is public.' },
                { status: 404 }
            );
        }

        const trackList = scrapedData.tracks || [];
        console.log(`Found ${trackList.length} tracks in playlist "${scrapedData.name}"`);

        // If we have track info, search for each track in our catalog (Deezer)
        const normalizedTracks = [];

        for (let i = 0; i < trackList.length; i++) {
            const track = trackList[i];
            if (!track || !track.name) continue;

            try {
                const artists = Array.isArray(track.artists) ? track.artists.join(' ') : '';
                const query = `${artists} ${track.name}`.trim();
                console.log(`[${i + 1}/${trackList.length}] Searching: ${query}`);

                const searchResults = await searchTracks(query);

                if (searchResults && searchResults.length > 0) {
                    normalizedTracks.push(searchResults[0]);
                    console.log(`  ✓ Found`);
                } else {
                    console.log(`  ✗ Not found`);
                }
            } catch (e) {
                console.error(`  ✗ Error:`, e.message);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log(`=== IMPORT COMPLETE: ${normalizedTracks.length}/${trackList.length} ===`);

        return NextResponse.json({
            name: scrapedData.name,
            description: scrapedData.description,
            cover: scrapedData.cover,
            tracks: normalizedTracks,
            total: normalizedTracks.length,
            originalTotal: trackList.length
        });

    } catch (error) {
        console.error('=== SPOTIFY IMPORT ERROR ===');
        console.error(error);
        return NextResponse.json(
            { error: error.message || 'Failed to import playlist' },
            { status: 500 }
        );
    }
}
