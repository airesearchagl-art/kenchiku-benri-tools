/**
 * ガラス強度計算ユーティリティ
 */

// ガラスの種類
export type GlassType = 'tempered' | 'heat_strengthened' | 'float';

// 中間膜の種類
export type InterlayerType = 'none' | 'pvb' | 'rigid';

// 支持形式
export type SupportType = 'cantilever' | 'two_edge' | 'four_edge';

// 入力データ構造
export interface GlassCalculationInput {
    supportType: SupportType;
    glassType: GlassType;
    isLaminated: boolean; // 合わせガラスかどうか
    interlayerType: InterlayerType; // 合わせガラスの場合の中間膜
    thickness1: number; // 1枚目の厚さ (mm)
    thickness2: number; // 2枚目の厚さ (mm) (合わせガラスの場合)
    width: number;      // ガラス幅 W (mm)
    height: number;     // ガラス高さ H (mm)
    designLoad: number; // JIS水平荷重 (N/m)
}

// 計算結果構造
export interface GlassStrengthResult {
    // 断面性能
    thicknessForCalc: number; // 計算上の等価厚
    sectionModulus: number;   // 断面係数 Z (mm³)
    momentOfInertia: number;  // 断面二次モーメント I (mm⁴)

    // 荷重条件
    designLoadLine: number; // N/m (入力値)
    designLoadArea: number; // N/m² (換算値) - 2辺/4辺支持用

    // 応力計算
    bendingMoment: number; // 最大曲げモーメント M (N・mm)
    bendingStress: number; // 発生応力度 σ (N/mm²)
    allowableStress: number; // 短期許容応力度 ft (N/mm²)
    safetyRatio: number;   // 安全率 (ft / σ)

    // たわみ計算
    deflection: number;    // 最大たわみ δ (mm)
    deflectionRatio: number; // H/δ or L/δ (UI表示用、分母の値)
    limitDeflection: number; // たわみ制限値 (mm) - H/100 等

    // 判定
    isStressOK: boolean;
    isDeflectionOK: boolean; // 警告判定用
}

// 定数定義
export const GLASS_PROPERTIES = {
    YOUNGS_MODULUS: 72000, // N/mm² (フロートガラスのヤング率)
    POISSON_RATIO: 0.23, // ポアソン比

    // 短期許容応力度 (N/mm²)
    ALLOWABLE_STRESS: {
        tempered: 90,          // 強化ガラス
        heat_strengthened: 60, // 倍強度ガラス
        float: 45,             // フロートガラス
    }
};

/**
 * ガラスの強度計算を実行
 */
export function calculateGlassStrength(input: GlassCalculationInput): GlassStrengthResult {
    const {
        supportType,
        glassType,
        isLaminated,
        interlayerType,
        thickness1,
        thickness2,
        width,
        height,
        designLoad
    } = input;

    // 1. 断面性能の計算
    let Z_eq = 0; // 等価断面係数
    let I_eq = 0; // 等価断面二次モーメント
    let t_eq_calc = 0; // 計算上の等価厚（参考表示用）

    if (!isLaminated) {
        // 単板 (Monolithic)
        // Z = (B * t^2) / 6
        // I = (B * t^3) / 12
        // ※ 単位幅(1mm)あたりではなく、全幅(W)または高さ(H)での計算が必要だが
        //   支持タイプによって「幅」の概念が変わるため、ここでは計算対象幅ごとに算出する。
        //   簡単のため、まずは「単位幅(1000mm)あたり」ではなく、入力された「幅W」全体での剛性を出すか、
        //   あるいは応力計算側で整合性を取るか。

        // ここでは「検討対象部位の幅」を基準にする。
        // 自立・2辺支持(上下)の場合は、幅Wの板として計算。

        const t = thickness1;
        t_eq_calc = t;

        // 自立の場合、幅W全体で受けるとして計算し、あとで応力も幅Wに合わせる。
        // 単純化のため、板全体の剛性を算出
        Z_eq = (width * Math.pow(t, 2)) / 6;
        I_eq = (width * Math.pow(t, 3)) / 12;

    } else {
        // 合わせガラス (Laminated)
        const t1 = thickness1;
        const t2 = thickness2;

        if (interlayerType === 'rigid') {
            // Mode B: 硬質中間膜 (完全合成)
            // 全厚 t = t1 + t2 の一枚板として扱う
            const t_total = t1 + t2;
            t_eq_calc = t_total;
            Z_eq = (width * Math.pow(t_total, 2)) / 6;
            I_eq = (width * Math.pow(t_total, 3)) / 12;

        } else {
            // Mode A: 標準PVB (各層合計)
            // Z_eq = Z1 + Z2
            // I_eq = I1 + I2
            // 滑りがあるため、剛性は足し算になる
            t_eq_calc = Math.sqrt(Math.pow(t1, 2) + Math.pow(t2, 2)); // Zの観点での等価厚（参考）

            const Z1 = (width * Math.pow(t1, 2)) / 6;
            const Z2 = (width * Math.pow(t2, 2)) / 6;
            Z_eq = Z1 + Z2;

            const I1 = (width * Math.pow(t1, 3)) / 12;
            const I2 = (width * Math.pow(t2, 3)) / 12;
            I_eq = I1 + I2;
        }
    }

    // 2. 荷重と応力・たわみの計算
    let M_max = 0;
    let deflection = 0;
    let w_area = 0;

    // ヤング率
    const E = GLASS_PROPERTIES.YOUNGS_MODULUS;

    // 自立タイプ (Cantilever)
    if (supportType === 'cantilever') {
        // モデル: 片持ち梁 (幅Wの板が、高さHの位置に線荷重Pを受ける)
        // 荷重分布: 手すり頂部に集中荷重 P = designLoad[N/m] * width[m]
        const P_total = designLoad * (width / 1000); // N

        // モーメント M = P * H
        M_max = P_total * height;

        // たわみ δ = (P * H^3) / (3 * E * I)
        deflection = (P_total * Math.pow(height, 3)) / (3 * E * I_eq);

    } else {
        // 2辺支持 / 4辺支持
        // モデル: 等分布荷重を受ける板
        // 換算等分布荷重 w_area [N/mm²] = (designLoad [N/m] / height [mm]) * α
        // 今回は安全側係数 α=1.0 とする
        // N/m = N/1000mm。これを高さH(mm)で割るので、
        // w (N/mm²) = (designLoad / 1000) / height

        const w_line_N_mm = designLoad / 1000;
        const w_area_val = w_line_N_mm / height; // N/mm²
        w_area = w_area_val * 1000 * 1000; // N/m² (表示用)

        if (supportType === 'two_edge') {
            // 2辺支持 (上下辺支持・単純梁近似)
            // 幅Wの単純梁として計算するのは不適切（実際は版）。
            // しかし簡易計算として、幅1mmのスリット梁（高さH）を考えるのが一般的。
            // 単位幅あたりの荷重 w_unit = w_area * 1mm

            // 全幅Wで考えるなら、
            // 全荷重 W_total = w_area * width * height = designLoad * (width/1000)
            // 単純梁等分布荷重 M = (w * L^2) / 8
            // ここでの w は単位長さあたりの荷重。梁の長手方向は「高さH」。
            // 梁の幅方向は「幅W」。
            // 単位長さ(高さ方向)あたりの荷重 q = w_area * width

            const q = w_area_val * width;
            M_max = (q * Math.pow(height, 2)) / 8;

            // たわみ δ = (5 * q * L^4) / (384 * E * I)
            deflection = (5 * q * Math.pow(height, 4)) / (384 * E * I_eq);

        } else if (supportType === 'four_edge') {
            // 4辺支持 (Roark's Formulas Case 36 etc.)
            // 等分布荷重qを受ける4辺単純支持長方形板
            // 短辺 a, 長辺 b
            const a = Math.min(width, height);
            const b = Math.max(width, height);
            const ratio = b / a;
            const q = w_area_val; // N/mm²
            const t = (!isLaminated || interlayerType === 'rigid') ? thickness1 + (isLaminated ? thickness1 : 0) : Math.sqrt(Math.pow(thickness1, 2) + (isLaminated ? Math.pow(thickness2, 2) : 0));
            // ※合わせガラス(PVB)の4辺支持板計算は複雑（等価厚の扱いが梁と違う）。
            // 簡易的に、I_eqから逆算した「曲げ剛性等価厚 t_eff」を用いて、単板として計算する。
            // I_eq = (W * t_eff^3) / 12  =>  t_eff = (12 * I_eq / W)^(1/3)
            const t_eff = Math.pow((12 * I_eq) / width, 1.0 / 3.0);

            // 係数表の簡易近似 (Roark's)
            // β (最大応力係数 - 板中心)
            // α (最大たわみ係数 - 板中心)
            // アスペクト比による係数変動
            // ratio 1.0 -> beta=0.2874, alpha=0.0444
            // ratio 1.2 -> beta=0.3762, alpha=0.0616
            // ... ratio > 3 でほぼ一定

            // 簡易近似関数 (精度はそこそこ)
            const getCoefficients = (r: number) => {
                // H.G.Conway data points interpolation could be better, but implementing simple fit for now
                if (r >= 2.0) return { beta: 0.75, alpha: 0.111 }; // 2辺支持に近づく
                if (r <= 1.0) return { beta: 0.2874, alpha: 0.0444 };

                // Linear interpolation for simplicity between 1.0 and 2.0
                // 実際は非線形だが、安全側（大きい方）に寄せる
                const t = r - 1.0;
                const beta = 0.2874 + (0.75 - 0.2874) * t;
                const alpha = 0.0444 + (0.111 - 0.0444) * t;
                return { beta, alpha };
            };

            const { beta, alpha } = getCoefficients(ratio);

            // σ_max = (beta * q * b^2) / t^2  ... bは短辺? Roarkではbが短辺のケース多しだが要確認。
            // Timoshenko: M_max = beta * q * a^2 (a: 短辺)
            // σ = 6M / t^2
            // ここではよく使われる簡略式: σ = K * q * (short_edge)^2 / t^2
            // K (beta) for aspect ratio a/b (a<b):
            // 1.0: 0.287, 1.5: 0.487, 2.0: 0.610 ... (これはモーメント係数でなく応力係数)

            // 再定義: Roark's formulas for flat plates with straight boundaries and constant thickness
            // Uniform log, all edges simply supported.
            // σ_max (at center) = - beta * q * b^2 / t^2  (b: 短辺 short edge)
            // y_max (at center) = - alpha * q * b^4 / (E * t^3)

            // Beta values (from Roark Table 11.4 Case 1a - a/b where a is Long, b is Short)
            // a/b = 1.0 : beta=0.2874, alpha=0.0444
            // a/b = 1.2 : beta=0.3762, alpha=0.0616
            // a/b = 1.6 : beta=0.5172, alpha=0.0906
            // a/b = 2.0 : beta=0.6102, alpha=0.1110
            // a/b -> inf: beta=0.7500, alpha=0.1421 (Beam strip)

            // 近似計算
            let tableBeta = 0.2874;
            let tableAlpha = 0.0444;

            const ar = Math.max(width, height) / Math.min(width, height);
            const shortEdge = Math.min(width, height);

            if (ar >= 3) { tableBeta = 0.75; tableAlpha = 0.1421; }
            else if (ar >= 2) { tableBeta = 0.6102; tableAlpha = 0.1110; }
            else if (ar >= 1.6) { tableBeta = 0.5172; tableAlpha = 0.0906; }
            else if (ar >= 1.2) { tableBeta = 0.3762; tableAlpha = 0.0616; }
            else { tableBeta = 0.2874; tableAlpha = 0.0444; }

            // 応力度 (曲げ応力)
            // σ = beta * q * b^2 / t^2
            // PVB合わせガラスの場合、tには何を使うか？
            // 応力度計算では Z_eq を使うのが正しい。
            // σ = M / Z_eq
            // M = (beta/6) * q * b^2 ... この変換は微妙。

            // 原則に戻り、M_max を求める。
            // Plate Theory: M_max = (beta_moment) * q * a^2
            // Roark's beta above IS for Stress (sigma), not Moment.
            // Stress sigma is directly calculated.
            // For PVB laminated glass, if we just use equivalent thickness t_eff, we might underestimate stress 
            // because Z_eq (sum of Z) is smaller than monolithic Z of thickness t_eff.

            // 安全側アプローチ:
            // 1. Z_eq を使って単板相当の厚さ t_stress を逆算する (t_stress = sqrt(6*Z_eq/W) ... いや幅W単位でない)
            //    Z_unit = Z_eq / width
            //    t_stress_unit = sqrt(6 * Z_unit)
            // 2. この t_stress_unit を Roarkの式に代入して σ を出す。

            const Z_unit_width = Z_eq / width;
            const t_for_stress = Math.sqrt(6 * Z_unit_width);

            const bendingStressCalced = tableBeta * q * Math.pow(shortEdge, 2) / Math.pow(t_for_stress, 2);
            M_max = bendingStressCalced * Z_eq; // 逆算でモーメントを出しておく（参考）

            // たわみ計算
            // I_eq から t_deflection を逆算
            // I_unit = I_eq / width
            // t_def = (12 * I_unit)^(1/3)
            const I_unit_width = I_eq / width;
            const t_for_deflection = Math.pow(12 * I_unit_width, 1.0 / 3.0);

            const deflectionCalced = (tableAlpha * q * Math.pow(shortEdge, 4)) / (E * Math.pow(t_for_deflection, 3));

            deflection = deflectionCalced;
            // 応力度を再代入 (計算済み)
            M_max = 0; // 4辺支持のモーメントは最大値だけ管理してもあまり意味がないので0または代表値
            // 上書き
            // bendingStress の計算を下の共通処理に任せずにここで確定させる
        }
    }

    // 3. 応力度計算（4辺支持以外）と判定
    // 4辺支持以外は M_max から計算
    let stress = 0;
    if (supportType === 'four_edge') {
        const ar = Math.max(width, height) / Math.min(width, height);
        const shortEdge = Math.min(width, height);
        const q = w_area_val; // N/mm²

        // 再計算（変数のスコープ整理のため）
        let tableBeta = 0.2874;
        if (ar >= 3) tableBeta = 0.75;
        else if (ar >= 2) tableBeta = 0.6102;
        else if (ar >= 1.6) tableBeta = 0.5172;
        else if (ar >= 1.2) tableBeta = 0.3762;

        const Z_unit_width = Z_eq / width;
        const t_for_stress = Math.sqrt(6 * Z_unit_width);

        stress = tableBeta * q * Math.pow(shortEdge, 2) / Math.pow(t_for_stress, 2);

    } else {
        stress = M_max / Z_eq;
    }

    // 許容応力度
    const allowableStress = GLASS_PROPERTIES.ALLOWABLE_STRESS[glassType];
    const safetyRatio = stress > 0 ? allowableStress / stress : 999;
    const isStressOK = stress <= allowableStress;

    // たわみ判定
    // 制限値: 自立なら H/100, 支持ありなら L(短辺?)/100
    const span = (supportType === 'cantilever') ? height : Math.min(width, height);
    const limitDeflection = span / 100;
    const isDeflectionOK = deflection <= limitDeflection;
    const deflectionRatio = deflection > 0 ? span / deflection : 1000;

    return {
        thicknessForCalc: t_eq_calc,
        sectionModulus: Z_eq,
        momentOfInertia: I_eq,
        designLoadLine: designLoad,
        designLoadArea: w_area,
        bendingMoment: M_max,
        bendingStress: stress,
        allowableStress,
        safetyRatio,
        deflection,
        deflectionRatio,
        limitDeflection,
        isStressOK,
        isDeflectionOK
    };
}
