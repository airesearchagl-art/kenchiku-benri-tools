import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import {
    GlassCalculationInput,
    GlassType,
    SupportType,
    InterlayerType
} from '@/utils/glassCalculations';

export interface GlassInputData extends GlassCalculationInput {
    // UI用の拡張があればここに追加
}

interface Props {
    data: GlassInputData;
    onChange: (data: GlassInputData) => void;
}

export const GlassInputPanel: React.FC<Props> = ({ data, onChange }) => {

    const handleChange = (key: keyof GlassInputData, value: string | number | boolean) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <Card className="h-full bg-white/50 backdrop-blur-sm border-slate-200">
            <CardContent className="p-6 space-y-6">

                {/* 支持形式 */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">1. 支持形式</label>
                    <select
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={data.supportType}
                        onChange={(e) => handleChange('supportType', e.target.value as SupportType)}
                    >
                        <option value="cantilever">自立タイプ (片持ち)</option>
                        <option value="two_edge">2辺支持 (上下)</option>
                        <option value="four_edge">4辺支持 (枠入り)</option>
                    </select>
                    <p className="text-xs text-slate-500">
                        {data.supportType === 'cantilever' && '下辺固定・上端フリーのDPGや自立手すり想定'}
                        {data.supportType === 'two_edge' && '上下の枠で支持される形式想定'}
                        {data.supportType === 'four_edge' && '四方のサッシ枠等で支持される形式想定'}
                    </p>
                </div>

                {/* ガラス種別 */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">2. ガラスの種類</label>
                    <select
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={data.glassType}
                        onChange={(e) => handleChange('glassType', e.target.value as GlassType)}
                    >
                        <option value="tempered">強化ガラス (TEMPERED)</option>
                        <option value="heat_strengthened">倍強度ガラス (HEAT STRENGTHENED)</option>
                        <option value="float">フロートガラス (FLOAT)</option>
                    </select>
                </div>

                {/* 合わせガラス設定 */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isLaminated"
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            checked={data.isLaminated}
                            onChange={(e) => handleChange('isLaminated', e.target.checked)}
                        />
                        <label htmlFor="isLaminated" className="text-sm font-medium text-slate-700">合わせガラスにする</label>
                    </div>

                    {data.isLaminated && (
                        <div className="pl-6 space-y-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">中間膜の種類</label>
                                <select
                                    className="w-full p-2 text-sm border border-slate-300 rounded-md bg-slate-50"
                                    value={data.interlayerType}
                                    onChange={(e) => handleChange('interlayerType', e.target.value as InterlayerType)}
                                >
                                    <option value="pvb">標準中間膜 (PVB) - 滑り許容</option>
                                    <option value="rigid">硬質中間膜 (SentryGlas等) - 完全合成</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* ガラス厚さ */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">3. ガラス厚さ (mm)</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-slate-500 block mb-1">1枚目 (室外側)</span>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-md"
                                value={data.thickness1}
                                onChange={(e) => handleChange('thickness1', Number(e.target.value))}
                            >
                                {[6, 8, 10, 12, 15, 19].map((t) => (
                                    <option key={t} value={t}>{t} mm</option>
                                ))}
                            </select>
                        </div>
                        {data.isLaminated && (
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">2枚目 (室内側)</span>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    value={data.thickness2}
                                    onChange={(e) => handleChange('thickness2', Number(e.target.value))}
                                >
                                    {[6, 8, 10, 12, 15, 19].map((t) => (
                                        <option key={t} value={t}>{t} mm</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* 寸法入力 */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="text-sm font-bold text-slate-700">4. ガラス寸法 (mm)</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">幅 W</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-slate-300 rounded-md text-right"
                                value={data.width}
                                onChange={(e) => handleChange('width', Number(e.target.value))}
                                min={100}
                                step={1}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">高さ H</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-slate-300 rounded-md text-right"
                                value={data.height}
                                onChange={(e) => handleChange('height', Number(e.target.value))}
                                min={100}
                                step={1}
                            />
                        </div>
                    </div>
                </div>

                {/* 荷重設定 */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                    <label className="text-sm font-bold text-slate-700">5. 設計荷重</label>
                    <div className="space-y-1">
                        <span className="text-xs text-slate-500 block">設計水平荷重 (JIS)</span>
                        <select
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={data.designLoad}
                            onChange={(e) => handleChange('designLoad', Number(e.target.value))}
                        >
                            <option value={2950}>2950 N/m (集団が密集する場所)</option>
                            <option value={1470}>1470 N/m (住宅・事務室などのバルコニー)</option>
                            <option value={980}>980 N/m (その他)</option>
                            <option value={490}>490 N/m (軽い物品を置く程度)</option>
                        </select>
                    </div>
                    {data.supportType !== 'cantilever' && (
                        <div className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-100">
                            <span className="text-slate-500 text-xs">換算等分布荷重 ({data.designLoad} ÷ {data.height}mm)</span>
                            <span className="font-medium text-slate-700">
                                {((data.designLoad / data.height) * 1000).toFixed(0)} N/m²
                            </span>
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    );
};
