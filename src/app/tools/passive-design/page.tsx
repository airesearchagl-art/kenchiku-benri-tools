'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, Wind, Sun, AlertCircle, ThermometerSun } from 'lucide-react';
import { fetchPassiveDesignData, WeatherData } from '@/utils/weatherUtils';
import { WindRose, RadarChart } from '@/components/SimpleCharts';
import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('@/components/MapPicker'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Loading Map...</div>
});

export default function PassiveDesignPage() {
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null);
    const [viewState, setViewState] = useState<'input' | 'searching' | 'result' | 'error'>('input');
    const [debugInfo, setDebugInfo] = useState('');
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

    const handleSearch = async () => {
        if (!address) return;
        setViewState('searching');
        setDebugInfo('');
        setWeatherData(null);

        try {
            // 1. Geocoding
            const geoRes = await fetch(`https://geoapi.heartrails.com/api/json?method=suggest&matching=like&keyword=${encodeURIComponent(address)}`);
            const geoData = await geoRes.json();

            if (!geoData.response || !geoData.response.location || geoData.response.location.length === 0) {
                throw new Error('住所が見つかりませんでした。');
            }

            const loc = geoData.response.location[0];
            const lat = Number(loc.y);
            const lon = Number(loc.x);
            setCoords({ lat, lon });

            // 2. Fetch Weather Data
            const data = await fetchPassiveDesignData(lat, lon);
            setWeatherData(data);

            setViewState('result');

        } catch (e: any) {
            console.error(e);
            setDebugInfo(e.message);
            setViewState('error');
        }
    };

    return (
        <div className="container py-8 max-w-5xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">パッシブデザイン診断ツール</h1>
                <p className="text-muted-foreground">建設地の過去の気象データ(Open-Meteo)を分析し、光と風を活かす設計指針を提案します。</p>
            </div>

            {/* Inputs */}
            <div className="no-print">
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex gap-2">
                            <Input
                                placeholder="建設予定地の住所を入力 (例: 東京都千代田区...)"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={viewState === 'searching'}>
                                {viewState === 'searching' ? '分析中...' : <><Search size={16} className="mr-2" /> 診断開始</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Results */}
            {viewState === 'result' && coords && weatherData && (
                <div className="space-y-6 print:space-y-4 print-content">
                    {/* Header for Print */}
                    <div className="hidden print:block mb-2">
                        <h1 className="text-xl font-bold">パッシブデザイン診断レポート</h1>
                        <p className="text-xs text-slate-500">作成日: {new Date().toLocaleDateString()}</p>
                    </div>

                    {/* Location Info & Map */}
                    <div className="space-y-4 print:space-y-2">
                        <div className="flex items-center justify-between no-print">
                            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-2 rounded border">
                                <MapPin size={16} />
                                <span>緯度: {coords.lat.toFixed(4)}, 経度: {coords.lon.toFixed(4)}</span>
                                <span className="mx-2">|</span>
                                <span>卓越風向(夏): <b className="text-blue-600">{weatherData.summerWind.dominantDir}</b></span>
                                <span className="mx-2">|</span>
                                <span>卓越風向(冬): <b className="text-blue-600">{weatherData.winterWind.dominantDir}</b></span>
                            </div>
                            <Button variant="outline" onClick={() => window.print()}>
                                PDFエクスポート
                            </Button>
                        </div>

                        {/* Print Only Location Info */}
                        <div className="hidden print:flex flex-col gap-1 text-xs border p-2 rounded">
                            <div className="font-bold border-b pb-1 mb-1">建設地: {address}</div>
                            <div className="flex gap-4">
                                <span><b>座標:</b> {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</span>
                                <span><b>夏風:</b> {weatherData.summerWind.dominantDir}</span>
                                <span><b>冬風:</b> {weatherData.winterWind.dominantDir}</span>
                            </div>
                        </div>

                        {/* Note about Precision */}
                        <p className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded border border-yellow-100 print:text-[10px] print:p-1">
                            ⚠ <b>注記:</b> 本診断はOpen-Meteoの広域気象データを使用しており、建設地ピンポイントの微気候は考慮されていません。
                        </p>

                        {/* Interactive Map */}
                        <div className="w-full h-80 rounded-lg overflow-hidden border border-slate-200 break-inside-avoid print:h-48 relative">
                            {/* Dynamic Import for Map to avoid SSR issues with Leaflet */}
                            <MapWithNoSSR
                                lat={coords.lat}
                                lon={coords.lon}
                                onLocationSelect={async (newLat, newLon) => {
                                    setCoords({ lat: newLat, lon: newLon });

                                    // 1. Re-fetch Weather Data
                                    try {
                                        const weather = await fetchPassiveDesignData(newLat, newLon);
                                        setWeatherData(weather);
                                    } catch (e) {
                                        console.error(e);
                                    }

                                    // 2. Reverse Geocoding (Update Address)
                                    try {
                                        const res = await fetch(`https://geoapi.heartrails.com/api/json?method=searchByGeoLocation&x=${newLon}&y=${newLat}`);
                                        const json = await res.json();
                                        if (json.response && json.response.location && json.response.location.length > 0) {
                                            const loc = json.response.location[0];
                                            const newAddr = `${loc.prefecture}${loc.city}${loc.town}`;
                                            setAddress(newAddr);
                                        }
                                    } catch (e) {
                                        console.error('Reverse geocoding failed', e);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2 print:gap-4">
                        {/* Wind Analysis */}
                        <Card className="break-inside-avoid">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-700">
                                    <Wind size={22} /> 風の分析 (通風と遮蔽)
                                </CardTitle>
                                <CardDescription>過去1年間の卓越風向を季節ごとに分析</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <div className="flex gap-8">
                                    <WindRose
                                        data={weatherData.summerWind.directions}
                                        title="夏 (6-9月) - 涼風取得"
                                        color="#3b82f6"
                                    />
                                    <WindRose
                                        data={weatherData.winterWind.directions}
                                        title="冬 (12-2月) - 防風・隙間風"
                                        color="#0ea5e9"
                                    />
                                </div>
                                <div className="mt-4 p-4 bg-blue-50 text-sm text-blue-800 rounded-md w-full">
                                    <div className="font-bold mb-1">💡 設計アドバイス:</div>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><b>夏:</b> {weatherData.summerWind.dominantDir}の方角に「ウインドキャッチャー」となる窓を配置すると効果的です。</li>
                                        <li><b>冬:</b> {weatherData.winterWind.dominantDir}の方角は開口部を小さくするか、防風植栽を検討してください。</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Solar & Aperture Analysis */}
                        <Card className="break-inside-avoid">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-700">
                                    <Sun size={22} /> 開口部適正 (Passive Radar)
                                </CardTitle>
                                <CardDescription>日射取得・遮蔽・通風を総合評価した開口部の推奨度</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <RadarChart
                                    data={[
                                        weatherData.radarData.N, weatherData.radarData.NE, weatherData.radarData.E, weatherData.radarData.SE,
                                        weatherData.radarData.S, weatherData.radarData.SW, weatherData.radarData.W, weatherData.radarData.NW
                                    ]}
                                />
                                <div className="mt-4 p-4 bg-orange-50 text-sm text-orange-800 rounded-md w-full">
                                    <div className="font-bold mb-1">💡 設計アドバイス:</div>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><b>高スコアの方角:</b> 大きな開口部を設けるのに適しています（冬の日射取得＋夏の通風）。</li>
                                        <li><b>低スコアの方角:</b> 遮熱ガラス、深い軒、ルーバー等による日射遮蔽（夏）や断熱強化が必須です。</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {viewState === 'error' && (
                <div className="p-4 rounded-md bg-red-50 text-red-600 flex items-start gap-3">
                    <AlertCircle className="mt-0.5" />
                    <div>
                        <p className="font-bold">エラーが発生しました</p>
                        <p className="text-sm">{debugInfo}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
