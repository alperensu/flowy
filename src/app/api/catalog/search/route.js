import { catalogManager } from '@/services/catalog/CatalogManager';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    try {
        const results = await catalogManager.search(query);
        return NextResponse.json(results);
    } catch (error) {
        console.error('Catalog Search API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
