'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { HandrailInputPanel, type HandrailInputData } from '@/components/handrail/HandrailInputPanel';
import { HandrailResultCard } from '@/components/handrail/HandrailResultCard';
import { SectionVisualizer } from '@/components/handrail/SectionVisualizer';
import { HandrailPdfReport } from '@/components/handrail/HandrailPdfReport';
import {
    calculateFlatBar,
    calculateSquarePipe,
    calculateRoundPipe,
    calculateHBeam,
    calculateCutT,
    checkStrength,
    type SectionProperties,
    type StrengthResult,
} from '@/utils/handrailCalculations';
import { GlassInputPanel, type GlassInputData } from '@/components/handrail/GlassInputPanel';
import { GlassResultCard } from '@/components/handrail/GlassResultCard';
import { calculateGlassStrength, type GlassStrengthResult } from '@/utils/glassCalculations';
import { getStandardParts } from '@/utils/handrailStandardParts';

/**
 * 手すり強度検討ツール
 * JIS A 4709規格に基づく支柱・笠木の強度計算
 */
export default function HandrailStrengthPage() {
    // 共通のデフォルト値
    const defaultInput: HandrailInputData = {
        horizontalLoad: 1470,
        verticalLoad: 1600,
        calculationType: 'column',
        material: 'SS400',
        shape: 'flatbar',
        inputMode: 'standard',
        standardPartIndex: 0,
        postPitch: 1000,
        handrailHeight: 1100,
        isStrongAxis: true,
        isWebUp: true,
    };

    // 支柱用入力データ
    const [columnInput, setColumnInput] = useState<HandrailInputData>({
        ...defaultInput,
        calculationType: 'column',
    });

    // 笠木用入力データ
    const [handrailInput, setHandrailInput] = useState<HandrailInputData>({
        ...defaultInput,
        calculationType: 'handrail',
    });

    // 支柱用の保存済みデータ & 結果
    const [savedColumnData, setSavedColumnData] = useState<HandrailInputData | null>(null);
    const [savedColumnSectionProps, setSavedColumnSectionProps] = useState<SectionProperties | null>(null);
    const [savedColumnResult, setSavedColumnResult] = useState<StrengthResult | null>(null);

    // 笠木用の保存済みデータ & 結果
    const [savedHandrailData, setSavedHandrailData] = useState<HandrailInputData | null>(null);
    const [savedHandrailSectionProps, setSavedHandrailSectionProps] = useState<SectionProperties | null>(null);
    const [savedHandrailResult, setSavedHandrailResult] = useState<StrengthResult | null>(null);

    // ガラス用の入力データ
    const [glassData, setGlassData] = useState<GlassInputData>({
        supportType: 'cantilever',
        glassType: 'tempered',
        isLaminated: true,
        interlayerType: 'pvb',
        thickness1: 10,
        thickness2: 10,
        width: 1000,
        height: 1100,
        designLoad: 1470,
    });
    const [glassResult, setGlassResult] = useState<GlassStrengthResult | null>(null);
    const [savedGlassData, setSavedGlassData] = useState<GlassInputData | null>(null);
    const [savedGlassResult, setSavedGlassResult] = useState<GlassStrengthResult | null>(null);

    // 計算モード (タブ切り替え)
    const [activeTab, setActiveTab] = useState<'column' | 'handrail' | 'glass'>('column');

    // 現在のアクティブな入力データ取得ヘルパー
    const currentInput = activeTab === 'column' ? columnInput : handrailInput;

    // 入力変更ハンドラ
    const handleInputChange = (newData: HandrailInputData) => {
        if (activeTab === 'column') {
            setColumnInput(newData);
        } else if (activeTab === 'handrail') {
            setHandrailInput(newData);
        }
    };

    // --- 断面性能計算 (支柱) ---
    const columnSectionProps: SectionProperties | null = useMemo(() => {
        try {
            if (columnInput.inputMode === 'standard') {
                const standardParts = getStandardParts(columnInput.shape);
                if (standardParts.length === 0) return null;
                const part = standardParts[columnInput.standardPartIndex];

                switch (columnInput.shape) {
                    case 'flatbar': return (part.width && part.thickness) ? calculateFlatBar(part.width, part.thickness) : null;
                    case 'square': return (part.width && part.height && part.thickness) ? calculateSquarePipe(part.width, part.height, part.thickness) : null;
                    case 'round': return (part.diameter && part.thickness) ? calculateRoundPipe(part.diameter, part.thickness) : null;
                    case 'hbeam': return (part.height && part.width && part.webThickness && part.flangeThickness) ? calculateHBeam(part.height, part.width, part.webThickness, part.flangeThickness) : null;
                    case 'cutt': return (part.height && part.width && part.webThickness && part.flangeThickness) ? calculateCutT(part.height, part.width, part.webThickness, part.flangeThickness) : null;
                    default: return null;
                }
            } else {
                switch (columnInput.shape) {
                    case 'flatbar': return (columnInput.customWidth && columnInput.customThickness) ? calculateFlatBar(columnInput.customWidth, columnInput.customThickness) : null;
                    case 'square': return (columnInput.customWidth && columnInput.customHeight && columnInput.customThickness) ? calculateSquarePipe(columnInput.customWidth, columnInput.customHeight, columnInput.customThickness) : null;
                    case 'round': return (columnInput.customDiameter && columnInput.customThickness) ? calculateRoundPipe(columnInput.customDiameter, columnInput.customThickness) : null;
                    case 'hbeam': return (columnInput.customHeight && columnInput.customWidth && columnInput.customWebThickness && columnInput.customFlangeThickness) ? calculateHBeam(columnInput.customHeight, columnInput.customWidth, columnInput.customWebThickness, columnInput.customFlangeThickness) : null;
                    case 'cutt': return (columnInput.customHeight && columnInput.customWidth && columnInput.customWebThickness && columnInput.customFlangeThickness) ? calculateCutT(columnInput.customHeight, columnInput.customWidth, columnInput.customWebThickness, columnInput.customFlangeThickness) : null;
                    default: return null;
                }
            }
        } catch (e) { console.error(e); return null; }
    }, [columnInput]);

    // --- 断面性能計算 (笠木) ---
    const handrailSectionProps: SectionProperties | null = useMemo(() => {
        try {
            if (handrailInput.inputMode === 'standard') {
                const standardParts = getStandardParts(handrailInput.shape);
                if (standardParts.length === 0) return null;
                const part = standardParts[handrailInput.standardPartIndex];

                switch (handrailInput.shape) {
                    case 'flatbar': return (part.width && part.thickness) ? calculateFlatBar(part.width, part.thickness) : null;
                    case 'square': return (part.width && part.height && part.thickness) ? calculateSquarePipe(part.width, part.height, part.thickness) : null;
                    case 'round': return (part.diameter && part.thickness) ? calculateRoundPipe(part.diameter, part.thickness) : null;
                    case 'hbeam': return (part.height && part.width && part.webThickness && part.flangeThickness) ? calculateHBeam(part.height, part.width, part.webThickness, part.flangeThickness) : null;
                    case 'cutt': return (part.height && part.width && part.webThickness && part.flangeThickness) ? calculateCutT(part.height, part.width, part.webThickness, part.flangeThickness) : null;
                    default: return null;
                }
            } else {
                switch (handrailInput.shape) {
                    case 'flatbar': return (handrailInput.customWidth && handrailInput.customThickness) ? calculateFlatBar(handrailInput.customWidth, handrailInput.customThickness) : null;
                    case 'square': return (handrailInput.customWidth && handrailInput.customHeight && handrailInput.customThickness) ? calculateSquarePipe(handrailInput.customWidth, handrailInput.customHeight, handrailInput.customThickness) : null;
                    case 'round': return (handrailInput.customDiameter && handrailInput.customThickness) ? calculateRoundPipe(handrailInput.customDiameter, handrailInput.customThickness) : null;
                    case 'hbeam': return (handrailInput.customHeight && handrailInput.customWidth && handrailInput.customWebThickness && handrailInput.customFlangeThickness) ? calculateHBeam(handrailInput.customHeight, handrailInput.customWidth, handrailInput.customWebThickness, handrailInput.customFlangeThickness) : null;
                    case 'cutt': return (handrailInput.customHeight && handrailInput.customWidth && handrailInput.customWebThickness && handrailInput.customFlangeThickness) ? calculateCutT(handrailInput.customHeight, handrailInput.customWidth, handrailInput.customWebThickness, handrailInput.customFlangeThickness) : null;
                    default: return null;
                }
            }
        } catch (e) { console.error(e); return null; }
    }, [handrailInput]);


    // --- 入力値同期 (初期のみ、あるいは必要に応じて) ---
    // ここでは省略。完全に独立させる。

    // --- 強度判定 (支柱) ---
    const columnResult: StrengthResult | null = useMemo(() => {
        if (!columnSectionProps) return null;
        try {
            return checkStrength(
                columnSectionProps,
                columnInput.material,
                columnInput.horizontalLoad,
                columnInput.verticalLoad,
                columnInput.handrailHeight,
                columnInput.postPitch,
                true // isColumn
            );
        } catch (e) { console.error(e); return null; }
    }, [columnSectionProps, columnInput]);

    // --- 強度判定 (笠木) ---
    const handrailResult: StrengthResult | null = useMemo(() => {
        if (!handrailSectionProps) return null;
        try {
            return checkStrength(
                handrailSectionProps,
                handrailInput.material,
                handrailInput.horizontalLoad,
                handrailInput.verticalLoad,
                handrailInput.handrailHeight,
                handrailInput.postPitch,
                false // isColumn (Handrail)
            );
        } catch (e) { console.error(e); return null; }
    }, [handrailSectionProps, handrailInput]);


    // 水平荷重の同期 (支柱設定 -> ガラス設定)
    // 支柱の荷重が変わったらガラスのデフォルトも変える
    React.useEffect(() => {
        setGlassData(prev => ({
            ...prev,
            designLoad: columnInput.horizontalLoad
        }));
    }, [columnInput.horizontalLoad]);

    // ガラス強度計算
    const calculatedGlassResult = useMemo(() => {
        return calculateGlassStrength(glassData);
    }, [glassData]);

    // ガラス結果の更新 (表示用)
    React.useEffect(() => {
        setGlassResult(calculatedGlassResult);
    }, [calculatedGlassResult]);

    // 保存関数更新
    const saveCurrentResult = () => {
        if (activeTab === 'column') {
            setSavedColumnData(columnInput);
            setSavedColumnSectionProps(columnSectionProps);
            setSavedColumnResult(columnResult);
        } else if (activeTab === 'handrail') {
            setSavedHandrailData(handrailInput);
            setSavedHandrailSectionProps(handrailSectionProps);
            setSavedHandrailResult(handrailResult);
        } else {
            setSavedGlassData(glassData);
            setSavedGlassResult(calculatedGlassResult);
        }
    };

    // 表示用の現在の結果を取得
    const currentResult = activeTab === 'column' ? columnResult : activeTab === 'handrail' ? handrailResult : null;
    const currentSectionProps = activeTab === 'column' ? columnSectionProps : activeTab === 'handrail' ? handrailSectionProps : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="container mx-auto p-6">
                {/* ヘッダー */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 mb-2">手すり強度検討ツール</h1>
                        <p className="text-slate-600">JIS A 4709規格に基づく支柱・笠木の強度計算</p>
                    </div>
                    {/* PDFレポートボタン */}
                    {(savedColumnData || savedHandrailData) && (
                        <HandrailPdfReport
                            columnData={savedColumnData || undefined}
                            columnSectionProps={savedColumnSectionProps}
                            columnResult={savedColumnResult}
                            handrailData={savedHandrailData || undefined}
                            handrailSectionProps={savedHandrailSectionProps}
                            handrailResult={savedHandrailResult}
                            glassData={savedGlassData || undefined}
                            glassResult={savedGlassResult}
                        />
                    )}
                </div>

                {/* タブ切り替え */}
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
                    <button
                        onClick={() => setActiveTab('column')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'column' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        支柱の検討
                    </button>
                    <button
                        onClick={() => setActiveTab('handrail')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'handrail' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        笠木の検討
                    </button>
                    <button
                        onClick={() => setActiveTab('glass')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'glass' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        ガラス面材の検討
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左サイドバー: 入力パネル */}
                    <div className="lg:col-span-1">
                        {activeTab !== 'glass' ? (
                            <HandrailInputPanel data={currentInput} onChange={handleInputChange} />
                        ) : (
                            <GlassInputPanel data={glassData} onChange={setGlassData} />
                        )}

                        {/* 結果保存ボタン */}
                        <div className="mt-4">
                            <button
                                onClick={saveCurrentResult}
                                className={`w-full py-3 px-4 text-white rounded-lg transition-colors font-medium shadow-md ${activeTab === 'glass' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {activeTab === 'column' ? '支柱の結果を保存' :
                                    activeTab === 'handrail' ? '笠木の結果を保存' : 'ガラスの結果を保存'}
                            </button>

                            {/* 保存済みメッセージ */}
                            {activeTab === 'column' && savedColumnData && (
                                <p className="mt-2 text-sm text-green-600">✓ 支柱の結果が保存されました</p>
                            )}
                            {activeTab === 'handrail' && savedHandrailData && (
                                <p className="mt-2 text-sm text-green-600">✓ 笠木の結果が保存されました</p>
                            )}
                            {activeTab === 'glass' && savedGlassData && (
                                <p className="mt-2 text-sm text-cyan-600">✓ ガラスの結果が保存されました</p>
                            )}
                        </div>
                    </div>

                    {/* メインエリア: 結果表示 */}
                    <div className="lg:col-span-2 space-y-6">
                        {activeTab !== 'glass' ? (
                            <>
                                {/* 断面図の表示 */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>断面図</CardTitle>
                                        <CardDescription>選択した部材の断面形状</CardDescription>
                                    </CardHeader>
                                    <SectionVisualizer
                                        shape={currentInput.shape}
                                        isStrongAxis={currentInput.isStrongAxis}
                                        isWebUp={currentInput.isWebUp}
                                    />
                                </Card>

                                {/* 計算結果 */}
                                <HandrailResultCard result={currentResult} sectionProps={currentSectionProps} />
                            </>
                        ) : (
                            <GlassResultCard result={glassResult} />
                        )}
                    </div>
                </div>

                {/* フッター情報 */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">計算の前提条件</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• JIS A 4709（建築用手すり）に準拠した計算を行います</li>
                        <li>
                            • 支柱の検討: 片持ち梁として計算（先端に集中荷重が作用する想定）
                        </li>
                        <li>• 笠木の検討: 単純梁として計算（等分布荷重が作用する想定）</li>
                        <li>• 設計荷重でのたわみ: 参考値として表示（判定なし）</li>
                        <li>• 日常荷重（295 N/m）でのたわみ: L/100、L/50で判定</li>
                        <li>• 計算結果は設計の参考値であり、実際の設計では構造技術者の確認が必要です</li>
                    </ul>
                </div>
            </div>
        </div>
    );

}
