/**
 * @file projectsData.ts
 * @description Static data for the Side Projects section (hobby repos on github.com/miishat).
 * Each project is drawn as an IP block on a chip floorplan.
 * @author Mishat
 */

export type ProjectKind = 'dv' | 'app';

export interface SideProject {
    id: string;
    code: string;
    title: string;
    kind: ProjectKind;
    status: 'ACTIVE' | 'LIVE' | 'STABLE';
    accent: string;
    stack: string[];
    summary: string;
    highlights: string[];
    facts: { label: string; value: string }[];
    repo: string;
    live?: string;
    /** Floorplan placement on the 6x3 die grid: DV region is the left 2 columns, apps the right 4 */
    area: { col: string; row: string };
}

export const KIND_LABEL: Record<ProjectKind, string> = {
    dv: 'DV-adjacent',
    app: 'App',
};

export const SIDE_PROJECTS: SideProject[] = [
    {
        id: 'eth',
        code: 'DV_01',
        title: 'Ethernet Onboarding',
        kind: 'dv',
        status: 'ACTIVE',
        accent: 'var(--color-electric)',
        stack: ['React', 'TypeScript', 'Vite'],
        summary: 'An interactive instrument for learning the high-speed Ethernet PHY stack, one sublayer at a time.',
        highlights: [
            'Covers 400G, 800G and 1.6T; switch rate and direction and watch the arithmetic change.',
            'Follow a single frame from MAC octets all the way to PAM4 symbols on the wire.',
            'Rebuilt from one 3,000-line component into a modular app.',
        ],
        facts: [
            { label: 'Up to', value: '1.6T' },
            { label: 'Depth', value: 'MAC→PAM4' },
            { label: 'Walkthrough', value: '9 stages' },
        ],
        repo: 'https://github.com/miishat/ethernet-onboarding',
        area: { col: '1 / 3', row: '1 / 2' },
    },
    {
        id: 'an',
        code: 'DV_02',
        title: 'AN Page Analyzer',
        kind: 'dv',
        status: 'STABLE',
        accent: 'var(--color-success)',
        stack: ['React', 'TypeScript', 'Tailwind'],
        summary: 'Quickly analyze Ethernet Auto-negotiation Base Pages and Next Pages.',
        highlights: [
            'Decodes Auto-negotiation Base Pages and Next Pages.',
            'Compare mode decodes two pages side by side and flags every field that differs.',
            'Runs entirely in the browser.',
        ],
        facts: [
            { label: 'Protocol', value: 'Ethernet AN' },
            { label: 'Pages', value: 'Base + Next' },
            { label: 'Abilities', value: 'to 800G' },
        ],
        repo: 'https://github.com/miishat/AN-Page-Analyzer',
        area: { col: '1 / 3', row: '2 / 3' },
    },
    {
        id: 'dvkb',
        code: 'DV_03',
        title: 'DV Knowledge Base',
        kind: 'dv',
        status: 'STABLE',
        accent: 'var(--color-pcbgold)',
        stack: ['React', 'TypeScript', 'Zustand', 'PWA'],
        summary: 'Reusable Design Verification patterns that turn tribal DV intuition into explicit, searchable verification strategies.',
        highlights: [
            'Captures verification strategies as reusable, searchable patterns.',
            'Each pattern pairs its common failure modes with the assertions, tests and coverage that catch them.',
            'Installable as a PWA.',
        ],
        facts: [
            { label: 'Format', value: 'Patterns' },
            { label: 'Search', value: 'Yes' },
            { label: 'Install', value: 'PWA' },
        ],
        repo: 'https://github.com/miishat/DV-Knowledge-Base',
        area: { col: '1 / 3', row: '3 / 4' },
    },
    {
        id: 'ledger',
        code: 'APP_01',
        title: 'Ledger',
        kind: 'app',
        status: 'ACTIVE',
        accent: 'var(--color-neonpurple)',
        stack: ['React', 'TypeScript', 'Recharts', 'PWA'],
        summary: 'A private, offline-first personal finance dashboard: budgeting, investments, planning and compensation.',
        highlights: [
            'Everything is stored in your own browser: no backend, no account, no telemetry.',
            'Optional Google Drive sync between your own devices, using the narrow drive.file scope.',
        ],
        facts: [
            { label: 'Forecast', value: 'Monte Carlo' },
            { label: 'Themes', value: '6' },
            { label: 'Sync', value: 'Opt-in' },
        ],
        repo: 'https://github.com/miishat/ledger',
        area: { col: '5 / 7', row: '1 / 2' },
    },
    {
        id: 'cart',
        code: 'APP_02',
        title: 'CartCraft',
        kind: 'app',
        status: 'ACTIVE',
        accent: '#ff7a59',
        stack: ['React', 'TypeScript', 'Dexie', 'PWA'],
        summary: 'Turns saved recipes into one consolidated, aisle-sorted shopping list for your phone.',
        highlights: [
            'Works offline as an installed app; data stays on the device in IndexedDB.',
            'The same recipes always give the same list: every quantity comes from plain code, never from AI.',
            'Optional AI helper with your own key, kept on the device.',
        ],
        facts: [
            { label: 'Storage', value: 'IndexedDB' },
            { label: 'Offline', value: 'Yes' },
            { label: 'AI', value: 'Opt-in' },
        ],
        repo: 'https://github.com/miishat/cartcraft',
        area: { col: '3 / 5', row: '3 / 4' },
    },
    {
        id: 'gym',
        code: 'APP_03',
        title: 'GymStack',
        kind: 'app',
        status: 'LIVE',
        accent: '#ff3e8a',
        stack: ['React', 'TypeScript', 'Framer Motion', 'PWA'],
        summary: 'A privacy-first PWA for pure gym tracking. No clouds, no accounts, just your gains stored locally on your device.',
        highlights: [
            'No cloud and no accounts: workouts stay on your device.',
            'Installable PWA.',
        ],
        facts: [
            { label: 'Tools', value: '1RM + Plates' },
            { label: 'Storage', value: 'Local' },
            { label: 'Install', value: 'PWA' },
        ],
        repo: 'https://github.com/miishat/gymstack',
        live: 'https://miishat.github.io/gymstack/',
        area: { col: '5 / 7', row: '3 / 4' },
    },
    {
        id: 'series',
        code: 'APP_04',
        title: 'SeriesTrackr',
        kind: 'app',
        status: 'ACTIVE',
        accent: '#60a5fa',
        stack: ['React', 'TypeScript', 'Node', 'Vitest', 'Playwright'],
        summary: 'Tracks the book series you are reading and finds out when the next book and its audiobook come out.',
        highlights: [
            'Checks Apple Books, Open Library, Google Books and Hardcover, with optional web search and AI on your own keys.',
            'Only keeps a release date a cited source backs, and never copies a date from one format to another.',
            'Your library, notes and keys stay in the browser; discovery runs as an optional local service.',
        ],
        facts: [
            { label: 'Catalogs', value: '4' },
            { label: 'Dates', value: 'Cited' },
            { label: 'Tests', value: '1.1k+' },
        ],
        repo: 'https://github.com/miishat/seriestrackr',
        area: { col: '3 / 5', row: '1 / 3' },
    },
    {
        id: 'stuff',
        code: 'APP_05',
        title: 'Stuff',
        kind: 'app',
        status: 'LIVE',
        accent: '#2dd4bf',
        stack: ['React', 'TypeScript', 'Tailwind', 'PWA'],
        summary: 'A simple task manager with Kanban boards, workspaces, custom views and a dark mode.',
        highlights: [
            'Board, calendar, analytics and archive views over the same tasks.',
            'Command palette, rich-text task notes and labels.',
            'Installable PWA with backup export and import.',
        ],
        facts: [
            { label: 'Views', value: '4' },
            { label: 'Install', value: 'PWA' },
            { label: 'Palette', value: 'Ctrl+K' },
        ],
        repo: 'https://github.com/miishat/Stuff',
        live: 'https://miishat.github.io/Stuff/',
        area: { col: '5 / 7', row: '2 / 3' },
    },
];
