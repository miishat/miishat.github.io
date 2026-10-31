/**
 * @file skillsData.ts
 * @description Static data for the Functional Coverage section.
 * Each skill is sorted as its own wafer; `level` is its coverage (wafer yield) in percent.
 * @author Mishat
 */

export interface Skill {
    name: string;
    level: number;
    /** Die colour on the wafer and fill colour of the slot bar; a theme's --series-N */
    color: string;
}

export const SKILLS: Skill[] = [
    { name: 'SystemVerilog', level: 95, color: 'var(--series-1)' },
    { name: 'UVM Framework', level: 90, color: 'var(--series-2)' },
    { name: 'Python / Scripting', level: 85, color: 'var(--series-3)' },
    { name: 'Ethernet / COMPHY', level: 80, color: 'var(--series-4)' },
    { name: 'Verdi / DVE', level: 88, color: 'var(--series-5)' },
    { name: 'Formal (JasperGold)', level: 75, color: 'var(--series-6)' },
];

/** Mean coverage across all skills, shown as the lot's Overall Yield */
export const OVERALL_YIELD = Math.round(SKILLS.reduce((sum, s) => sum + s.level, 0) / SKILLS.length);
