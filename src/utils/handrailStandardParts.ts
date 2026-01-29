// 手すり部材の規格品データベース

export interface StandardPart {
    label: string;
    // 形状に応じた寸法プロパティ
    width?: number;      // 幅（FB, 角パイプ, H形鋼など）
    height?: number;     // 高さ（角パイプ, H形鋼など）
    thickness?: number;  // 厚さ（FB, パイプ肉厚）
    diameter?: number;   // 直径（丸パイプ）
    webThickness?: number;     // ウェブ厚（H形鋼, カットT）
    flangeThickness?: number;  // フランジ厚（H形鋼, カットT）
}

// フラットバー (FB)
export const STANDARD_FLAT_BARS: StandardPart[] = [
    { label: 'FB-6×50', width: 50, thickness: 6 },
    { label: 'FB-6×65', width: 65, thickness: 6 },
    { label: 'FB-9×50', width: 50, thickness: 9 },
    { label: 'FB-9×65', width: 65, thickness: 9 },
    { label: 'FB-9×75', width: 75, thickness: 9 },
    { label: 'FB-12×50', width: 50, thickness: 12 },
    { label: 'FB-12×65', width: 65, thickness: 12 },
    { label: 'FB-12×75', width: 75, thickness: 12 },
    { label: 'FB-12×100', width: 100, thickness: 12 },
    { label: 'FB-16×75', width: 75, thickness: 16 },
    { label: 'FB-16×100', width: 100, thickness: 16 },
];

// 角形鋼管 (Square Pipe)
export const STANDARD_SQUARE_PIPES: StandardPart[] = [
    { label: '□-25×25×1.6', width: 25, height: 25, thickness: 1.6 },
    { label: '□-30×30×2.0', width: 30, height: 30, thickness: 2.0 },
    { label: '□-40×40×2.3', width: 40, height: 40, thickness: 2.3 },
    { label: '□-50×50×2.3', width: 50, height: 50, thickness: 2.3 },
    { label: '□-50×50×3.2', width: 50, height: 50, thickness: 3.2 },
    { label: '□-60×60×2.3', width: 60, height: 60, thickness: 2.3 },
    { label: '□-60×60×3.2', width: 60, height: 60, thickness: 3.2 },
    { label: '□-75×75×2.3', width: 75, height: 75, thickness: 2.3 },
    { label: '□-75×75×3.2', width: 75, height: 75, thickness: 3.2 },
    { label: '□-100×100×3.2', width: 100, height: 100, thickness: 3.2 },
    { label: '□-100×100×4.5', width: 100, height: 100, thickness: 4.5 },
];

// 丸パイプ (Round Pipe)
export const STANDARD_ROUND_PIPES: StandardPart[] = [
    { label: 'Φ-27.2×2.0', diameter: 27.2, thickness: 2.0 },
    { label: 'Φ-34.0×2.3', diameter: 34.0, thickness: 2.3 },
    { label: 'Φ-42.7×2.3', diameter: 42.7, thickness: 2.3 },
    { label: 'Φ-48.6×2.3', diameter: 48.6, thickness: 2.3 },
    { label: 'Φ-60.5×2.3', diameter: 60.5, thickness: 2.3 },
    { label: 'Φ-60.5×3.2', diameter: 60.5, thickness: 3.2 },
    { label: 'Φ-76.3×2.8', diameter: 76.3, thickness: 2.8 },
    { label: 'Φ-76.3×3.2', diameter: 76.3, thickness: 3.2 },
    { label: 'Φ-89.1×3.2', diameter: 89.1, thickness: 3.2 },
    { label: 'Φ-101.6×3.2', diameter: 101.6, thickness: 3.2 },
];

// H形鋼 (H-Beam)
export const STANDARD_H_BEAMS: StandardPart[] = [
    { label: 'H-100×50×5×7', height: 100, width: 50, webThickness: 5, flangeThickness: 7 },
    { label: 'H-100×100×6×8', height: 100, width: 100, webThickness: 6, flangeThickness: 8 },
    { label: 'H-125×60×6×8', height: 125, width: 60, webThickness: 6, flangeThickness: 8 },
    { label: 'H-125×125×6.5×9', height: 125, width: 125, webThickness: 6.5, flangeThickness: 9 },
    { label: 'H-150×75×5×7', height: 150, width: 75, webThickness: 5, flangeThickness: 7 },
    { label: 'H-150×100×6×9', height: 150, width: 100, webThickness: 6, flangeThickness: 9 },
    { label: 'H-150×150×7×10', height: 150, width: 150, webThickness: 7, flangeThickness: 10 },
    { label: 'H-200×100×5.5×8', height: 200, width: 100, webThickness: 5.5, flangeThickness: 8 },
];

// カットT (Cut-T) - H形鋼を半裁したT型断面
export const STANDARD_CUT_T: StandardPart[] = [
    { label: 'CT-100×50×5×7', height: 100, width: 50, webThickness: 5, flangeThickness: 7 },
    { label: 'CT-100×100×6×8', height: 100, width: 100, webThickness: 6, flangeThickness: 8 },
    { label: 'CT-125×60×6×8', height: 125, width: 60, webThickness: 6, flangeThickness: 8 },
    { label: 'CT-125×125×6.5×9', height: 125, width: 125, webThickness: 6.5, flangeThickness: 9 },
    { label: 'CT-150×75×5×7', height: 150, width: 75, webThickness: 5, flangeThickness: 7 },
    { label: 'CT-150×100×6×9', height: 150, width: 100, webThickness: 6, flangeThickness: 9 },
];

// 形状タイプごとにリストを取得するヘルパー関数
export function getStandardParts(shape: string): StandardPart[] {
    switch (shape) {
        case 'flatbar':
            return STANDARD_FLAT_BARS;
        case 'square':
            return STANDARD_SQUARE_PIPES;
        case 'round':
            return STANDARD_ROUND_PIPES;
        case 'hbeam':
            return STANDARD_H_BEAMS;
        case 'cutt':
            return STANDARD_CUT_T;
        default:
            return [];
    }
}
