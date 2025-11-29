import { CatalogAdapter } from './CatalogAdapter';

export class SoundCloudAdapter extends CatalogAdapter {
    constructor() {
        super('soundcloud');
    }

    async search(query) {
        // TODO: Implement real SoundCloud API call or public scrape
        console.log(`SoundCloudAdapter: Mock searching for "${query}"`);

        await new Promise(resolve => setTimeout(resolve, 600));

        // Mock results
        if (query.toLowerCase().includes('daft punk')) {
            return [
                this.normalize({
                    id: '123456789',
                    title: 'Daft Punk - Get Lucky (Official Audio)',
                    user: { username: 'Daft Punk Official' },
                    artwork_url: 'https://i1.sndcdn.com/artworks-000046087534-2e2c8d-t500x500.jpg',
                    duration: 249000,
                    permalink_url: 'https://soundcloud.com/daftpunk/get-lucky'
                })
            ];
        }

        return [];
    }

    normalize(rawTrack) {
        return {
            id: `sc:${rawTrack.id}`,
            originalId: String(rawTrack.id),
            source: 'soundcloud',
            title: rawTrack.title,
            artist: rawTrack.user?.username || 'Unknown Artist',
            album: 'SoundCloud',
            coverUrl: rawTrack.artwork_url || '',
            duration: Math.round(rawTrack.duration / 1000),
            externalUrl: rawTrack.permalink_url,
            score: 0
        };
    }
}
