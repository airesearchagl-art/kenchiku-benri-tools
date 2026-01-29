'use client';

import React, { useRef } from 'react';
import { HandrailInputData } from './HandrailInputPanel';
import { SectionProperties, StrengthResult } from '@/utils/handrailCalculations';
import { GlassCalculationInput, GlassStrengthResult } from '@/utils/glassCalculations'; // 追加
import { getStandardParts } from '@/utils/handrailStandardParts';
import { FileDown } from 'lucide-react';

interface HandrailPdfReportProps {
    columnData?: HandrailInputData;
    columnSectionProps?: SectionProperties | null;
    columnResult?: StrengthResult | null;
    handrailData?: HandrailInputData;
    handrailSectionProps?: SectionProperties | null;
    handrailResult?: StrengthResult | null;
    // ガラス用データ追加
    glassData?: GlassCalculationInput;
    glassResult?: GlassStrengthResult | null;
}

function getPartDescription(data: HandrailInputData | undefined): string {
    if (!data) return '-';
    if (data.inputMode === 'standard') {
        const parts = getStandardParts(data.shape);
        return parts[data.standardPartIndex]?.label || '不明な規格品';
    } else {
        // カスタム
        switch (data.shape) {
            case 'flatbar': return `FB-${data.customThickness}×${data.customWidth} (カスタム)`;
            case 'square': return `□-${data.customWidth}×${data.customHeight}×${data.customThickness} (カスタム)`;
            case 'round': return `Φ-${data.customDiameter}×${data.customThickness} (カスタム)`;
            case 'hbeam': return `H-${data.customHeight}×${data.customWidth}×${data.customWebThickness}×${data.customFlangeThickness} (カスタム)`;
            case 'cutt': return `CT-${data.customHeight}×${data.customWidth}×${data.customWebThickness}×${data.customFlangeThickness} (カスタム)`;
            default: return 'カスタムサイズ';
        }
    }
}

/**
 * PDFレポート生成コンポーネント
 * html2canvasを使用してDOMを画像化し、PDFとして出力する
 */
export function HandrailPdfReport({
    columnData,
    columnSectionProps,
    columnResult,
    handrailData,
    handrailSectionProps,
    handrailResult,
    glassData,
    glassResult,
}: HandrailPdfReportProps) {
    const reportRef = useRef<HTMLDivElement>(null);
    const handlePrint = () => {
        window.print();
    };

    // 現在の日付
    const dateStr = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <>
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md no-print"
            >
                <FileDown className="w-5 h-5" />
                <span>PDFレポート印刷 / 保存</span>
            </button>

            {/* 
              印刷用レイアウト
              通常時は非表示、印刷時のみ表示するクラス (print-only) を付与
              Tailwindの print:block などを利用してもよいが、画面外に出すのではなく
              印刷時のみ可視化する方針に変更
            */}
            <div className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:bg-white print:z-[9999]">
                <div ref={reportRef} className="p-12 max-w-[210mm] mx-auto min-h-[297mm]" style={{ fontFamily: 'sans-serif', color: '#0f172a' }}>

                    {/* ヘッダー (1ページ目) */}
                    <div style={{ borderBottom: '2px solid #1e293b', paddingBottom: '16px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>手すり強度検討報告書</h1>
                            <p style={{ color: '#64748b', marginTop: '4px', margin: 0, fontSize: '14px' }}>JIS A 4709 / BL基準準拠</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>作成日: {dateStr}</p>
                        </div>
                    </div>

                    {/* 1. 支柱の検討 */}
                    {columnResult && columnResult.post && columnSectionProps && columnData && (
                        <div style={{ marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', borderLeft: '4px solid #2563eb', paddingLeft: '12px', marginBottom: '16px', backgroundColor: '#eff6ff', padding: '8px 12px', color: '#1e293b' }}>
                                1. 支柱の検討（片持ち梁モデル）
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontWeight: '600', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>設計条件</h3>
                                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', width: '96px', fontWeight: 'normal' }}>検討部位</th><td>支柱</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>材質</th><td>{columnData.material}</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>使用部材</th><td>{getPartDescription(columnData)}</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>水平荷重 Ph</th><td>{columnData.horizontalLoad} N/m</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>手すり高さ H</th><td>{columnData.handrailHeight} mm</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>支柱ピッチ L</th><td>{columnData.postPitch} mm</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: '600', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>断面性能（強軸）</h3>
                                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', width: '128px', fontWeight: 'normal' }}>断面二次モーメント I</th><td style={{ fontFamily: 'monospace' }}>{columnSectionProps.Ix.toExponential(3)} mm⁴</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>断面係数 Z</th><td style={{ fontFamily: 'monospace' }}>{columnSectionProps.Zx.toExponential(3)} mm³</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>断面積 A</th><td style={{ fontFamily: 'monospace' }}>{columnSectionProps.area.toFixed(2)} mm²</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontWeight: '600', color: '#334155', marginBottom: '12px' }}>計算結果</h3>
                                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                            <th style={{ textAlign: 'left', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>検討項目</th>
                                            <th style={{ textAlign: 'right', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>計算値</th>
                                            <th style={{ textAlign: 'right', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>許容値/制限値</th>
                                            <th style={{ textAlign: 'center', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>判定</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '8px 0', fontWeight: '500' }}>曲げ応力度</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{columnResult.post.bendingStress.toFixed(2)} N/mm²</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{columnResult.post.allowableStress.toFixed(2)} N/mm²</td>
                                            <td style={{ textAlign: 'center', padding: '8px 0' }}>
                                                <Badge isOK={columnResult.post.isStressOK} />
                                            </td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '8px 0', fontWeight: '500' }}>たわみ (設計荷重)</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{columnResult.post.deflection.toFixed(2)} mm</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', color: '#64748b' }}>-</td>
                                            <td style={{ textAlign: 'center', padding: '8px 0', fontSize: '12px', color: '#64748b' }}>参考値</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '8px 0', fontWeight: '500' }}>たわみ (日常荷重 295N/m)</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{columnResult.post.dailyLoadDeflection.toFixed(2)} mm</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{(columnData.handrailHeight / 100).toFixed(2)} mm</td>
                                            <td style={{ textAlign: 'center', padding: '8px 0' }}>
                                                <Badge isOK={columnResult.post.isDailyLoadDeflectionOK} />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 2. 笠木の検討 */}
                    {handrailResult && handrailResult.handrail && handrailSectionProps && handrailData && (
                        <div style={{ marginBottom: '40px', pageBreakBefore: 'always' }}>
                            {/* 2ページ目以降用ヘッダー（簡易） */}
                            <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-800">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-sm text-slate-500">手すり強度検討報告書</div>
                                        <div className="font-bold text-slate-800">2. 笠木の検討</div>
                                    </div>
                                    <div className="text-xs text-slate-400">{dateStr}</div>
                                </div>
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', borderLeft: '4px solid #16a34a', paddingLeft: '12px', marginBottom: '16px', backgroundColor: '#f0fdf4', padding: '8px 12px', color: '#1e293b' }}>
                                2. 笠木の検討（単純梁モデル）
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontWeight: '600', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>設計条件</h3>
                                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', width: '96px', fontWeight: 'normal' }}>検討部位</th><td>笠木</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>材質</th><td>{handrailData.material}</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>使用部材</th><td>{getPartDescription(handrailData)}</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>鉛直荷重 Pv</th><td>{handrailData.verticalLoad} N/m</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>水平荷重 Ph</th><td>{handrailData.horizontalLoad} N/m</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>支柱ピッチ L</th><td>{handrailData.postPitch} mm</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <h3 style={{ fontWeight: '600', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>断面性能（強軸: 鉛直用）</h3>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', fontFamily: 'monospace' }}>
                                            <span>Ix: {handrailSectionProps.Ix.toExponential(2)}</span>
                                            <span>Zx: {handrailSectionProps.Zx.toExponential(2)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: '600', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>断面性能（弱軸: 水平用）</h3>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', fontFamily: 'monospace' }}>
                                            <span>Iy: {handrailSectionProps.Iy.toExponential(2)}</span>
                                            <span>Zy: {handrailSectionProps.Zy.toExponential(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 鉛直荷重 */}
                            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                                <h3 style={{ fontWeight: '600', color: '#1d4ed8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ■ 鉛直荷重の検討（強軸）
                                </h3>
                                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                            <th style={{ textAlign: 'left', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>検討項目</th>
                                            <th style={{ textAlign: 'right', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>計算値</th>
                                            <th style={{ textAlign: 'right', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>許容値</th>
                                            <th style={{ textAlign: 'center', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>判定</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '8px 0', fontWeight: '500' }}>曲げ応力度</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{handrailResult.handrail.vertical.bendingStress.toFixed(2)} N/mm²</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{handrailResult.handrail.vertical.allowableStress.toFixed(2)} N/mm²</td>
                                            <td style={{ textAlign: 'center', padding: '8px 0' }}>
                                                <Badge isOK={handrailResult.handrail.vertical.isOK} />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '8px 0', fontWeight: '500' }}>たわみ</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{handrailResult.handrail.vertical.deflection.toFixed(2)} mm</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', color: '#64748b' }}>-</td>
                                            <td style={{ textAlign: 'center', padding: '8px 0', fontSize: '12px', color: '#64748b' }}>参考値</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* 水平荷重 */}
                            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontWeight: '600', color: '#15803d', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ■ 水平荷重の検討（弱軸）
                                </h3>
                                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                            <th style={{ textAlign: 'left', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>検討項目</th>
                                            <th style={{ textAlign: 'right', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>計算値</th>
                                            <th style={{ textAlign: 'right', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>許容値</th>
                                            <th style={{ textAlign: 'center', padding: '8px 0', width: '25%', fontWeight: '600', color: '#475569' }}>判定</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '8px 0', fontWeight: '500' }}>曲げ応力度</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{handrailResult.handrail.horizontal.bendingStress.toFixed(2)} N/mm²</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{handrailResult.handrail.horizontal.allowableStress.toFixed(2)} N/mm²</td>
                                            <td style={{ textAlign: 'center', padding: '8px 0' }}>
                                                <Badge isOK={handrailResult.handrail.horizontal.isOK} />
                                            </td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '8px 0', fontWeight: '500' }}>たわみ (設計荷重)</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{handrailResult.handrail.horizontal.deflection.toFixed(2)} mm</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', color: '#64748b' }}>-</td>
                                            <td style={{ textAlign: 'center', padding: '8px 0', fontSize: '12px', color: '#64748b' }}>参考値</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '8px 0', fontWeight: '500' }}>たわみ (日常荷重 295N/m)</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{handrailResult.handrail.horizontal.dailyLoadDeflection.toFixed(2)} mm</td>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace' }}>{(handrailData.postPitch / 100).toFixed(2)} mm</td>
                                            <td style={{ textAlign: 'center', padding: '8px 0' }}>
                                                <Badge isOK={handrailResult.handrail.horizontal.isDailyLoadDeflectionOK} />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {/* === 3. ガラスの検討 === */}
                    {glassData && glassResult && (
                        <div style={{ marginBottom: '40px', pageBreakBefore: 'always' }}>
                            {/* 3ページ目以降用ヘッダー（簡易） */}
                            <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-800">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-sm text-slate-500">手すり強度検討報告書</div>
                                        <div className="font-bold text-slate-800">ガラス面材の検討</div>
                                    </div>
                                    <div className="text-xs text-slate-400">{dateStr}</div>
                                </div>
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', borderLeft: '4px solid #16a34a', paddingLeft: '12px', marginBottom: '16px', backgroundColor: '#f0fdf4', padding: '8px 12px', color: '#1e293b' }}>
                                3. ガラス面材の検討
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontWeight: '600', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>設計条件</h3>
                                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>支持形式</th><td>{glassData.supportType === 'cantilever' ? '自立タイプ' : glassData.supportType === 'two_edge' ? '2辺支持' : '4辺支持'}</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>ガラス種別</th><td>{glassData.glassType.toUpperCase()}</td></tr>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>構成</th>
                                                <td>
                                                    {glassData.isLaminated ? (
                                                        <>合わせ {glassData.thickness1}+{glassData.thickness2}mm {glassData.interlayerType === 'rigid' ? '(硬質膜)' : '(PVB)'}</>
                                                    ) : (
                                                        <>単板 {glassData.thickness1}mm</>
                                                    )}
                                                </td>
                                            </tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>寸法 (W×H)</th><td>{glassData.width} × {glassData.height} mm</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: '600', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>断面性能</h3>
                                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>計算等価厚</th><td>{glassResult.thicknessForCalc.toFixed(1)} mm</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>断面係数 Z</th><td>{glassResult.sectionModulus.toFixed(0)} mm³</td></tr>
                                            <tr><th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b', fontWeight: 'normal' }}>断面二次モーメント I</th><td>{glassResult.momentOfInertia.toFixed(0)} mm⁴</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontWeight: '600', color: '#334155', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>検討結果</h3>

                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>1. 曲げ強度の検討</h4>
                                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                        <thead style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'normal' }}>項目</th>
                                                <th style={{ textAlign: 'right', padding: '8px', fontWeight: 'normal' }}>計算値</th>
                                                <th style={{ textAlign: 'right', padding: '8px', fontWeight: 'normal' }}>許容値</th>
                                                <th style={{ textAlign: 'center', padding: '8px', fontWeight: 'normal' }}>判定</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '8px', fontWeight: 'bold' }}>曲げ応力度</td>
                                                <td style={{ padding: '8px', textAlign: 'right' }}>{glassResult.bendingStress.toFixed(2)} N/mm²</td>
                                                <td style={{ padding: '8px', textAlign: 'right' }}>{glassResult.allowableStress} N/mm²</td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    {glassResult.isStressOK ?
                                                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>OK</span> :
                                                        <span style={{ color: '#dc2626', fontWeight: 'bold' }}>NG</span>
                                                    }
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>2. たわみの検討</h4>
                                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                        <thead style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'normal' }}>項目</th>
                                                <th style={{ textAlign: 'right', padding: '8px', fontWeight: 'normal' }}>計算値</th>
                                                <th style={{ textAlign: 'right', padding: '8px', fontWeight: 'normal' }}>目安値 (1/100)</th>
                                                <th style={{ textAlign: 'center', padding: '8px', fontWeight: 'normal' }}>判定</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '8px', fontWeight: 'bold' }}>最大たわみ</td>
                                                <td style={{ padding: '8px', textAlign: 'right' }}>{glassResult.deflection.toFixed(2)} mm</td>
                                                <td style={{ padding: '8px', textAlign: 'right' }}>{glassResult.limitDeflection.toFixed(1)} mm</td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    {glassResult.isDeflectionOK ?
                                                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>OK</span> :
                                                        <span style={{ color: '#ca8a04', fontWeight: 'bold' }}>注意</span>
                                                    }
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* フッター */}
                <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px' }}>
                    <span>Architectural Tools / 手すり強度検討ツール</span>
                    <span>{new Date().toLocaleDateString('ja-JP')}</span>
                </div>
            </div>
        </>
    );
}

function Badge({ isOK, warningLabel = 'NG' }: { isOK: boolean; warningLabel?: string }) {
    if (isOK) {
        return <span style={{ display: 'inline-block', padding: '4px 12px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: 'bold', borderRadius: '9999px' }}>OK</span>;
    }
    const isWarning = warningLabel === '注意';
    return (
        <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: isWarning ? '#fef9c3' : '#fee2e2',
            color: isWarning ? '#854d0e' : '#991b1b',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '9999px'
        }}>
            {warningLabel}
        </span>
    );
}


