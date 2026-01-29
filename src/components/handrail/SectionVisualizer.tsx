import React from 'react';

interface SectionVisualizerProps {
    shape: 'flatbar' | 'square' | 'round' | 'hbeam' | 'cutt';
    // FBの場合
    isStrongAxis?: boolean;
    // カットTの場合
    isWebUp?: boolean;
}

/**
 * 断面図をSVGで視覚化するコンポーネント
 */
export function SectionVisualizer({ shape, isStrongAxis = true, isWebUp = true }: SectionVisualizerProps) {
    const renderFlatBar = () => {
        if (isStrongAxis) {
            // 強軸（立てて使う）
            return (
                <div className="flex flex-col items-center gap-2">
                    <svg width="120" height="160" viewBox="0 0 120 160" className="border rounded">
                        {/* フラットバー（縦） */}
                        <rect x="45" y="20" width="30" height="120" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                        {/* 寸法線 - 幅B */}
                        <line x1="80" y1="70" x2="100" y2="70" stroke="#ef4444" strokeWidth="1.5" />
                        <line x1="100" y1="20" x2="100" y2="140" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                        <text x="105" y="85" fontSize="12" fill="#ef4444" fontWeight="bold">B</text>
                        {/* 寸法線 - 厚さt */}
                        <line x1="45" y1="10" x2="75" y2="10" stroke="#3b82f6" strokeWidth="1.5" />
                        <line x1="45" y1="10" x2="45" y2="20" stroke="#3b82f6" strokeWidth="1.5" />
                        <line x1="75" y1="10" x2="75" y2="20" stroke="#3b82f6" strokeWidth="1.5" />
                        <text x="55" y="8" fontSize="12" fill="#3b82f6" fontWeight="bold">t</text>
                    </svg>
                    <p className="text-xs text-muted-foreground">強軸（立てて使用）</p>
                </div>
            );
        } else {
            // 弱軸（平らに使う）
            return (
                <div className="flex flex-col items-center gap-2">
                    <svg width="160" height="120" viewBox="0 0 160 120" className="border rounded">
                        {/* フラットバー（横） */}
                        <rect x="20" y="45" width="120" height="30" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                        {/* 寸法線 - 幅B */}
                        <line x1="20" y1="35" x2="140" y2="35" stroke="#ef4444" strokeWidth="1.5" />
                        <line x1="20" y1="35" x2="20" y2="45" stroke="#ef4444" strokeWidth="1.5" />
                        <line x1="140" y1="35" x2="140" y2="45" stroke="#ef4444" strokeWidth="1.5" />
                        <text x="75" y="30" fontSize="12" fill="#ef4444" fontWeight="bold">B</text>
                        {/* 寸法線 - 厚さt */}
                        <line x1="150" y1="45" x2="150" y2="75" stroke="#3b82f6" strokeWidth="1.5" />
                        <text x="153" y="65" fontSize="12" fill="#3b82f6" fontWeight="bold">t</text>
                    </svg>
                    <p className="text-xs text-muted-foreground">弱軸（平らに使用）</p>
                </div>
            );
        }
    };

    const renderSquarePipe = () => (
        <div className="flex flex-col items-center gap-2">
            <svg width="140" height="140" viewBox="0 0 140 140" className="border rounded">
                {/* 外側 */}
                <rect x="30" y="30" width="80" height="80" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                {/* 内側（中空） */}
                <rect x="40" y="40" width="60" height="60" fill="white" stroke="#64748b" strokeWidth="1.5" />
                {/* 寸法線 - 幅B */}
                <line x1="30" y1="120" x2="110" y2="120" stroke="#ef4444" strokeWidth="1.5" />
                <line x1="30" y1="115" x2="30" y2="125" stroke="#ef4444" strokeWidth="1.5" />
                <line x1="110" y1="115" x2="110" y2="125" stroke="#ef4444" strokeWidth="1.5" />
                <text x="65" y="135" fontSize="12" fill="#ef4444" fontWeight="bold">B</text>
                {/* 寸法線 - 肉厚t */}
                <line x1="120" y1="30" x2="120" y2="40" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="123" y="38" fontSize="12" fill="#3b82f6" fontWeight="bold">t</text>
            </svg>
            <p className="text-xs text-muted-foreground">角形鋼管</p>
        </div>
    );

    const renderRoundPipe = () => (
        <div className="flex flex-col items-center gap-2">
            <svg width="140" height="140" viewBox="0 0 140 140" className="border rounded">
                {/* 外側円 */}
                <circle cx="70" cy="70" r="40" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                {/* 内側円（中空） */}
                <circle cx="70" cy="70" r="30" fill="white" stroke="#64748b" strokeWidth="1.5" />
                {/* 寸法線 - 直径D */}
                <line x1="30" y1="70" x2="110" y2="70" stroke="#ef4444" strokeWidth="1.5" />
                <text x="65" y="85" fontSize="12" fill="#ef4444" fontWeight="bold">D</text>
                {/* 寸法線 - 肉厚t */}
                <line x1="70" y1="30" x2="70" y2="40" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="75" y="38" fontSize="12" fill="#3b82f6" fontWeight="bold">t</text>
            </svg>
            <p className="text-xs text-muted-foreground">丸パイプ</p>
        </div>
    );

    const renderHBeam = () => (
        <div className="flex flex-col items-center gap-2">
            <svg width="140" height="160" viewBox="0 0 140 160" className="border rounded">
                {/* 上フランジ */}
                <rect x="40" y="20" width="60" height="15" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                {/* ウェブ */}
                <rect x="62" y="35" width="16" height="90" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                {/* 下フランジ */}
                <rect x="40" y="125" width="60" height="15" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                {/* 寸法線 - 高さH */}
                <line x1="110" y1="20" x2="110" y2="140" stroke="#ef4444" strokeWidth="1.5" />
                <text x="113" y="85" fontSize="12" fill="#ef4444" fontWeight="bold">H</text>
                {/* 寸法線 - 幅B */}
                <line x1="40" y1="150" x2="100" y2="150" stroke="#10b981" strokeWidth="1.5" />
                <text x="65" y="158" fontSize="12" fill="#10b981" fontWeight="bold">B</text>
                {/* 寸法線 - ウェブ厚t1 */}
                <line x1="62" y1="10" x2="78" y2="10" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="66" y="8" fontSize="10" fill="#3b82f6" fontWeight="bold">t1</text>
                {/* 寸法線 - フランジ厚t2 */}
                <line x1="30" y1="20" x2="30" y2="35" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="18" y="30" fontSize="10" fill="#f59e0b" fontWeight="bold">t2</text>
            </svg>
            <p className="text-xs text-muted-foreground">H形鋼</p>
        </div>
    );

    const renderCutT = () => {
        if (isWebUp) {
            // ウェブが上向き
            return (
                <div className="flex flex-col items-center gap-2">
                    <svg width="140" height="160" viewBox="0 0 140 160" className="border rounded">
                        {/* フランジ（下） */}
                        <rect x="40" y="125" width="60" height="15" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                        {/* ウェブ（上） */}
                        <rect x="62" y="35" width="16" height="90" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                        {/* 寸法線 - 高さH */}
                        <line x1="110" y1="35" x2="110" y2="140" stroke="#ef4444" strokeWidth="1.5" />
                        <text x="113" y="90" fontSize="12" fill="#ef4444" fontWeight="bold">H</text>
                        {/* 寸法線 - 幅B */}
                        <line x1="40" y1="150" x2="100" y2="150" stroke="#10b981" strokeWidth="1.5" />
                        <text x="65" y="158" fontSize="12" fill="#10b981" fontWeight="bold">B</text>
                        {/* 寸法線 - ウェブ厚t1 */}
                        <line x1="62" y1="25" x2="78" y2="25" stroke="#3b82f6" strokeWidth="1.5" />
                        <text x="66" y="23" fontSize="10" fill="#3b82f6" fontWeight="bold">t1</text>
                        {/* 寸法線 - フランジ厚t2 */}
                        <line x1="30" y1="125" x2="30" y2="140" stroke="#f59e0b" strokeWidth="1.5" />
                        <text x="18" y="135" fontSize="10" fill="#f59e0b" fontWeight="bold">t2</text>
                    </svg>
                    <p className="text-xs text-muted-foreground">カットT（ウェブ上向き）</p>
                </div>
            );
        } else {
            // ウェブが下向き（フランジが上）
            return (
                <div className="flex flex-col items-center gap-2">
                    <svg width="140" height="160" viewBox="0 0 140 160" className="border rounded">
                        {/* フランジ（上） */}
                        <rect x="40" y="20" width="60" height="15" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                        {/* ウェブ（下） */}
                        <rect x="62" y="35" width="16" height="90" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                        {/* 寸法線 - 高さH */}
                        <line x1="110" y1="20" x2="110" y2="125" stroke="#ef4444" strokeWidth="1.5" />
                        <text x="113" y="75" fontSize="12" fill="#ef4444" fontWeight="bold">H</text>
                        {/* 寸法線 - 幅B */}
                        <line x1="40" y1="10" x2="100" y2="10" stroke="#10b981" strokeWidth="1.5" />
                        <text x="65" y="8" fontSize="12" fill="#10b981" fontWeight="bold">B</text>
                        {/* 寸法線 - ウェブ厚t1 */}
                        <line x1="62" y1="135" x2="78" y2="135" stroke="#3b82f6" strokeWidth="1.5" />
                        <text x="66" y="145" fontSize="10" fill="#3b82f6" fontWeight="bold">t1</text>
                        {/* 寸法線 - フランジ厚t2 */}
                        <line x1="30" y1="20" x2="30" y2="35" stroke="#f59e0b" strokeWidth="1.5" />
                        <text x="18" y="30" fontSize="10" fill="#f59e0b" fontWeight="bold">t2</text>
                    </svg>
                    <p className="text-xs text-muted-foreground">カットT（フランジ上向き）</p>
                </div>
            );
        }
    };

    return (
        <div className="flex justify-center p-4 bg-slate-50 rounded-lg">
            {shape === 'flatbar' && renderFlatBar()}
            {shape === 'square' && renderSquarePipe()}
            {shape === 'round' && renderRoundPipe()}
            {shape === 'hbeam' && renderHBeam()}
            {shape === 'cutt' && renderCutT()}
        </div>
    );
}
