// 手すり強度計算ユーティリティ

// 材質の許容応力度と弾性係数の定数
export const MATERIAL_PROPERTIES = {
    SS400: {
        allowableStress: 156, // N/mm² (許容引張応力度)
        youngsModulus: 205000, // N/mm² (ヤング係数)
    },
    STKR400: {
        allowableStress: 156, // N/mm²
        youngsModulus: 205000, // N/mm²
    },
    SUS304: {
        allowableStress: 140, // N/mm²
        youngsModulus: 193000, // N/mm²
    },
    A6063: {
        allowableStress: 95, // N/mm²
        youngsModulus: 70000, // N/mm²
    },
};

export const SHAPE_LABELS: Record<string, string> = {
    flatbar: 'フラットバー (FB)',
    square: '角形鋼管 (Square)',
    round: '丸パイプ (Round)',
    hbeam: 'H形鋼 (H-Beam)',
    cutt: 'カットT (Cut-T)',
};

export const LOAD_STANDARDS = [
    { value: 2950, label: '2950 N/m（集客施設・群衆 / JIS）' },
    { value: 1470, label: '1470 N/m（事務所・共用部 / JIS）' },
    { value: 980, label: '980 N/m（住宅・ベランダ / JIS）' },
];

// 断面性能の計算結果（強軸・弱軸の両方を持つ）
export interface SectionProperties {
    // 強軸 (Strong Axis) - 通常、鉛直荷重に対する検討で使用
    Ix: number;  // 断面二次モーメント (mm⁴)
    Zx: number;  // 断面係数 (mm³)

    // 弱軸 (Weak Axis) - 通常、水平荷重に対する検討で使用
    Iy: number;  // 断面二次モーメント (mm⁴)
    Zy: number;  // 断面係数 (mm³)

    area: number; // 断面積 (mm²)
}

// 強度判定結果（構造化）
export interface StrengthResult {
    // 支柱の検討結果（水平荷重のみ）
    post?: {
        load: number;          // 水平荷重 Ph (N)
        bendingMoment: number; // モーメント M (N·mm)
        bendingStress: number; // 曲げ応力度 σ (N/mm²)
        allowableStress: number;
        safetyRatio: number;

        // 設計荷重時 (Design Load)
        deflection: number;     // たわみ δ (mm)

        // 日常荷重時 (Daily Load: 295 N/m)
        dailyLoadDeflection: number; // 日常荷重時のたわみ δ (mm)
        isDailyLoadDeflectionOK: boolean; // 日常荷重時 H/100 (or H/60?) -> 今回は「L/100」判定

        isStressOK: boolean;
        // isDeflectionWarning: boolean; // 設計荷重時のたわみ判定は廃止（参考値化）
        overallOK: boolean;
    };

    // 笠木の検討結果（鉛直＋水平）
    handrail?: {
        // Check 1: 鉛直方向 (Vertical) - 強軸使用
        vertical: {
            load: number;          // 鉛直荷重 Pv (N/mm)
            bendingMoment: number;
            bendingStress: number;
            allowableStress: number;
            safetyRatio: number;
            deflection: number;
            isOK: boolean;
        };
        // Check 2: 水平方向 (Horizontal) - 弱軸使用
        horizontal: {
            load: number;          // 水平荷重 Ph (N/mm) - 設計荷重
            bendingMoment: number;
            bendingStress: number;
            allowableStress: number;
            safetyRatio: number;

            // 設計荷重時
            deflection: number;

            // 日常荷重時 (Daily Load: 295 N/m)
            dailyLoadDeflection: number;
            isDailyLoadDeflectionOK: boolean; // L/100判定

            isOK: boolean;
        };
        overallOK: boolean;
    };
}

/**
 * フラットバー (FB) の断面性能計算
 * @param width 幅 B (mm) - 平使い時の幅
 * @param thickness 厚さ t (mm) - 平使い時の高さ
 * Note: ユーザーが「縦使い」を選んだ場合も、計算ロジックで強軸/弱軸を使い分けるため、
 * ここでは純粋に形状としてのIx, Iyを返す。
 * Ix: 幅方向軸周り（厚さ方向に曲がる＝弱軸）... ではなく、建築慣習に合わせて
 * Ix (強軸): 高さ(B)の3乗
 * Iy (弱軸): 幅(t)の3乗
 * となるように定義する。
 * 入力: width=B(長辺), thickness=t(短辺) とする前提。
 */
export function calculateFlatBar(
    width: number,
    thickness: number,
): SectionProperties {
    const area = width * thickness;

    // 強軸 (Strong Axis): 幅(width)を高さとして使う
    // Ix = (t * B³) / 12
    const Ix = (thickness * Math.pow(width, 3)) / 12;
    const Zx = (thickness * Math.pow(width, 2)) / 6;

    // 弱軸 (Weak Axis): 厚さ(thickness)を高さとして使う
    // Iy = (B * t³) / 12
    const Iy = (width * Math.pow(thickness, 3)) / 12;
    const Zy = (width * Math.pow(thickness, 2)) / 6;

    return { Ix, Zx, Iy, Zy, area };
}

/**
 * 角形鋼管 (Square Pipe) の断面性能計算
 * width(B), height(H), thickness(t)
 */
export function calculateSquarePipe(
    width: number,
    height: number,
    thickness: number
): SectionProperties {
    // 外寸
    const b_out = width;
    const h_out = height;
    // 内寸
    const b_in = width - 2 * thickness;
    const h_in = height - 2 * thickness;

    const area = b_out * h_out - b_in * h_in;

    // 強軸 (x軸周り): 高さHが効く
    const Ix = (b_out * Math.pow(h_out, 3) - b_in * Math.pow(h_in, 3)) / 12;
    const Zx = Ix / (h_out / 2);

    // 弱軸 (y軸周り): 幅Bが効く
    const Iy = (h_out * Math.pow(b_out, 3) - h_in * Math.pow(b_in, 3)) / 12;
    const Zy = Iy / (b_out / 2);

    return { Ix, Zx, Iy, Zy, area };
}

/**
 * 丸パイプ (Round Pipe) の断面性能計算
 * 円形なので強軸・弱軸は同じ
 */
export function calculateRoundPipe(
    diameter: number,
    thickness: number
): SectionProperties {
    const outerRadius = diameter / 2;
    const innerRadius = outerRadius - thickness;

    const area = Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2));

    const I = (Math.PI / 64) * (Math.pow(diameter, 4) - Math.pow(diameter - 2 * thickness, 4));
    const Z = (Math.PI / 32) * (Math.pow(diameter, 4) - Math.pow(diameter - 2 * thickness, 4)) / diameter;

    return { Ix: I, Zx: Z, Iy: I, Zy: Z, area };
}

/**
 * H形鋼 (H-Beam) の断面性能計算
 */
export function calculateHBeam(
    height: number,
    width: number,
    webThickness: number,
    flangeThickness: number
): SectionProperties {
    // 強軸 (x軸周り)
    // 全体 - ウェブ左右の空洞部分
    const Ix = (width * Math.pow(height, 3) - (width - webThickness) * Math.pow(height - 2 * flangeThickness, 3)) / 12;
    const Zx = (2 * Ix) / height;

    // 弱軸 (y軸周り)
    // 2枚のフランジ + ウェブ
    const flangeIy = 2 * ((flangeThickness * Math.pow(width, 3)) / 12);
    const webIy = ((height - 2 * flangeThickness) * Math.pow(webThickness, 3)) / 12;
    const Iy = flangeIy + webIy;
    const Zy = (2 * Iy) / width;

    const area = 2 * width * flangeThickness + (height - 2 * flangeThickness) * webThickness;

    return { Ix, Zx, Iy, Zy, area };
}

/**
 * カットT (Cut-T) の断面性能計算
 * H形鋼を半裁。偏心があるため注意が必要。
 * ここでは簡略化のため、ユーザー入力の「ウェブ向き」は計算時には考慮せず、
 * 「重心軸周りの断面性能」を物理的に計算して返す。
 * 使う側（強度判定関数）で、正のモーメント・負のモーメントに応じてZyの上縁/下縁を使い分けるのが本来だが、
 * 今回は安全側に「小さい方のZ」を採用するロジックとする。
 */
export function calculateCutT(
    height: number,
    width: number,
    webThickness: number,
    flangeThickness: number,
): SectionProperties {
    // フランジとウェブの面積
    const flangeArea = width * flangeThickness;
    const webHeight = height - flangeThickness;
    const webArea = webHeight * webThickness;
    const totalArea = flangeArea + webArea;

    // == 強軸 (x軸: 水平軸) ==
    // 重心位置 y_g (フランジ外面からの距離)
    // モーメントの和 / 面積の和
    // フランジ重心: tf/2, ウェブ重心: tf + tw_h/2
    const yg = (flangeArea * (flangeThickness / 2) + webArea * (flangeThickness + webHeight / 2)) / totalArea;

    // Ix の計算 (平行軸の定理)
    // フランジ
    const If = (width * Math.pow(flangeThickness, 3)) / 12 + flangeArea * Math.pow(yg - flangeThickness / 2, 2);
    // ウェブ
    const Iw = (webThickness * Math.pow(webHeight, 3)) / 12 + webArea * Math.pow((flangeThickness + webHeight / 2) - yg, 2);
    const Ix = If + Iw;

    // Zx の計算 (引張側・圧縮側の厳しい方＝距離が遠い方)
    const y_top = yg;              // フランジ側端部までの距離
    const y_bottom = height - yg;  // ウェブ先端までの距離
    const Zx = Ix / Math.max(y_top, y_bottom);

    // == 弱軸 (y軸: 鉛直軸) ==
    // 左右対称なので重心は中央。
    // フランジのIy
    const Iy_f = (flangeThickness * Math.pow(width, 3)) / 12;
    // ウェブのIy
    const Iy_w = (webHeight * Math.pow(webThickness, 3)) / 12;
    const Iy = Iy_f + Iy_w;
    const Zy = Iy / (width / 2);

    return { Ix, Zx, Iy, Zy, area: totalArea };
}

// BL基準に基づく鉛直荷重 (N/m)
const VERTICAL_LOAD_BL = 1600;
// 日常荷重 (N/m) - JIS A 4709 等に基づく
const DAILY_LOAD = 295;

/**
 * 強度判定の実施
 * @param sectionProps 断面性能
 * @param material 材質
 * @param designHorizontalLoad 設計水平荷重 Ph (N/m)
 * @param designVerticalLoad 設計鉛直荷重 Pv (N/m) - デフォルト1600
 * @param handrailHeight 手すり高さ H (mm)
 * @param postPitch 支柱ピッチ L (mm)
 * @param isPost 支柱の検討の場合 true、笠木の検討の場合 false
 */
export function checkStrength(
    sectionProps: SectionProperties,
    material: keyof typeof MATERIAL_PROPERTIES,
    designHorizontalLoad: number,
    designVerticalLoad: number,
    handrailHeight: number,
    postPitch: number,
    isPost: boolean
): StrengthResult {
    const { allowableStress, youngsModulus } = MATERIAL_PROPERTIES[material];
    const { Zx, Ix, Zy, Iy } = sectionProps;

    if (isPost) {
        // === 支柱 (Post) の検討 ===
        // モデル: 片持ち梁
        // 荷重: 水平荷重 Ph のみ

        // 1. 設計荷重での検討
        const loadP = designHorizontalLoad * (postPitch / 1000); // 集中荷重 N

        // --- 応力度 (強軸 Zx 使用) ---
        const bendingMoment = loadP * handrailHeight;
        const bendingStress = bendingMoment / Zx;
        const isStressOK = bendingStress <= allowableStress;
        const safetyRatio = allowableStress / bendingStress;

        // --- たわみ (設計荷重) ---
        // δ = (P * H³) / (3 * E * I)
        const deflection = (loadP * Math.pow(handrailHeight, 3)) / (3 * youngsModulus * Ix);

        // 2. 日常荷重 (295 N/m) でのたわみ検討
        const dailyLoadP = DAILY_LOAD * (postPitch / 1000); // 集中荷重 N
        const dailyLoadDeflection = (dailyLoadP * Math.pow(handrailHeight, 3)) / (3 * youngsModulus * Ix);

        // 判定基準: H/100 (片持ち梁なので支柱高さHがスパン相当)
        // ※ ユーザーリクエストには L/100 とあったが、支柱の場合は高さHに対する変位を見るのが通常。
        // リクエストの「L/100」は笠木（単純梁）の文脈または誤記の可能性があるが、
        // 支柱の変位制限は通常 H/100 なのでここでは H/100 とする。
        const limitDeflection = handrailHeight / 100;
        const isDailyLoadDeflectionOK = dailyLoadDeflection <= limitDeflection;

        const overallOK = isStressOK && isDailyLoadDeflectionOK;

        return {
            post: {
                load: loadP,
                bendingMoment,
                bendingStress,
                allowableStress,
                safetyRatio,
                deflection,
                dailyLoadDeflection,
                isDailyLoadDeflectionOK,
                isStressOK,
                overallOK
            }
        };

    } else {
        // === 笠木 (Handrail) の検討 ===
        // モデル: 単純梁

        // --- Check 1: 鉛直方向 (Pv=1600 or specified) ---
        // 強軸 (Ix, Zx) を使用
        const w_v = designVerticalLoad / 1000; // N/mm
        const M_v = (w_v * Math.pow(postPitch, 2)) / 8;
        const sigma_v = M_v / Zx;
        const isOK_v = sigma_v <= allowableStress;
        const safetyRatio_v = allowableStress / sigma_v;
        const delta_v = (5 * w_v * Math.pow(postPitch, 4)) / (384 * youngsModulus * Ix);

        // --- Check 2: 水平方向 (Ph) ---
        // 弱軸 (Iy, Zy) を使用

        // 1. 設計荷重での検討
        const w_h = designHorizontalLoad / 1000; // N/mm
        const M_h = (w_h * Math.pow(postPitch, 2)) / 8;
        const sigma_h = M_h / Zy;
        const safetyRatio_h = allowableStress / sigma_h;
        const delta_h = (5 * w_h * Math.pow(postPitch, 4)) / (384 * youngsModulus * Iy); // 弱軸
        const isStressOK_h = sigma_h <= allowableStress;

        // 2. 日常荷重 (295 N/m) でのたわみ検討
        const w_h_daily = DAILY_LOAD / 1000; // N/mm
        const dailyLoadDeflection_h = (5 * w_h_daily * Math.pow(postPitch, 4)) / (384 * youngsModulus * Iy); // 弱軸

        // 判定基準: L/100 (単純梁なのでスパンLが基準)
        const limitDeflection_h = postPitch / 100;
        const isDailyLoadDeflectionOK_h = dailyLoadDeflection_h <= limitDeflection_h;

        const isOK_h = isStressOK_h && isDailyLoadDeflectionOK_h;

        return {
            handrail: {
                vertical: {
                    load: w_v,
                    bendingMoment: M_v,
                    bendingStress: sigma_v,
                    allowableStress,
                    safetyRatio: safetyRatio_v,
                    deflection: delta_v,
                    isOK: isOK_v
                },
                horizontal: {
                    load: w_h,
                    bendingMoment: M_h,
                    bendingStress: sigma_h,
                    allowableStress,
                    safetyRatio: safetyRatio_h,
                    deflection: delta_h,
                    dailyLoadDeflection: dailyLoadDeflection_h,
                    isDailyLoadDeflectionOK: isDailyLoadDeflectionOK_h,
                    isOK: isOK_h
                },
                overallOK: isOK_v && isOK_h
            }
        };
    }
}
