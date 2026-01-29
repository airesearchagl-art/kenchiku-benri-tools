import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
    RotateCcw,
    Settings2,
    ArrowRightLeft,
    ArrowUpDown,
    CheckCircle2,
    Ruler,
    ShieldCheck,
    ArrowRight
} from 'lucide-react';
import { getStandardParts, type StandardPart } from '@/utils/handrailStandardParts';
import { MATERIAL_PROPERTIES, SHAPE_LABELS, LOAD_STANDARDS } from '@/utils/handrailCalculations';

// 手すり強度計算用の入力データ型定義
export interface HandrailInputData {
    // 荷重設定
    horizontalLoad: number; // 水平荷重 Ph (N/m) - 2950 / 1470 / 980 / custom
    verticalLoad: number;   // 鉛直荷重 Pv (N/m) - デフォルト1600 (BL基準)
    customHorizontalLoad?: number; // カスタム水平荷重入力値

    calculationType: 'column' | 'handrail'; // 検討部位: 支柱(column) / 笠木(handrail)
    material: keyof typeof MATERIAL_PROPERTIES; // 材質
    shape: 'flatbar' | 'square' | 'round' | 'hbeam' | 'cutt'; // 断面形状

    // 寸法データ
    postPitch: number;      // 支柱ピッチ L (mm)
    handrailHeight: number; // 手すり高さ H (mm)

    inputMode: 'standard' | 'custom'; // 規格品選択かカスタム入力か
    standardPartIndex: number; // 規格品リストのインデックス

    // カスタム入力用プロパティ
    customWidth?: number;     // 幅 B
    customHeight?: number;    // 高さ H
    customThickness?: number; // 厚さ t
    customDiameter?: number;  // 外径 D (丸パイプ用)
    customWebThickness?: number;    // ウェブ厚 t1
    customFlangeThickness?: number; // フランジ厚 t2

    // 特殊条件
    isStrongAxis: boolean; // フラットバーの強軸使用フラグ
    isWebUp: boolean;      // カットTのウェブ上向きフラグ
}

interface HandrailInputPanelProps {
    data: HandrailInputData;
    onChange: (data: HandrailInputData) => void;
}

/**
 * 左サイドバー用の入力パネルコンポーネント
 */
export function HandrailInputPanel({ data, onChange }: HandrailInputPanelProps) {
    const [standardParts, setStandardParts] = useState<StandardPart[]>([]);

    // 断面形状が変わったら規格品リストを更新
    useEffect(() => {
        const parts = getStandardParts(data.shape);
        setStandardParts(parts);
        // 規格品リストが変わったらインデックスをリセット
        if (data.inputMode === 'standard' && parts.length > 0) {
            onChange({ ...data, standardPartIndex: 0 });
        }
    }, [data.shape]);

    const updateData = (updates: Partial<HandrailInputData>) => {
        onChange({ ...data, ...updates });
    };

    // 鉛直荷重のリセット
    const resetVerticalLoad = () => {
        updateData({ verticalLoad: 1600 });
    };

    return (
        <div className="space-y-4">
            {/* 荷重設定 (Load Settings) */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        荷重設定 (Load Settings)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* A. 水平荷重 (Ph) */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700">
                            A. 水平荷重 ($P_H$)
                        </label>
                        <select
                            className="w-full p-2 border rounded bg-white"
                            value={data.customHorizontalLoad ? 'custom' : data.horizontalLoad}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'custom') {
                                    updateData({ customHorizontalLoad: 2950, horizontalLoad: 2950 });
                                } else {
                                    updateData({ customHorizontalLoad: undefined, horizontalLoad: Number(val) });
                                }
                            }}
                        >
                            <option value={2950}>2950 N/m（集客施設・群衆 / JIS）</option>
                            <option value={1470}>1470 N/m（事務所・共用部 / JIS）</option>
                            <option value={980}>980 N/m（住宅・ベランダ / JIS）</option>
                            <option value="custom">カスタム値...</option>
                        </select>
                        {data.customHorizontalLoad !== undefined && (
                            <div className="mt-2 flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={data.customHorizontalLoad}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        updateData({ customHorizontalLoad: val, horizontalLoad: val });
                                    }}
                                    className="bg-white"
                                />
                                <span className="text-sm">N/m</span>
                            </div>
                        )}
                    </div>

                    {/* B. 鉛直荷重 (Pv) */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-medium text-slate-700">
                                B. 鉛直荷重 ($P_V$)
                            </label>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                                BL基準推奨値
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={data.verticalLoad}
                                onChange={(e) => updateData({ verticalLoad: Number(e.target.value) })}
                                className="bg-white"
                            />
                            <span className="text-sm shrink-0">N/m</span>
                            {data.verticalLoad !== 1600 && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={resetVerticalLoad}
                                    title="BL基準値(1600)にリセット"
                                    className="shrink-0 h-9 w-9"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 計算ロジックの説明 */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                        {data.calculationType === 'column' ? '支柱の検討条件' : '笠木の検討条件'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-3 bg-slate-50 rounded text-xs text-slate-600 leading-relaxed border border-slate-100">
                        {data.calculationType === 'column' ? (
                            <>
                                <p className="font-semibold text-indigo-600 mb-1 flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" />
                                    片持ち梁モデル (Cantilever)
                                </p>
                                <p>水平荷重 $P_H$ による曲げのみを検討します。鉛直荷重による圧縮力は無視します。</p>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold text-indigo-600 mb-1 flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" />
                                    単純梁モデル (Simple Beam)
                                </p>
                                <p>① 鉛直荷重 $P_V$ (1600 N/m) → 強軸検討</p>
                                <p>② 水平荷重 $P_H$ → 弱軸検討</p>
                                <p>両方の安全性を確認します。</p>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 材質選択 */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">部材選定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">材質</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={data.material}
                            onChange={(e) => updateData({ material: e.target.value as any })}
                        >
                            <option value="SS400">スチール（SS400）</option>
                            <option value="STKR400">スチール（STKR400）</option>
                            <option value="SUS304">ステンレス（SUS304）</option>
                            <option value="A6063">アルミ（A6063）</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">断面形状</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={data.shape}
                            onChange={(e) => updateData({ shape: e.target.value as any })}
                        >
                            <option value="flatbar">フラットバー（FB）</option>
                            <option value="square">角形鋼管（□）</option>
                            <option value="round">丸パイプ（Φ）</option>
                            <option value="hbeam">H形鋼（H）</option>
                            <option value="cutt">カットT（CT）</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* サイズ指定方法の切り替え */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2 mb-4">
                        <button
                            className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${data.inputMode === 'standard'
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            onClick={() => updateData({ inputMode: 'standard' })}
                        >
                            規格品から選択
                        </button>
                        <button
                            className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${data.inputMode === 'custom'
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            onClick={() => updateData({ inputMode: 'custom' })}
                        >
                            カスタム入力
                        </button>
                    </div>

                    {/* 規格品選択モード */}
                    {data.inputMode === 'standard' && (
                        <div>
                            {standardParts.length > 0 ? (
                                <select
                                    className="w-full p-2 border rounded"
                                    value={data.standardPartIndex}
                                    onChange={(e) => updateData({ standardPartIndex: Number(e.target.value) })}
                                >
                                    {standardParts.map((part, index) => (
                                        <option key={index} value={index}>
                                            {part.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-muted-foreground">規格品リストがありません</p>
                            )}
                        </div>
                    )}

                    {/* カスタム入力モード */}
                    {data.inputMode === 'custom' && (
                        <div className="space-y-3">
                            {/* フラットバー */}
                            {data.shape === 'flatbar' && (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium mb-1">幅 B (mm)</label>
                                            <Input
                                                type="number"
                                                value={data.customWidth || ''}
                                                onChange={(e) => updateData({ customWidth: Number(e.target.value) })}
                                                placeholder="65"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">厚さ t (mm)</label>
                                            <Input
                                                type="number"
                                                value={data.customThickness || ''}
                                                onChange={(e) => updateData({ customThickness: Number(e.target.value) })}
                                                placeholder="9"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            {/* 他の形状のカスタム入力 */}
                            {data.shape === 'square' && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">幅 B</label>
                                        <Input
                                            type="number"
                                            value={data.customWidth || ''}
                                            onChange={(e) => updateData({ customWidth: Number(e.target.value) })}
                                            placeholder="50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">高さ H</label>
                                        <Input
                                            type="number"
                                            value={data.customHeight || ''}
                                            onChange={(e) => updateData({ customHeight: Number(e.target.value) })}
                                            placeholder="50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">肉厚 t</label>
                                        <Input
                                            type="number"
                                            value={data.customThickness || ''}
                                            onChange={(e) => updateData({ customThickness: Number(e.target.value) })}
                                            placeholder="2.3"
                                        />
                                    </div>
                                </div>
                            )}
                            {data.shape === 'round' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">外径 D</label>
                                        <Input
                                            type="number"
                                            value={data.customDiameter || ''}
                                            onChange={(e) => updateData({ customDiameter: Number(e.target.value) })}
                                            placeholder="48.6"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">肉厚 t</label>
                                        <Input
                                            type="number"
                                            value={data.customThickness || ''}
                                            onChange={(e) => updateData({ customThickness: Number(e.target.value) })}
                                            placeholder="2.3"
                                        />
                                    </div>
                                </div>
                            )}
                            {(data.shape === 'hbeam' || data.shape === 'cutt') && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">高さ H</label>
                                        <Input
                                            type="number"
                                            value={data.customHeight || ''}
                                            onChange={(e) => updateData({ customHeight: Number(e.target.value) })}
                                            placeholder="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">幅 B</label>
                                        <Input
                                            type="number"
                                            value={data.customWidth || ''}
                                            onChange={(e) => updateData({ customWidth: Number(e.target.value) })}
                                            placeholder="50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">ウェブ厚 t1</label>
                                        <Input
                                            type="number"
                                            value={data.customWebThickness || ''}
                                            onChange={(e) => updateData({ customWebThickness: Number(e.target.value) })}
                                            placeholder="5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">フランジ厚 t2</label>
                                        <Input
                                            type="number"
                                            value={data.customFlangeThickness || ''}
                                            onChange={(e) => updateData({ customFlangeThickness: Number(e.target.value) })}
                                            placeholder="7"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* フラットバー専用: 弱軸/強軸切り替え */}
            {data.shape === 'flatbar' && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">使用方向（置き方）</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <button
                                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${data.isStrongAxis
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                onClick={() => updateData({ isStrongAxis: true })}
                            >
                                縦使い（強軸）
                            </button>
                            <button
                                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${!data.isStrongAxis
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                onClick={() => updateData({ isStrongAxis: false })}
                            >
                                平使い（弱軸）
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* カットT専用: ウェブの向き */}
            {data.shape === 'cutt' && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">ウェブの向き</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <button
                                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${data.isWebUp
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                onClick={() => updateData({ isWebUp: true })}
                            >
                                ウェブ上向き
                            </button>
                            <button
                                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${!data.isWebUp
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                onClick={() => updateData({ isWebUp: false })}
                            >
                                フランジ上向き
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 寸法入力エリア - 常に両方表示する */}
            <div className="grid grid-cols-2 gap-4">
                {/* 支柱ピッチ L */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">支柱ピッチ L (mm)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Input
                                type="number"
                                value={data.postPitch}
                                onChange={(e) => updateData({ postPitch: Number(e.target.value) })}
                                placeholder="1200"
                                step={50} // 50mm単位
                            />
                            <p className="text-xs text-muted-foreground">
                                {data.calculationType === 'column'
                                    ? '受ける荷重の幅として影響'
                                    : 'スパンとして4乗で影響'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 手すり高さ H */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">手すり高さ H (mm)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Input
                                type="number"
                                value={data.handrailHeight}
                                onChange={(e) => updateData({ handrailHeight: Number(e.target.value) })}
                                placeholder="1100"
                                step={50} // 50mm単位
                            />
                            <p className="text-xs text-muted-foreground">
                                {data.calculationType === 'column'
                                    ? '腕の長さとして3乗で影響'
                                    : '強度には影響しません'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
