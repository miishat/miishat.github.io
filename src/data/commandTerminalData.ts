/**
 * @file commandTerminalData.ts
 * @description Data and command handling for the Run Simulation command terminal:
 * contact channels, theme options, and the terminal commands
 * (help, whoami, skills, contact, run_test, resume, theme, clear).
 * @author Mishat
 */
import { Mail, Linkedin, Github, FileDown, LucideIcon } from 'lucide-react';

export type Theme = 'default' | 'silicon' | 'light';

const EMAIL = 'mishath@mun.ca';
const RESUME = '/Mishat_Hassan_Resume.pdf';

export interface Channel {
    id: string;
    /** Signal-style name shown in the Objects tab */
    signal: string;
    label: string;
    value: string;
    href: string;
    icon: LucideIcon;
    accent: string;
    download?: boolean;
}

export const CHANNELS: Channel[] = [
    { id: 'email', signal: 'email_tx', label: 'Email', value: EMAIL, href: `mailto:${EMAIL}`, icon: Mail, accent: 'var(--color-electric)' },
    { id: 'linkedin', signal: 'lnkd_out', label: 'LinkedIn', value: 'in/mishathassan', href: 'https://www.linkedin.com/in/mishathassan', icon: Linkedin, accent: 'var(--color-neonpurple)' },
    { id: 'github', signal: 'git_out', label: 'GitHub', value: 'github.com/miishat', href: 'https://github.com/miishat', icon: Github, accent: 'var(--color-success)' },
    { id: 'resume', signal: 'cv_dump', label: 'Resume', value: 'Mishat_Hassan_Resume.pdf', href: RESUME, icon: FileDown, accent: 'var(--color-pcbgold)', download: true },
];

/** Display names match the `theme <name>` command; `default` is shown as dark. */
export const THEMES: { id: Theme; label: string }[] = [
    { id: 'default', label: 'dark' },
    { id: 'silicon', label: 'silicon' },
    { id: 'light', label: 'light' },
];

export type Line = { kind: 'in' | 'out' | 'info' | 'pass' | 'err'; text: string };

export const HELP = 'help · whoami · skills · contact · run_test · resume · theme <dark|silicon|light> · clear';

function downloadResume() {
    const a = document.createElement('a');
    a.href = RESUME;
    a.download = 'Mishat_Hassan_Resume.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

/**
 * Runs one terminal command. Side effects (theme switch, resume download) happen here.
 * @returns the output lines, or 'clear' to empty the transcript
 */
export function runCommand(raw: string, onThemeChange: (t: Theme) => void): Line[] | 'clear' {
    const [cmd, arg] = raw.trim().toLowerCase().split(/\s+/);
    switch (cmd) {
        case 'help': return [{ kind: 'out', text: HELP }];
        case 'whoami': return [{ kind: 'out', text: 'Mishat · Senior Design Verification Engineer @ Marvell Technology' }];
        case 'skills': return [{ kind: 'out', text: 'SystemVerilog, UVM, Python, Formal Verification, Verdi, DVE, C++' }];
        case 'contact': return CHANNELS.filter(c => !c.download).map(c => ({ kind: 'info', text: `${c.label.padEnd(9)} ${c.value}` }));
        case 'run_test': return [
            { kind: 'info', text: 'UVM_INFO @ 0: starting test_portfolio' },
            { kind: 'info', text: 'UVM_INFO @ 120ns: phases build → connect → run' },
            { kind: 'pass', text: 'TEST PASSED · UVM_ERROR : 0 · UVM_FATAL : 0' },
        ];
        case 'resume':
            downloadResume();
            return [{ kind: 'info', text: 'UVM_INFO: dumping Mishat_Hassan_Resume.pdf ...' }];
        case 'theme': {
            const match = THEMES.find(t => t.label === arg);
            if (!match) return [{ kind: 'err', text: 'usage: theme <dark|silicon|light>' }];
            onThemeChange(match.id);
            return [{ kind: 'info', text: `theme → ${match.label}` }];
        }
        case 'clear': return 'clear';
        case undefined:
        case '': return [];
        default: return [{ kind: 'err', text: `** Error: unknown command "${cmd}". Type help.` }];
    }
}
