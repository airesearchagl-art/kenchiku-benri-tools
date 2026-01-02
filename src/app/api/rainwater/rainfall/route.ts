
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Cache for station mapping to avoid repeated internal scraping
// Key: "PrecNo-StationName", Value: { type: 's'|'a', block_no: string }
const stationIdCache = new Map<string, { type: 's' | 'a'; block_no: string }>();

// JMA Prefecture Codes (simplified mapping or pass dynamically)
// We will rely on the client passing the 'prec_no' derived from the station ID (first 2 digits)
// or we can fallback to searching.

async function getStationScrapingId(prec_no: string, stationName: string): Promise<{ type: 's' | 'a'; block_no: string } | null> {
    const cacheKey = `${prec_no}-${stationName}`;
    if (stationIdCache.has(cacheKey)) {
        return stationIdCache.get(cacheKey)!;
    }

    // Fetch the station selection page for the prefecture
    const url = `https://www.data.jma.go.jp/obd/stats/etrn/select/prefecture.php?prec_no=${prec_no}`;
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!res.ok) throw new Error(`Failed to fetch prefecture list: ${res.status}`);
        const html = await res.text();
        console.log(`Fetched HTML length: ${html.length}`);
        const $ = cheerio.load(html);

        let result = null;

        // Search for the station in the area map tags (often contained in <area> tags)
        // <area href=".../view/rank_s.php?prec_no=44&block_no=47662&..." onmouseover="...">
        // JMA uses <area> tags for the map interaction.

        $('area').each((_, el) => {
            const href = $(el).attr('href');
            const alt = $(el).attr('alt');
            // console.log(`Checking station: ${alt} vs ${stationName}`); 
            if (alt && alt.includes(stationName)) {
                console.log(`Match found! ${alt}`);

                // Try to extract from onmouseover first (more reliable for type)
                // viewPoint('s','47662','東京'...)
                const onmouseover = $(el).attr('onmouseover');
                if (onmouseover) {
                    const match = onmouseover.match(/viewPoint\('([sa])','([0-9]+)'/);
                    if (match) {
                        result = { type: match[1] as 's' | 'a', block_no: match[2] };
                        return false;
                    }
                }

                // Fallback to href if onmouseover didn't provide a match
                if (href) {
                    const isS = href.includes('rank_s.php');
                    const isA = href.includes('rank_a.php');
                    const type = isS ? 's' : (isA ? 'a' : null);

                    const match = href.match(/block_no=([0-9]+)/);
                    if (type && match) {
                        result = { type, block_no: match[1] };
                        return false; // break loop
                    }
                }
            }
        });

        if (result) {
            stationIdCache.set(cacheKey, result);
        }
        return result;

    } catch (error) {
        console.error('Error in getStationScrapingId:', error);
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const prec_no = searchParams.get('prec_no');
    const stationName = searchParams.get('station_name');

    if (!prec_no || !stationName) {
        return NextResponse.json({ error: 'Missing prec_no or station_name' }, { status: 400 });
    }

    try {
        // 1. Resolve correct block_no and page type
        const stationInfo = await getStationScrapingId(prec_no, stationName);
        if (!stationInfo) {
            return NextResponse.json({
                error: 'Station not found in JMA database',
                debug: {
                    prec_no,
                    stationName,
                    message: "Scraping failed to find match in area tags"
                }
            }, { status: 404 });
        }

        // 2. Fetch data
        const rankUrl = `https://www.data.jma.go.jp/obd/stats/etrn/view/rank_${stationInfo.type}.php?prec_no=${prec_no}&block_no=${stationInfo.block_no}&year=&month=&day=&view=`;

        const res = await fetch(rankUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!res.ok) throw new Error(`Failed to fetch ranking page: ${res.status}`);
        const html = await res.text();
        const $ = cheerio.load(html);

        // 3. Parse "Maximum 10-min Precipitation"
        // The table layout is complex. We look for the cell containing "最大10分間降水量".

        const records: any[] = [];
        let max10min = 0;

        // Strategy: Iterate all rows in `table.data2_s`.
        // Find the row where th contains "最大10分間降水量".
        // Then extract the cells.

        $('table.data2_s tr').each((_, row) => {
            const th = $(row).find('th').text();
            if (th && th.includes('10分間降水量')) {
                // Found the row!
                $(row).find('td').each((i, cell) => {
                    const text = $(cell).text().trim(); // e.g., "35.0<br>(1966/6/7)" -> "35.0(1966/6/7)"
                    // Split value and date

                    const match = text.match(/^([0-9\.]+)/);
                    if (match) {
                        const val = parseFloat(match[1]);
                        // Date usually in parens
                        const dateMatch = text.match(/\(([^)]+)\)/);
                        const date = dateMatch ? dateMatch[1] : '';

                        records.push({
                            rank: i + 1, // Columns are ranking 1 to 10
                            value: val,
                            date: date
                        });
                    }
                });
                return false; // break row loop
            }
        });

        // Maximum is the Rank 1
        if (records.length > 0) {
            max10min = records[0].value;
        }

        return NextResponse.json({
            station: stationName,
            max10min: max10min,
            records: records.slice(0, 10), // Ensure just top 10
            sourceUrl: rankUrl
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
