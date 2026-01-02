
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    findNearestStation,
    Station,
    DRAINAGE_CAPACITY_TABLE,
    CONDITION_LABELS,
    DrainageCondition,
    PipeSize,
    calculateAllowableArea,
    RainfallRecord
} from '@/utils/drainageCalculator';
import { Download } from 'lucide-react';

export default function RainwaterDrainageTool() {
    // Address Search State
    const [address, setAddress] = useState('');
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [searchResult, setSearchResult] = useState<{ lat: number; lon: number; address: string } | null>(null);

    // Station State
    const [station, setStation] = useState<Station & { distance: number } | null>(null);
    const [isLoadingStation, setIsLoadingStation] = useState(false);

    // Rainfall Data State
    const [rainfallData, setRainfallData] = useState<{ max10min: number; records: RainfallRecord[]; sourceUrl: string } | null>(null);
    const [isLoadingRainfall, setIsLoadingRainfall] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculator State
    const [condition, setCondition] = useState<DrainageCondition>('condition1');
    const [pipeSize, setPipeSize] = useState<PipeSize>(100);

    // Derived Values
    const designRainfallIntensity = rainfallData ? rainfallData.max10min * 6 : 0;
    const allowableArea = calculateAllowableArea(condition, pipeSize, designRainfallIntensity);

    // Address Search Handler
    const handleSearchAddress = async () => {
        if (!address) return;
        setIsSearchingAddress(true);
        setError(null);
        setSearchResult(null);
        setStation(null);
        setRainfallData(null);

        try {
            const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`);
            if (!res.ok) throw new Error('住所検索に失敗しました');
            const data = await res.json();

            if (data.length === 0) {
                throw new Error('住所が見つかりませんでした');
            }

            // Take the first result
            const coordinates = data[0].geometry.coordinates; // [lon, lat]
            const lon = coordinates[0];
            const lat = coordinates[1];
            const foundAddress = data[0].properties.title; // or equivalent

            setSearchResult({ lat, lon, address: foundAddress });

            // Auto-find station
            const nearest = findNearestStation(lat, lon);
            if (nearest) {
                setStation(nearest);
            } else {
                setError('近くの観測所が見つかりませんでした');
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSearchingAddress(false);
        }
    };

    // Fetch Rainfall Data Handler
    const handleGetRainfall = async () => {
        if (!station) return;
        setIsLoadingRainfall(true);
        setError(null);

        try {
            // Station ID in JSON is e.g. "44132"
            // Prec No is first 2 digits
            const precNo = station.id.substring(0, 2);

            const res = await fetch(`/api/rainwater/rainfall?prec_no=${precNo}&station_name=${encodeURIComponent(station.kjName)}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'データの取得に失敗しました');
            }

            const data = await res.json();
            setRainfallData({
                max10min: data.max10min,
                records: data.records,
                sourceUrl: data.sourceUrl
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoadingRainfall(false);
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-5xl">
            <div className="space-y-2 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">雨水排水検討ツール</h1>
                    <p className="text-muted-foreground">
                        建設地の住所から最寄りのアメダス観測所を検索し、過去最大降雨強度をもとに排水管の許容面積を算定します。
                    </p>
                </div>
                <Button onClick={() => window.print()} className="gap-2 no-print" variant="outline">
                    <Download size={16} /> レポート出力
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: Search & Data */}
                <div className="space-y-6">
                    {/* 1. Address Search */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. 建設地を検索</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="住所を入力 (例: 東京都千代田区)"
                                    className="flex-1 px-3 py-2 border rounded-md"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                                />
                                <Button onClick={handleSearchAddress} disabled={isSearchingAddress} className="no-print">
                                    {isSearchingAddress ? '検索中...' : '検索'}
                                </Button>
                            </div>
                            {searchResult && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md text-sm">
                                    <p className="font-semibold">特定された座標:</p>
                                    <p>緯度: {searchResult.lat.toFixed(4)}, 経度: {searchResult.lon.toFixed(4)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. Station Info */}
                    {station && (
                        <Card>
                            <CardHeader>
                                <CardTitle>2. 最寄りの観測所</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="mb-4">
                                    <p className="text-lg font-bold">{station.kjName} 観測所</p>
                                    <p className="text-sm text-muted-foreground">建設地からの距離: {station.distance.toFixed(1)} km</p>
                                </div>

                                <Button
                                    onClick={handleGetRainfall}
                                    disabled={isLoadingRainfall || rainfallData !== null}
                                    className="w-full no-print"
                                >
                                    {isLoadingRainfall ? 'データ取得中...' : (rainfallData ? 'データ取得済み' : '降雨データを取得')}
                                </Button>

                                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                            </CardContent>
                        </Card>
                    )}

                    {/* 3. Rainfall Report */}
                    {rainfallData && (
                        <Card>
                            <CardHeader>
                                <CardTitle>過去最大10分間降雨量</CardTitle>
                                <CardDescription>
                                    出典: <a href={rainfallData.sourceUrl} target="_blank" rel="noreferrer" className="underline">気象庁 観測史上1～10位の値</a>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
                                    <p className="text-sm text-muted-foreground mb-1">過去最大10分間降水量</p>
                                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                        {rainfallData.max10min} <span className="text-xl text-foreground">mm</span>
                                    </p>
                                    <p className="text-sm mt-2 text-muted-foreground">
                                        設計降雨強度 (×6): <span className="font-bold text-foreground">{designRainfallIntensity} mm/h</span>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">上位の記録 (10分間降水量)</h4>
                                    <div className="overflow-auto max-h-48 border rounded-md">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted sticky top-0">
                                                <tr>
                                                    <th className="p-2 border-b">順位</th>
                                                    <th className="p-2 border-b">降水量 (mm)</th>
                                                    <th className="p-2 border-b">観測日時</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rainfallData.records.map((record) => (
                                                    <tr key={record.rank} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800">
                                                        <td className="p-2 font-medium">{record.rank}</td>
                                                        <td className="p-2">{record.value}</td>
                                                        <td className="p-2 text-muted-foreground">{record.date}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Calculator */}
                <div className="space-y-6">
                    <Card className={`h-full border-l-4 ${rainfallData ? 'border-l-blue-500' : 'border-l-transparent'}`}>
                        <CardHeader>
                            <CardTitle>3. 排水管径の検討</CardTitle>
                            <CardDescription>
                                算出された降雨強度をもとに、受け持ち可能な面積を計算します。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Condition Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium">排水条件を選択</label>
                                <div className="grid gap-2">
                                    {(Object.keys(CONDITION_LABELS) as DrainageCondition[]).map((key) => (
                                        <div
                                            key={key}
                                            onClick={() => setCondition(key)}
                                            className={`
                                        p-3 rounded-md border cursor-pointer transition-colors
                                        ${condition === key
                                                    ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                                    `}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-4 h-4 rounded-full border ${condition === key ? 'bg-blue-500 border-blue-500' : 'border-slate-400'}`} />
                                                <span className="text-sm">{CONDITION_LABELS[key]}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pipe Size Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium">管径を選択 (mm)</label>
                                <div className="flex flex-wrap gap-2">
                                    {[80, 100, 125, 150, 200].map((size) => (
                                        <Button
                                            key={size}
                                            variant={pipeSize === size ? 'primary' : 'outline'}
                                            onClick={() => setPipeSize(size as PipeSize)}
                                            className="w-16"
                                        >
                                            {size}φ
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Report / Result */}
                            <div className="pt-6 border-t space-y-4">
                                <h3 className="font-semibold flex items-center">
                                    検討結果
                                    {!rainfallData && <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-100 px-2 py-0.5 rounded">降雨データ未取得</span>}
                                </h3>

                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">検証用 降雨強度</p>
                                        <p className="text-2xl font-bold">
                                            {rainfallData ? designRainfallIntensity : '---'}
                                            <span className="text-sm font-normal ml-1">mm/h</span>
                                        </p>
                                    </div>
                                    <div className="p-4 bg-blue-100 dark:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs text-muted-foreground mb-1 text-blue-800 dark:text-blue-300">最大受け持ち面積</p>
                                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                                            {rainfallData ? allowableArea : '---'}
                                            <span className="text-lg font-normal ml-1">㎡</span>
                                        </p>
                                    </div>
                                </div>

                                {rainfallData && (
                                    <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                                        <p className="font-semibold mb-2">計算根拠:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>アメダス観測所: {station?.kjName}</li>
                                            <li>最大10分間降水量: {rainfallData.max10min}mm</li>
                                            <li>基準降雨強度: 180mm/h における許容面積からの換算</li>
                                            <li>計算式: (基準面積) × 180 / {designRainfallIntensity}</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
