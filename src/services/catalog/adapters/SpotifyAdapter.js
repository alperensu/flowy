import { CatalogAdapter } from './CatalogAdapter';

export class SpotifyAdapter extends CatalogAdapter {
    constructor() {
        super('spotify');
    }

    async search(query) {
        // TODO: Implement real Spotify Web API call using Client Credentials Flow
        // For now, return mock data to test the aggregation layer
        console.log(`SpotifyAdapter: Mock searching for "${query}"`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock results based on query (simple logic for demo)
        if (query.toLowerCase().includes('daft punk')) {
            return [
                this.normalize({
                    id: '4kflIGfjdZJW4ot2ioixTB',
                    name: 'Get Lucky (feat. Pharrell Williams & Nile Rodgers) - Radio Edit',
                    artists: [{ name: 'Daft Punk' }, { name: 'Pharrell Williams' }, { name: 'Nile Rodgers' }],
                    album: { name: 'Random Access Memories', images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2732265d414a681575333788d07' }] },
                    duration_ms: 248413,
                    external_urls: { spotify: 'https://open.spotify.com/track/4kflIGfjdZJW4ot2ioixTB' }
                }),
                this.normalize({
                    id: '5CMjjywI0eZMixPeqNd75R',
                    name: 'Lose Yourself to Dance (feat. Pharrell Williams)',
                    artists: [{ name: 'Daft Punk' }, { name: 'Pharrell Williams' }],
                    album: { name: 'Random Access Memories', images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2732265d414a681575333788d07' }] },
                    duration_ms: 353893,
                    external_urls: { spotify: 'https://open.spotify.com/track/5CMjjywI0eZMixPeqNd75R' }
                })
            ];
        }

        return [];
    }

    normalize(rawTrack) {
        return {
            id: `sp:${rawTrack.id}`,
            originalId: rawTrack.id,
            source: 'spotify',
            title: rawTrack.name,
            artist: rawTrack.artists.map(a => a.name).join(', '),
            album: rawTrack.album.name,
            coverUrl: rawTrack.album.images[0]?.url || '',
            duration: Math.round(rawTrack.duration_ms / 1000),
            externalUrl: rawTrack.external_urls.spotify,
            score: 0
        };
    }
}
