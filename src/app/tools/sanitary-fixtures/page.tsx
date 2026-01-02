'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { calculateFixtures, calculateCapacityRange, CalculationResult } from '@/utils/sanitaryCalculator';
import { BuildingUsage, ServiceLevel, BUILDING_USAGE_LABELS, FixtureType } from '@/utils/sanitaryStandards';
import { FixtureGraph } from '@/components/FixtureGraph';
import { Download, Info, FileText } from 'lucide-react';

export default function SanitaryCalculatorPage() {
    const [usage, setUsage] = useState<BuildingUsage>('OFFICE');
    const [population, setPopulation] = useState<number>(0);
    const [maleRatio, setMaleRatio] = useState<number>(50);
    const [serviceLevel, setServiceLevel] = useState<ServiceLevel>(2);
    const [result, setResult] = useState<CalculationResult | null>(null);

    // Reverse Calculation State (All Types)
    const [revCounts, setRevCounts] = useState<Record<FixtureType, number>>({
        male_closet: 0, male_urinal: 0, male_lavatory: 0,
        female_closet: 0, female_lavatory: 0
    });
    const [revCapacities, setRevCapacities] = useState<Record<FixtureType, { min: number; max: number } | null>>({
        male_closet: null, male_urinal: null, male_lavatory: null,
        female_closet: null, female_lavatory: null
    });

    // PDF Export Ref
    const printRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);


    const handleCalculate = () => {
        const maleCount = Math.round((population * maleRatio) / 100);
        const femaleCount = population - maleCount;
        const res = calculateFixtures(usage, serviceLevel, maleCount, femaleCount);
        setResult(res);
    };

    const handleReverseCalculate = () => {
        // Prepare array for all types
        const inputs = (Object.keys(revCounts) as FixtureType[]).map(type => ({
            type,
            count: revCounts[type]
        }));

        const caps = calculateCapacityRange(usage, serviceLevel, inputs);

        // Update state
        setRevCapacities(prev => {
            const next = { ...prev };
            (Object.keys(caps) as FixtureType[]).forEach(key => {
                next[key] = caps[key];
            });
            return next;
        });
    };

    const handleRevCountChange = (type: FixtureType, val: number) => {
        setRevCounts(prev => ({ ...prev, [type]: val }));
    };

    const handleExportPDF = () => {
        window.print();
    };


    useEffect(() => {
        if (population >= 0) {
            handleCalculate();
        }
    }, [usage, population, maleRatio, serviceLevel]);

    // Recalculate capacity when params change
    useEffect(() => {
        handleReverseCalculate();
    }, [usage, serviceLevel, revCounts]);


    const usageOptions = Object.entries(BUILDING_USAGE_LABELS).map(([key, label]) => ({
        value: key, label: label
    }));

    const serviceLevelOptions = [
        { value: '1', label: 'レベル 1 (良好 - Waiting Min)' },
        { value: '2', label: 'レベル 2 (標準 - Standard)' },
        { value: '3', label: 'レベル 3 (許容 - Minimum)' },
    ];

    const fixtureTypeLabels: Record<FixtureType, string> = {
        male_closet: '男子大便器',
        male_urinal: '男子小便器',
        male_lavatory: '男子洗面器',
        female_closet: '女子大便器',
        female_lavatory: '女子洗面器',
    };

    return (
        <div className="pb-20">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-background/80 backdrop-blur z-10 py-4 border-b">
                <div className="flex flex-col space-y-1">
                    <h1 className="font-heading text-3xl font-bold tracking-tight">衛生器具数算定</h1>
                    <p className="text-sm text-muted-foreground hidden md:block">SHASE-S 206 準拠 (簡易係数法) シミュレーター</p>
                </div>
                <Button onClick={handleExportPDF} disabled={isExporting} className="gap-2 no-print">
                    {isExporting ? '出力中...' : <><Download size={16} /> レポート出力 (PDF)</>}
                </Button>
            </div>

            <div ref={printRef} className="space-y-12 bg-white dark:bg-slate-950 p-4 md:p-8 rounded-xl" id="report-content">

                {/* A3 Landscape Grid Layout */}
                <div className="grid gap-8 lg:grid-cols-12 print:grid-cols-12">

                    {/* COLUMN 1: CONDITIONS (Input) - Span 3 */}
                    <div className="lg:col-span-3 print:col-span-3 space-y-6">
                        <Card className="shadow-sm h-full border-slate-300">
                            <CardHeader className="border-b pb-4 bg-slate-50">
                                <CardTitle>1. 算定条件</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <Select
                                    id="usage"
                                    label="建物用途"
                                    value={usage}
                                    onChange={(e) => setUsage(e.target.value as BuildingUsage)}
                                    options={usageOptions}
                                />
                                <Select
                                    id="serviceLevel"
                                    label="サービスレベル"
                                    value={serviceLevel}
                                    onChange={(e) => setServiceLevel(Number(e.target.value) as ServiceLevel)}
                                    options={serviceLevelOptions}
                                />
                                <div className="p-3 rounded text-xs bg-blue-50 text-blue-700">
                                    Level 1: 待ち時間が極めて少ない<br />
                                    Level 2: 一般的な許容範囲<br />
                                    Level 3: 混雑の可能性あり
                                </div>

                                <Input
                                    id="population"
                                    label="利用人数 (人)"
                                    type="number"
                                    min="0"
                                    value={population}
                                    onChange={(e) => setPopulation(Number(e.target.value))}
                                    placeholder="例: 100"
                                    className="text-lg font-bold"
                                />

                                <div className="space-y-3 pt-2">
                                    <label className="text-sm font-medium block">男女比率</label>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold w-12 text-right text-blue-600">{maleRatio}%</span>
                                        <Input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={maleRatio}
                                            onChange={(e) => setMaleRatio(Number(e.target.value))}
                                            className="flex-1"
                                        />
                                        <span className="font-bold w-12 text-pink-600">{100 - maleRatio}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>男性: {Math.round(population * maleRatio / 100)}人</span>
                                        <span>女性: {population - Math.round(population * maleRatio / 100)}人</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* COLUMN 2: FORWARD CALCULATION (Results) - Span 5 */}
                    <div className="lg:col-span-5 print:col-span-5 space-y-6">
                        <Card className="border-none shadow-none bg-transparent break-inside-avoid">
                            <CardHeader className="pl-0 pt-0">
                                <CardTitle className="flex items-center gap-2">
                                    3. 必要器具数 (Result)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 space-y-6">
                                {/* Male */}
                                <div className="space-y-3">
                                    <h3 className="text-md font-bold flex items-center gap-2 border-b pb-1 text-blue-800 border-blue-200">
                                        <span className="text-lg">♂</span> 男性 ({Math.round(population * maleRatio / 100)}人)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Male Items */}
                                        {['closet', 'urinal', 'lavatory'].map((key) => {
                                            const k = key as keyof CalculationResult['male'];
                                            const label = key === 'closet' ? '大便器' : key === 'urinal' ? '小便器' : '洗面器';
                                            const val = result?.male[k] || 0;
                                            return (
                                                <div key={key} className="text-center p-2 rounded border bg-white border-slate-200 text-slate-900">
                                                    <div className="text-xs text-slate-500">{label}</div>
                                                    <div className="text-2xl font-extrabold text-slate-800">{val}</div>
                                                    <div className="h-16 mt-1">
                                                        <FixtureGraph usage={usage} fixtureType={`male_${key}` as FixtureType} population={Math.round(population * maleRatio / 100)} small />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Female */}
                                <div className="space-y-3">
                                    <h3 className="text-md font-bold flex items-center gap-2 border-b pb-1 text-pink-800 border-pink-200">
                                        <span className="text-lg">♀</span> 女性 ({population - Math.round(population * maleRatio / 100)}人)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Female Items */}
                                        {['closet', 'lavatory'].map((key) => {
                                            const k = key as keyof CalculationResult['female'];
                                            const label = key === 'closet' ? '大便器' : '洗面器';
                                            const val = result?.female[k] || 0;
                                            return (
                                                <div key={key} className="text-center p-2 rounded border bg-white border-slate-200 text-slate-900">
                                                    <div className="text-xs text-slate-500">{label}</div>
                                                    <div className="text-2xl font-extrabold text-slate-800">{val}</div>
                                                    <div className="h-16 mt-1">
                                                        <FixtureGraph usage={usage} fixtureType={`female_${key}` as FixtureType} population={population - Math.round(population * maleRatio / 100)} small />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* Spacer to match 3 cols */}
                                        <div className="p-2"></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* COLUMN 3: REVERSE CALCULATION - Span 4 */}
                    <div className="lg:col-span-4 print:col-span-4 space-y-6">
                        <Card className="shadow-sm h-full overflow-hidden border-slate-300">
                            <CardHeader className="border-b pb-4 bg-indigo-50">
                                <CardTitle className="flex items-center gap-2 text-indigo-900">
                                    <FileText size={18} /> 2. 逆算定 (Check)
                                </CardTitle>
                                <CardDescription>器具数から対応人数を確認</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-3">
                                    {(Object.keys(fixtureTypeLabels) as FixtureType[]).map((type) => {
                                        const cap = revCapacities[type];
                                        const isActive = revCounts[type] > 0;
                                        return (
                                            <div key={type} className="flex items-center gap-2 p-2 rounded border hover:bg-slate-50 transition-colors">
                                                <div className="w-24 text-sm font-medium text-slate-700">
                                                    {fixtureTypeLabels[type]}
                                                </div>
                                                <div className="w-20">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={revCounts[type]}
                                                        onChange={(e) => handleRevCountChange(type, Number(e.target.value))}
                                                        className="h-8 text-right"
                                                    />
                                                </div>
                                                <div className="flex-1 text-right">
                                                    {isActive && cap ? (
                                                        <span className="text-sm font-bold text-slate-900">
                                                            {cap.min}-{cap.max} <span className="text-xs font-normal text-muted-foreground">人</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-3 bg-slate-50 text-xs text-muted-foreground rounded">
                                    <p>各器具の設置予定数を入力すると、設定したサービスレベルを維持できる適正人数が表示されます。</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* REFERENCE INFO SECTION */}
                <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
                        <Info size={16} /> 算定データの参照情報
                    </h4>

                    <div className="grid md:grid-cols-3 gap-8 text-xs text-muted-foreground">
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1">1. 算定根拠</h5>
                            <p>本ツールは、空気調和・衛生工学会規格「SHASE-S 206 給排水衛生設備規準・同解説」に基づき、利用人員に対する適正な衛生器具数を算定するための簡易シミュレーターです。</p>
                        </div>
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1">2. サービスレベル</h5>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li><strong>Lv1</strong>: 待ち時間極少 (推奨)</li>
                                <li><strong>Lv2</strong>: 標準的</li>
                                <li><strong>Lv3</strong>: 混雑許容 (下限)</li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1">3. 建物用途</h5>
                            <p>用途ごとの滞在時間・集中率を考慮した係数を使用しています。</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
