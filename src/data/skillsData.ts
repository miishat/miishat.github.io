/**
 * @file skillsData.ts
 * @description Static data for the Functional Coverage section.
 * Each skill is sorted as its own wafer; `level` is its coverage (wafer yield) in percent.
 * @author Mishat
 */

export interface Skill {
    name: string;
    level: number;
    /** Die colour on the wafer and fill colour of the slot bar */
    color: string;
}

export const SKILLS: Skill[] = [
    { name: 'SystemVerilog', level: 95, color: '#00f3ff' },
    { name: 'UVM Framework', level: 90, color: '#00ff41' },
    { name: 'Python / Scripting', level: 85, color: '#d4af37' },
    { name: 'Ethernet / COMPHY', level: 80, color: '#b026ff' },
    { name: 'Verdi / DVE', level: 88, color: '#ff6b35' },
    { name: 'Formal (JasperGold)', level: 75, color: '#ff2d95' },
];

/** Mean coverage across all skills, shown as the lot's Overall Yield */
export const OVERALL_YIELD = Math.round(SKILLS.reduce((sum, s) => sum + s.level, 0) / SKILLS.length);
