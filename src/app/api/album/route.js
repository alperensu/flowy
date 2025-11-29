import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('id');

    if (!albumId) {
        return NextResponse.json({ error: 'Missing album ID' }, { status: 400 });
    }

    try {
        // Fetch album data from Deezer
        const albumUrl = `https://api.deezer.com/album/${albumId}`;
        const response = await fetch(albumUrl);
        const albumData = await response.json();

        if (albumData.error) {
            return NextResponse.json({ error: albumData.error.message }, { status: 404 });
        }

        return NextResponse.json({
            id: albumData.id,
            title: albumData.title,
            cover: albumData.cover_xl,
            artist: {
                name: albumData.artist?.name,
                image: albumData.artist?.picture_medium
            },
            releaseDate: albumData.release_date,
            tracks: albumData.tracks?.data?.map(track => ({
                id: track.id,
                title: track.title,
                duration: track.duration,
                explicit: track.explicit_lyrics,
                artist: {
                    name: albumData.artist?.name
                },
                album: {
                    title: albumData.title,
                    cover_medium: albumData.cover_medium,
                    cover_small: albumData.cover_small
                }
            })) || []
        });
    } catch (error) {
        console.error('[Album API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
