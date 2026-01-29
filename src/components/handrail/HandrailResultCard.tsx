import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CheckCircle2, XCircle, AlertTriangle, ArrowDown, ArrowRight } from 'lucide-react';
import type { StrengthResult, SectionProperties } from '@/utils/handrailCalculations';

interface HandrailResultCardProps {
    result: StrengthResult | null;
    sectionProps: SectionProperties | null;
}

/**
 * 計算結果を表示するカードコンポーネント
 */
export function HandrailResultCard({ result, sectionProps }: HandrailResultCardProps) {
    if (!result || !sectionProps) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>計算結果</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">部材情報を入力してください</p>
                </CardContent>
            </Card>
        );
    }

    // 支柱の検討結果表示
    if (result.post) {
        const p = result.post;
        return (
            <div className="space-y-6">
                {/* 総合判定 */}
                <ResultBadge isOK={p.overallOK} label="支柱の総合判定" />

                {/* 設計条件 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">設計条件（支柱）</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">水平荷重 P</span>
                            <span className="font-mono">{p.load.toFixed(1)} N</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">曲げモーメント M</span>
                            <span className="font-mono">{p.bendingMoment.toFixed(0)} N・mm</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 断面性能（強軸のみ使用） */}
                <SectionPropsDisplay props={sectionProps} axis="strong" />

                {/* 1. 曲げ応力度 */}
                <CheckItem
                    title="曲げ応力度 σ"
                    value={p.bendingStress}
                    limit={p.allowableStress}
                    unit="N/mm²"
                    isOK={p.isStressOK}
                    safetyRatio={p.safetyRatio}
                />

                {/* 2. たわみの検討 */}
                <Card className={!p.isDailyLoadDeflectionOK ? 'border-red-300 bg-red-50/50' : ''}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-700">たわみの検討</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        {/* 設計荷重たわみ（参考値） */}
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <div>
                                <div className="text-sm font-medium">設計荷重時 δ</div>
                                <div className="text-xs text-muted-foreground">判定対象外 (参考値)</div>
                            </div>
                            <div className="text-right">
                                <span className="font-mono font-bold text-lg">{p.deflection.toFixed(2)}</span>
                                <span className="text-sm text-muted-foreground ml-1">mm</span>
                            </div>
                        </div>

                        {/* 日常荷重たわみ（判定対象） */}
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-medium">日常荷重時 δ (295 N/m)</div>
                                <div className="text-xs text-muted-foreground">判定基準: H/100 以下</div>
                            </div>
                            <div className="text-right">
                                <div className={`font-mono font-bold text-lg ${p.isDailyLoadDeflectionOK ? 'text-green-600' : 'text-red-500'}`}>
                                    {p.dailyLoadDeflection.toFixed(2)} <span className="text-sm text-muted-foreground text-slate-500">mm</span>
                                </div>
                            </div>
                            <div className="shrink-0">
                                {p.isDailyLoadDeflectionOK ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-500/50" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-500" />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 笠木の検討結果表示
    if (result.handrail) {
        const h = result.handrail;
        return (
            <div className="space-y-8">
                {/* 総合判定 */}
                <ResultBadge isOK={h.overallOK} label="笠木の総合判定" />

                {/* Check 1: 鉛直荷重 (Vertical) */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                        <ArrowDown className="w-5 h-5 text-blue-500" />
                        1. 鉛直荷重の検討（強軸使用）
                    </h3>

                    {/* 条件 */}
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-3 rounded">
                        <div>
                            <span className="text-muted-foreground block text-xs">設計鉛直荷重 w_v</span>
                            <span className="font-mono">{h.vertical.load.toFixed(2)} N/mm</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">曲げモーメント M_v</span>
                            <span className="font-mono">{h.vertical.bendingMoment.toFixed(0)} N・mm</span>
                        </div>
                    </div>

                    <SectionPropsDisplay props={sectionProps} axis="strong" compact />

                    <CheckItem
                        title="曲げ応力度 σ_v"
                        value={h.vertical.bendingStress}
                        limit={h.vertical.allowableStress}
                        unit="N/mm²"
                        isOK={h.vertical.isOK}
                        safetyRatio={h.vertical.safetyRatio}
                    />

                    <div className="flex justify-between items-center p-3 border rounded">
                        <span className="text-sm font-medium">たわみ δ_v (設計荷重)</span>
                        <div className="text-right">
                            <span className="font-mono">{h.vertical.deflection.toFixed(2)} mm</span>
                            <span className="text-xs text-muted-foreground ml-2">(参考値)</span>
                        </div>
                    </div>
                </div>

                {/* Check 2: 水平荷重 (Horizontal) */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                        <ArrowRight className="w-5 h-5 text-green-500" />
                        2. 水平荷重の検討（弱軸使用）
                    </h3>

                    {/* 条件 */}
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-3 rounded">
                        <div>
                            <span className="text-muted-foreground block text-xs">設計水平荷重 w_h</span>
                            <span className="font-mono">{h.horizontal.load.toFixed(2)} N/mm</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">曲げモーメント M_h</span>
                            <span className="font-mono">{h.horizontal.bendingMoment.toFixed(0)} N・mm</span>
                        </div>
                    </div>

                    <SectionPropsDisplay props={sectionProps} axis="weak" compact />

                    <CheckItem
                        title="曲げ応力度 σ_h"
                        value={h.horizontal.bendingStress}
                        limit={h.horizontal.allowableStress}
                        unit="N/mm²"
                        isOK={h.horizontal.isOK}
                        safetyRatio={h.horizontal.safetyRatio}
                    />

                    {/* たわみの検討 */}
                    <Card className={!h.horizontal.isDailyLoadDeflectionOK ? 'border-red-300 bg-red-50/50' : ''}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-slate-700">たわみの検討</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <div>
                                    <div className="text-sm font-medium">設計荷重時 δ_h</div>
                                    <div className="text-xs text-muted-foreground">判定対象外 (参考値)</div>
                                </div>
                                <div className="text-right">
                                    <span className="font-mono font-bold text-lg">{h.horizontal.deflection.toFixed(2)}</span>
                                    <span className="text-sm text-muted-foreground ml-1">mm</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-sm font-medium">日常荷重時 δ_h (295 N/m)</div>
                                    <div className="text-xs text-muted-foreground">判定基準: L/100 以下</div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-mono font-bold text-lg ${h.horizontal.isDailyLoadDeflectionOK ? 'text-green-600' : 'text-red-500'}`}>
                                        {h.horizontal.dailyLoadDeflection.toFixed(2)} <span className="text-sm text-muted-foreground text-slate-500">mm</span>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    {h.horizontal.isDailyLoadDeflectionOK ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-500/50" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-500" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return null;
}

// --- Sub Components ---

function ResultBadge({ isOK, label }: { isOK: boolean; label: string }) {
    return (
        <Card className={`border-2 ${isOK ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-center gap-4">
                    {isOK ? (
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    ) : (
                        <XCircle className="w-10 h-10 text-red-600" />
                    )}
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">{label}</div>
                        <div className={`text-3xl font-bold ${isOK ? 'text-green-700' : 'text-red-700'}`}>
                            {isOK ? 'OK' : 'NG'}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SectionPropsDisplay({ props, axis, compact }: { props: SectionProperties; axis: 'strong' | 'weak'; compact?: boolean }) {
    const isStrong = axis === 'strong';
    const Ix = isStrong ? props.Ix : props.Iy;
    const Zx = isStrong ? props.Zx : props.Zy;
    const label = isStrong ? '強軸 (x-x)' : '弱軸 (y-y)';

    if (compact) {
        return (
            <div className="flex gap-4 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                <span>{label}</span>
                <span>I: {Ix.toExponential(2)}</span>
                <span>Z: {Zx.toExponential(2)}</span>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">断面性能 ({label})</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">断面二次モーメント I</span>
                    <span className="font-mono">{Ix.toExponential(3)} mm⁴</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">断面係数 Z</span>
                    <span className="font-mono">{Zx.toExponential(3)} mm³</span>
                </div>
            </CardContent>
        </Card>
    );
}

function CheckItem({ title, value, limit, unit, isOK, safetyRatio, labelSafety = '安全率' }: any) {
    return (
        <Card className={!isOK ? 'border-red-300 bg-red-50/50' : ''}>
            <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">{title}</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-mono font-bold">{value.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">{unit}</span>
                        {limit && (
                            <span className="text-xs text-muted-foreground ml-2">
                                (許容: {limit.toFixed(1)})
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">{labelSafety}</div>
                    <div className={`font-mono font-bold text-lg ${isOK ? 'text-green-600' : 'text-red-500'}`}>
                        {safetyRatio ? safetyRatio.toFixed(2) : '-'}
                    </div>
                </div>

                <div className="shrink-0">
                    {isOK ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500/50" />
                    ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
