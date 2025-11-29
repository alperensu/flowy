import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('id');
    const artistName = searchParams.get('name');

    if (!artistId && !artistName) {
        return NextResponse.json({ error: 'Missing artist ID or name' }, { status: 400 });
    }

    try {
        // For web mode, we'll use a simple mock or fetch from Deezer
        // In production, this would use proper music service
        const deezerUrl = `https://api.deezer.com/artist/${artistId}`;
        const response = await fetch(deezerUrl);
        const artistData = await response.json();

        // Get top tracks
        const topTracksUrl = `https://api.deezer.com/artist/${artistId}/top?limit=10`;
        const topTracksResponse = await fetch(topTracksUrl);
        const topTracksData = await topTracksResponse.json();

        return NextResponse.json({
            name: artistData.name,
            images: [{ url: artistData.picture_xl }],
            stats: {
                monthlyListeners: artistData.nb_fan
            },
            discography: {
                popular: topTracksData.data?.map(track => ({
                    id: track.id,
                    title: track.title,
                    duration: track.duration,
                    plays: track.rank,
                    explicit: track.explicit_lyrics,
                    album: {
                        cover: track.album?.cover_medium
                    },
                    artist: {
                        name: artistData.name
                    }
                })) || []
            },
            bio: `${artistData.name} is a popular artist with ${artistData.nb_fan?.toLocaleString()} fans.`
        });
    } catch (error) {
        console.error('[Artist API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
