import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { GlassStrengthResult } from '@/utils/glassCalculations';

interface Props {
    result: GlassStrengthResult | null;
}

const ResultItem = ({ label, value, unit, subValue }: { label: string; value: string | number; unit?: string; subValue?: string }) => (
    <div className="flex flex-col p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
        <span className="text-xs text-slate-500 mb-1">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-800">{value}</span>
            {unit && <span className="text-xs text-slate-500">{unit}</span>}
        </div>
        {subValue && <span className="text-xs text-slate-400 mt-1">{subValue}</span>}
    </div>
);

const CheckItem = ({ label, current, limit, unit, isOK, isWarning }: { label: string; current: number; limit: number; unit: string; isOK: boolean; isWarning?: boolean }) => {
    const ratio = (current / limit) * 100;

    // 色の決定
    let statusColor = 'bg-slate-100';
    let textColor = 'text-slate-700';
    let icon = null;

    if (!isOK) {
        statusColor = 'bg-red-50 border-red-200';
        textColor = 'text-red-700';
        icon = <XCircle className="w-5 h-5 text-red-600" />;
    } else if (isWarning) {
        statusColor = 'bg-yellow-50 border-yellow-200';
        textColor = 'text-yellow-700';
        icon = <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    } else {
        statusColor = 'bg-green-50 border-green-200';
        textColor = 'text-green-700';
        icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }

    return (
        <div className={`p-4 rounded-lg border ${statusColor} transition-colors`}>
            <div className="flex justify-between items-start mb-2">
                <span className={`font-medium ${textColor}`}>{label}</span>
                {icon}
            </div>

            <div className="flex items-center gap-4 mb-2">
                <div className="flex-1">
                    <div className="text-2xl font-bold text-slate-800">
                        {current.toFixed(2)}
                        <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        許容値: {limit.toFixed(2)} {unit}
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-lg font-bold ${ratio > 100 ? 'text-red-600' : 'text-slate-600'}`}>
                        {ratio.toFixed(0)}%
                    </div>
                    <div className="text-xs text-slate-400">検定比</div>
                </div>
            </div>

            {/* プログレスバー */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${!isOK ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(ratio, 100)}%` }}
                />
            </div>
            {isWarning && <p className="text-xs text-yellow-700 mt-2 font-medium">※ たわみ制限超過（警告）</p>}
        </div>
    );
};

export const GlassResultCard: React.FC<Props> = ({ result }) => {
    if (!result) {
        return (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400">パラメータを入力すると結果が表示されます</p>
            </div>
        );
    }

    const {
        isStressOK, isDeflectionOK,
        thicknessForCalc, sectionModulus, momentOfInertia,
        designLoadLine, designLoadArea,
        bendingMoment, bendingStress, allowableStress,
        deflection, limitDeflection
    } = result;

    const isOverallOK = isStressOK; // たわみは警告扱いとするか、NGとするかはポリシー次第だが、ユーザー要望では「警告」

    return (
        <Card className={`border-l-4 ${isOverallOK ? 'border-l-green-500' : 'border-l-red-500'} shadow-md`}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            検討結果
                            {isOverallOK ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    安全 (Safe)
                                </Badge>
                            ) : (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    危険 (Unsafe)
                                </Badge>
                            )}
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            計算上の等価厚: <span className="font-mono font-medium">{thicknessForCalc.toFixed(1)}mm</span>
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* 判定項目グリッド */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CheckItem
                        label="曲げ応力度検定"
                        current={bendingStress}
                        limit={allowableStress}
                        unit="N/mm²"
                        isOK={isStressOK}
                    />
                    <CheckItem
                        label="たわみ検定"
                        current={deflection}
                        limit={limitDeflection}
                        unit="mm"
                        isOK={true} // たわみは強度NGにはしない
                        isWarning={!isDeflectionOK}
                    />
                </div>

                {/* 詳細数値 */}
                <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">計算詳細</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <ResultItem label="断面係数 Z" value={sectionModulus.toFixed(0)} unit="mm³" />
                        <ResultItem label="断面二次モーメント I" value={momentOfInertia.toFixed(0)} unit="mm⁴" />
                        <ResultItem label="最大曲げモーメント M" value={(bendingMoment / 1000).toFixed(1)} unit="N·m" />
                        {designLoadArea > 0 ? (
                            <ResultItem label="換算等分布荷重 w" value={designLoadArea.toFixed(0)} unit="N/m²" />
                        ) : (
                            <ResultItem label="線荷重 P" value={designLoadLine.toFixed(0)} unit="N/m" />
                        )}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
};
