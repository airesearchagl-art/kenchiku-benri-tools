
import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for MLIT Real Estate Information Library API.
 * Endpoint: /api/zoning/proxy
 * Query Params: z, x, y (Tile coordinates)
 * Headers: X-MLIT-API-KEY (Requested by Client, forwarded to MLIT as Ocp-Apim-Subscription-Key)
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const z = searchParams.get('z');
    const x = searchParams.get('x');
    const y = searchParams.get('y');
    const datasetId = searchParams.get('id');
    const apiKey = request.headers.get('X-MLIT-API-KEY');

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key is required.' }, { status: 400 });
    }

    if (!z || !x || !y || !datasetId) {
        return NextResponse.json({ error: 'Missing parameters: z, x, y, and id are required.' }, { status: 400 });
    }

    // Basic validation for Dataset ID (XKTxxx or XITxxx)
    if (!/^[A-Z]{3}\d{3}$/.test(datasetId)) {
        return NextResponse.json({ error: 'Invalid Dataset ID format.' }, { status: 400 });
    }

    // MLIT API Endpoint
    const baseUrl = `https://www.reinfolib.mlit.go.jp/ex-api/external/${datasetId}`;
    const targetUrl = `${baseUrl}?response_format=geojson&z=${z}&x=${x}&y=${y}`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'User-Agent': 'ArchitecturalTools/1.0',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('MLIT API Error:', response.status, errorText);
            return NextResponse.json({
                error: `MLIT API Error: ${response.status}`,
                details: errorText
            }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
