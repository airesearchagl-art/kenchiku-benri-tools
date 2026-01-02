import { BuildingUsage, ServiceLevel, SANITARY_STANDARDS, FixtureType } from './sanitaryStandards';

export interface CalculationResult {
    male: {
        closet: number;
        urinal: number;
        lavatory: number;
    };
    female: {
        closet: number;
        lavatory: number;
    };
}

// Calculate number of fixtures based on population
export function calculateFixtures(
    usage: BuildingUsage,
    level: ServiceLevel,
    maleCount: number,
    femaleCount: number
): CalculationResult {
    const standards = SANITARY_STANDARDS[usage];
    const result: CalculationResult = {
        male: { closet: 0, urinal: 0, lavatory: 0 },
        female: { closet: 0, lavatory: 0 },
    };

    if (maleCount <= 0 && femaleCount <= 0) return result;

    // Male
    if (maleCount > 0) {
        result.male.closet = Math.ceil(maleCount / standards.male_closet[level].factor);
        result.male.urinal = Math.ceil(maleCount / standards.male_urinal[level].factor);
        result.male.lavatory = Math.ceil(maleCount / standards.male_lavatory[level].factor);

        // Minimum 1 check
        result.male.closet = Math.max(result.male.closet, 1);
        result.male.urinal = Math.max(result.male.urinal, 1);
        result.male.lavatory = Math.max(result.male.lavatory, 1);
    }

    // Female
    if (femaleCount > 0) {
        result.female.closet = Math.ceil(femaleCount / standards.female_closet[level].factor);
        result.female.lavatory = Math.ceil(femaleCount / standards.female_lavatory[level].factor);

        // Minimum 1 check
        result.female.closet = Math.max(result.female.closet, 1);
        result.female.lavatory = Math.max(result.female.lavatory, 1);
    }

    return result;
}

// Calculate approximate capacity based on fixture count (Reverse Calculation)
// Calculate approximate capacity range based on fixture count (Reverse Calculation)
// Returns the range of population that this number of fixtures is appropriate for
export function calculateCapacityRange(
    usage: BuildingUsage,
    level: ServiceLevel,
    fixtures: { type: FixtureType; count: number }[]
): Record<FixtureType, { min: number; max: number }> {
    const standards = SANITARY_STANDARDS[usage];
    const capacity: Partial<Record<FixtureType, { min: number; max: number }>> = {};

    for (const item of fixtures) {
        if (item.count <= 0) {
            capacity[item.type] = { min: 0, max: 0 };
            continue;
        }
        const factor = standards[item.type][level].factor;

        // Example: Factor 60
        // 1 fixture: Covers 1 to 60 people
        // 2 fixtures: Covers 61 to 120 people
        const max = item.count * factor;
        const min = (item.count - 1) * factor + 1;

        capacity[item.type] = { min, max };
    }
    return capacity as Record<FixtureType, { min: number; max: number }>;
}
