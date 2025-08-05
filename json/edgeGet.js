import { get } from '@vercel/edge-config';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
        return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    try {
        const value = await get(key);
        return NextResponse.json({ key, value });
    } catch (err) {
        console.error('Edge Config error:', err);
        return NextResponse.json({ error: 'Failed to fetch Edge Config' }, { status: 500 });
    }
}
