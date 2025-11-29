const ytSearch = require('yt-search');
const { net } = require('electron');

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

class ElectronMusicService {

    // --- Helper: Fetch & Extract Spotify Data ---
    async _fetchSpotifyData(url) {
        try {
            const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

            // Use Electron's net module or native fetch if available in Node 18+
            const response = await fetch(url, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.google.com/',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            if (!response.ok) {
                console.error(`[MusicService] Spotify fetch failed for ${url}: ${response.status}`);
                return null;
            }
            const html = await response.text();

            // Extraction Logic
            let extracted = null;
            const initialStateMatch = html.match(/<script id="initial-state" type="application\/json">\s*(.*?)\s*<\/script>/s);
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">\s*(.*?)\s*<\/script>/s);
            const spotifyStateMatch = html.match(/window\.__SPOTIFY_INITIAL_STATE__\s*=\s*({.*?});/s);

            if (initialStateMatch && initialStateMatch[1]) {
                const state = JSON.parse(Buffer.from(initialStateMatch[1], 'base64').toString('utf-8'));
                extracted = state?.data?.entity || state;
            } else if (nextDataMatch && nextDataMatch[1]) {
                const nextData = JSON.parse(nextDataMatch[1]);
                extracted = nextData.props?.pageProps?.state?.data?.entity || nextData.props?.pageProps?.data?.entity;
            } else if (spotifyStateMatch && spotifyStateMatch[1]) {
                extracted = JSON.parse(spotifyStateMatch[1]);
            }

            return extracted;
        } catch (e) {
            console.error("[MusicService] Spotify Fetch Error:", e);
            return null;
        }
    }

    // --- Public API: Get Artist ---
    async getArtist(artistId, artistName = null) {
        console.log(`[MusicService] Fetching Artist: ${artistId} (Name: ${artistName})`);
        let artist = null;

        const spotifyData = await this._fetchSpotifyData(`https://open.spotify.com/artist/${artistId}`);

        if (spotifyData) {
            artist = {
                id: `spotify-${spotifyData.id || artistId}`,
                name: spotifyData.name,
                bio: spotifyData.biography?.text || "",
                images: spotifyData.visuals?.headerImage?.sources || spotifyData.images || [],
                stats: {
                    followers: spotifyData.followers?.total || 0,
                    monthlyListeners: spotifyData.monthlyListeners || 0
                },
                discography: {
                    popular: [],
                    albums: [],
                    singles: []
                }
            };

            if (spotifyData.topTracks) {
                artist.discography.popular = spotifyData.topTracks.map(t => this._normalizeTrack(t));
            }
        } else {
            artist = {
                id: `spotify-${artistId}`,
                name: artistName || "Unknown Artist",
                bio: "Data unavailable from Spotify.",
                images: [],
                stats: { followers: 0, monthlyListeners: 0 },
                discography: { popular: [], albums: [], singles: [] }
            };
        }

        // YouTube Enhancement
        try {
            if (artist.name !== "Unknown Artist") {
                const ytResult = await ytSearch(`${artist.name} Topic`);
                if (ytResult.channels && ytResult.channels.length > 0) {
                    const channel = ytResult.channels[0];
                    artist.youtube = {
                        channelId: channel.url,
                        name: channel.name,
                        subscribers: channel.subCountLabel
                    };
                    if (artist.images.length === 0) {
                        artist.images = [{ url: channel.thumbnail }];
                    }
                }
            }
        } catch (e) {
            console.warn("[MusicService] YouTube Artist Search failed:", e);
        }

        return artist;
    }

    // --- Public API: Get Album ---
    async getAlbum(albumId) {
        console.log(`[MusicService] Fetching Album: ${albumId}`);
        const spotifyData = await this._fetchSpotifyData(`https://open.spotify.com/album/${albumId}`);

        if (!spotifyData) {
            throw new Error("Album not found on Spotify");
        }

        const album = {
            id: `spotify-${spotifyData.id || albumId}`,
            title: spotifyData.name,
            artist: {
                name: spotifyData.artists?.[0]?.name || "Unknown",
                id: spotifyData.artists?.[0]?.id
            },
            releaseDate: spotifyData.releaseDate?.isoString || spotifyData.release_date,
            cover: spotifyData.images?.[0]?.url,
            tracks: []
        };

        const trackList = spotifyData.tracks?.items || [];
        album.tracks = trackList.map(t => this._normalizeTrack(t, album.cover));

        return album;
    }

    _normalizeTrack(track, fallbackCover) {
        return {
            id: `spotify-${track.id}`,
            title: track.name,
            artist: {
                name: track.artists?.[0]?.name || "Unknown",
                id: `spotify-${track.artists?.[0]?.id}`
            },
            album: {
                title: track.album?.name || "Unknown Album",
                cover: track.album?.images?.[0]?.url || fallbackCover
            },
            duration: Math.floor((track.duration_ms || 0) / 1000),
            original_url: `https://open.spotify.com/track/${track.id}`
        };
    }
}

module.exports = new ElectronMusicService();
