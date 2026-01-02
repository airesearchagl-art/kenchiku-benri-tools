export type BuildingUsage = 'OFFICE' | 'SCHOOL' | 'THEATER' | 'DEPT_STORE' | 'DORMITORY' | 'HOSPITAL';
export type ServiceLevel = 1 | 2 | 3;
export type FixtureType = 'male_closet' | 'male_urinal' | 'male_lavatory' | 'female_closet' | 'female_lavatory';

export interface FixtureStandard {
    factor: number; // 1 fixture per X people
    min?: number;    // Minimum fixtures if count > 0
}

// Coefficients (Approximated based on SHASE-S 206 concepts)
// Level 1: Good (Waiting almost zero) -> Factor is smaller (More fixtures)
// Level 2: Standard -> Factor is standard
// Level 3: Minimum -> Factor is larger (Fewer fixtures)

type StandardMap = Record<BuildingUsage, Record<FixtureType, Record<ServiceLevel, FixtureStandard>>>;

export const SANITARY_STANDARDS: StandardMap = {
    // 事務所 (Office)
    OFFICE: {
        male_closet: {
            1: { factor: 50 }, 2: { factor: 60 }, 3: { factor: 75 }
        },
        male_urinal: {
            1: { factor: 25 }, 2: { factor: 30 }, 3: { factor: 40 }
        },
        male_lavatory: {
            1: { factor: 40 }, 2: { factor: 50 }, 3: { factor: 60 }
        },
        female_closet: {
            1: { factor: 15 }, 2: { factor: 20 }, 3: { factor: 25 }
        },
        female_lavatory: {
            1: { factor: 40 }, 2: { factor: 50 }, 3: { factor: 60 }
        }
    },
    // 学校 (School) - High demand during breaks
    SCHOOL: {
        male_closet: {
            1: { factor: 35 }, 2: { factor: 40 }, 3: { factor: 50 }
        },
        male_urinal: {
            1: { factor: 15 }, 2: { factor: 20 }, 3: { factor: 25 }
        },
        male_lavatory: {
            1: { factor: 35 }, 2: { factor: 40 }, 3: { factor: 50 }
        },
        female_closet: {
            1: { factor: 10 }, 2: { factor: 15 }, 3: { factor: 20 }
        },
        female_lavatory: {
            1: { factor: 35 }, 2: { factor: 40 }, 3: { factor: 50 }
        }
    },
    // 劇場 (Theater) - Short peak usage
    THEATER: {
        male_closet: {
            1: { factor: 50 }, 2: { factor: 60 }, 3: { factor: 80 }
        },
        male_urinal: {
            1: { factor: 25 }, 2: { factor: 30 }, 3: { factor: 40 }
        },
        male_lavatory: {
            1: { factor: 80 }, 2: { factor: 100 }, 3: { factor: 150 }
        },
        female_closet: {
            1: { factor: 25 }, 2: { factor: 30 }, 3: { factor: 40 }
        },
        female_lavatory: {
            1: { factor: 80 }, 2: { factor: 100 }, 3: { factor: 150 }
        }
    },
    // 百貨店・量販店 (Dept Store)
    DEPT_STORE: {
        male_closet: {
            1: { factor: 80 }, 2: { factor: 100 }, 3: { factor: 120 }
        },
        male_urinal: {
            1: { factor: 40 }, 2: { factor: 50 }, 3: { factor: 60 }
        },
        male_lavatory: {
            1: { factor: 60 }, 2: { factor: 80 }, 3: { factor: 100 }
        },
        female_closet: {
            1: { factor: 30 }, 2: { factor: 40 }, 3: { factor: 50 }
        },
        female_lavatory: {
            1: { factor: 60 }, 2: { factor: 80 }, 3: { factor: 100 }
        }
    },
    // 寄宿舎 (Dormitory)
    DORMITORY: {
        male_closet: {
            1: { factor: 10 }, 2: { factor: 12 }, 3: { factor: 15 }
        },
        male_urinal: {
            1: { factor: 15 }, 2: { factor: 20 }, 3: { factor: 25 }
        },
        male_lavatory: {
            1: { factor: 8 }, 2: { factor: 10 }, 3: { factor: 12 }
        },
        female_closet: {
            1: { factor: 6 }, 2: { factor: 8 }, 3: { factor: 10 }
        },
        female_lavatory: {
            1: { factor: 8 }, 2: { factor: 10 }, 3: { factor: 12 }
        }
    },
    // 病院 (Hospital - Wards)
    HOSPITAL: {
        male_closet: {
            1: { factor: 20 }, 2: { factor: 25 }, 3: { factor: 30 }
        },
        male_urinal: {
            1: { factor: 20 }, 2: { factor: 25 }, 3: { factor: 30 }
        },
        male_lavatory: {
            1: { factor: 15 }, 2: { factor: 20 }, 3: { factor: 25 }
        },
        female_closet: {
            1: { factor: 10 }, 2: { factor: 12 }, 3: { factor: 15 }
        },
        female_lavatory: {
            1: { factor: 15 }, 2: { factor: 20 }, 3: { factor: 25 }
        }
    }
};

export const BUILDING_USAGE_LABELS: Record<BuildingUsage, string> = {
    OFFICE: '事務所 (Office)',
    SCHOOL: '学校 (School)',
    THEATER: '劇場 (Theater)',
    DEPT_STORE: '百貨店・量販店 (Dept Store)',
    DORMITORY: '寄宿舎 (Dormitory)',
    HOSPITAL: '病院・病棟 (Hospital)',
};
