export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Return simple empty data for all requests
        return new Response(JSON.stringify({
            data: [],
            tracks: { data: [] }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
