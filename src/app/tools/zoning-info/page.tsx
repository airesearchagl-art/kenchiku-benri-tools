'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, Save, AlertCircle } from 'lucide-react';
import { latLonToTile, isPointInMultiPolygon } from '@/utils/geoUtils';

type ViewState = 'input' | 'searching' | 'result' | 'error';

export default function ZoningInfoPage() {
    // Inputs
    const [address, setAddress] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [savedKey, setSavedKey] = useState(false);

    // Results
    const [viewState, setViewState] = useState<ViewState>('input');
    const [results, setResults] = useState<{ [key: string]: any }>({});
    const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    // Load API Key from localStorage
    useEffect(() => {
        const key = localStorage.getItem('mlit_api_key');
        if (key) {
            setApiKey(key);
            setSavedKey(true);
        }
    }, []);

    const saveApiKey = () => {
        if (!apiKey) return;
        localStorage.setItem('mlit_api_key', apiKey);
        setSavedKey(true);
        alert('APIキーを保存しました。');
    };

    const clearApiKey = () => {
        localStorage.removeItem('mlit_api_key');
        setApiKey('');
        setSavedKey(false);
    };

    const LAYERS = [
        { id: 'XKT002', name: '用途地域', description: '建ぺい率・容積率・高さ制限など' },
        { id: 'XKT014', name: '防火・準防火地域', description: '火災の危険を防ぐための地域' },
        { id: 'XKT020', name: '大規模盛土造成地', description: '谷埋め盛土や腹付け盛土' },
        { id: 'XKT023', name: '地区計画', description: '地区ごとの詳細なまちづくりルール' },
    ];

    const fetchLayer = async (layerId: string, z: number, x: number, y: number, key: string, lon: number, lat: number) => {
        try {
            const proxyUrl = `/api/zoning/proxy?id=${layerId}&z=${z}&x=${x}&y=${y}`;
            const res = await fetch(proxyUrl, {
                headers: { 'X-MLIT-API-KEY': key }
            });

            if (!res.ok) return null; // Ignore errors for individual layers

            const geoJson = await res.json();
            // Find intersecting feature
            if (geoJson.features) {
                const target = geoJson.features.find((f: any) => {
                    // Check Point in Polygon
                    if (!f.geometry) return false;
                    if (f.geometry.type === 'Polygon') {
                        return isPointInMultiPolygon({ x: lon, y: lat }, [f.geometry.coordinates]);
                    } else if (f.geometry.type === 'MultiPolygon') {
                        return isPointInMultiPolygon({ x: lon, y: lat }, f.geometry.coordinates);
                    }
                    return false;
                });
                return target ? target.properties : null;
            }
            return null;

        } catch (e) {
            console.error(`Error fetching ${layerId}:`, e);
            return null;
        }
    };

    const handleSearch = async () => {
        if (!address) return;
        setViewState('searching');
        setResults({});
        setDebugInfo('');

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

            if (!apiKey) {
                setDebugInfo('APIキーが未設定のため、座標のみ取得しました。');
                setViewState('result');
                return;
            }

            // 2. Fetch All Layers
            const zoom = 15;
            const tile = latLonToTile(lat, lon, zoom);

            const promises = LAYERS.map(layer =>
                fetchLayer(layer.id, zoom, tile.x, tile.y, apiKey, lon, lat)
                    .then(data => ({ id: layer.id, data }))
            );

            const fetchedData = await Promise.all(promises);
            const newResults: { [key: string]: any } = {};
            fetchedData.forEach(item => {
                if (item.data) newResults[item.id] = item.data;
            });

            setResults(newResults);
            setViewState('result');

        } catch (e: any) {
            console.error(e);
            setDebugInfo(e.message);
            setViewState('error');
        }
    };

    return (
        <div className="container py-8 max-w-3xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">用途地域・都市計画検索</h1>
                <p className="text-muted-foreground">住所から用途地域、防火地域、地区計画などを一括検索します。</p>
            </div>

            {/* API Key Config */}
            <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                        <AlertCircle size={16} /> 初期設定 (APIキー)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-orange-800/80">
                        ご利用には「不動産情報ライブラリ」のAPIキーが必要です。<br />
                        申請は<a href="https://www.reinfolib.mlit.go.jp/api/request/" target="_blank" rel="noreferrer" className="underline font-bold">こちら</a>から (無料)。
                    </p>
                    <div className="flex gap-2">
                        <Input
                            type="password"
                            placeholder="APIキーを入力"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            className="bg-white"
                        />
                        <Button onClick={saveApiKey} variant="outline" disabled={!apiKey}>
                            <Save size={16} className="mr-2" /> 保存
                        </Button>
                        {savedKey && (
                            <Button onClick={clearApiKey} variant="ghost" className="text-red-500">削除</Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Search Input */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2">
                        <Input
                            placeholder="住所を入力 (例: 東京都千代田区霞が関2-1-3)"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={viewState === 'searching'}>
                            {viewState === 'searching' ? '検索中...' : <><Search size={16} className="mr-2" /> 検索</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {coords && (
                <div className="space-y-6">
                    <Card className="border-blue-200 bg-blue-50/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                                <MapPin size={18} /> 検索地点
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="text-sm font-mono text-slate-700">
                                {coords.lat.toFixed(6)}, {coords.lon.toFixed(6)}
                            </div>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 underline"
                            >
                                Googleマップで見る
                            </a>
                        </CardContent>
                    </Card>

                    {/* Use Zone (Main) */}
                    {results['XKT002'] ? (
                        <Card className="border-green-200 shadow-md">
                            <CardHeader className="bg-green-50/50 pb-3">
                                <CardTitle className="text-green-800">用途地域 (XKT002)</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="p-3 bg-slate-50 rounded border">
                                        <span className="text-xs text-muted-foreground block mb-1">用途地域</span>
                                        <span className="text-lg font-bold">
                                            {results['XKT002']['A29_004'] || '取得できませんでした'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 bg-slate-50 rounded border text-center">
                                            <span className="text-xs text-muted-foreground block mb-1">建ぺい率</span>
                                            <span className="text-xl font-bold text-blue-700">
                                                {results['XKT002']['A29_006'] || '-'}
                                                <span className="text-sm text-black font-normal ml-1">%</span>
                                            </span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded border text-center">
                                            <span className="text-xs text-muted-foreground block mb-1">容積率</span>
                                            <span className="text-xl font-bold text-blue-700">
                                                {results['XKT002']['A29_007'] || '-'}
                                                <span className="text-sm text-black font-normal ml-1">%</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        viewState === 'result' && apiKey && (
                            <div className="p-4 bg-slate-100 rounded text-sm text-slate-500 text-center">
                                用途地域のデータが見つかりませんでした。(区域外の可能性があります)
                            </div>
                        )
                    )}

                    {/* Other Layers */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {LAYERS.filter(l => l.id !== 'XKT002').map(layer => {
                            const data = results[layer.id];
                            return (
                                <Card key={layer.id} className={data ? "border-slate-300" : "border-slate-100 opacity-80"}>
                                    <CardHeader className="py-3 px-4 bg-slate-50 border-b">
                                        <CardTitle className="text-sm font-medium">{layer.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 min-h-[100px]">
                                        {data ? (
                                            <div className="space-y-2">
                                                {/* Generic Key-Value Dump for unknown schemas */}
                                                {Object.entries(data).map(([k, v]) => {
                                                    // Filter out internal keys like specific codes if needed, or just show all
                                                    if (typeof v !== 'string' && typeof v !== 'number') return null;
                                                    return (
                                                        <div key={k} className="text-sm">
                                                            <span className="text-slate-500 text-xs block">{k}</span>
                                                            <span className="font-semibold">{String(v)}</span>
                                                        </div>
                                                    );
                                                })}
                                                {Object.keys(data).length === 0 && <span className="text-sm text-slate-500">詳細情報なし</span>}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                                該当なし
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Error Display */}
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
