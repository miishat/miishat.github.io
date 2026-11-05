/**
 * @file CommandTerminal.tsx
 * @description The Run Simulation footer content: a simulator-style command terminal.
 * An icon rail on the left runs the common actions (run_test, contact, resume, theme,
 * help, clear); the body has a Transcript tab with a VSIM> prompt that accepts every
 * terminal command, and an Objects tab listing the contact channels as signals.
 * @module Components/Features
 * @author Mishat
 */
import React, { useEffect, useRef, useState } from 'react';
import { Play, FileDown, Mail, Palette, HelpCircle, Trash2, TerminalSquare } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import { CHANNELS, HELP, Line, THEMES, Theme, runCommand } from '../../data/commandTerminalData';

const LINE_COLOR: Record<Line['kind'], string> = {
    in: 'text-gray-400',
    out: 'text-gray-200',
    info: 'text-electric',
    pass: 'text-success',
    err: 'text-red-400',
};

type Tab = 'transcript' | 'objects';

interface CommandTerminalProps {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
}

export default function CommandTerminal({ theme, onThemeChange }: CommandTerminalProps) {
    const [lines, setLines] = useState<Line[]>([{ kind: 'out', text: `# ${HELP}` }]);
    const [input, setInput] = useState('');
    const [tab, setTab] = useState<Tab>('transcript');
    const scroller = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
    }, [lines]);

    const exec = (cmd: string) => {
        const out = runCommand(cmd, onThemeChange);
        if (out === 'clear') return setLines([]);
        setLines(prev => [...prev, { kind: 'in', text: `VSIM> ${cmd}` }, ...out]);
    };

    /** Rail actions always land on the Transcript so their output is visible. */
    const run = (cmd: string) => {
        setTab('transcript');
        exec(cmd);
    };

    const themeIdx = Math.max(0, THEMES.findIndex(t => t.id === theme));
    const nextTheme = THEMES[(themeIdx + 1) % THEMES.length];

    const rail = [
        { icon: Play, label: 'run_test', act: () => run('run_test') },
        { icon: Mail, label: 'contact', act: () => run('contact') },
        { icon: FileDown, label: 'resume', act: () => run('resume') },
        { icon: Palette, label: `theme: ${THEMES[themeIdx].label} → ${nextTheme.label}`, short: 'theme', act: () => run(`theme ${nextTheme.label}`) },
        { icon: HelpCircle, label: 'help', act: () => run('help') },
        { icon: Trash2, label: 'clear', act: () => run('clear') },
    ];

    return (
        <div className="w-full max-w-6xl z-10 relative">
            <SectionHeader icon={TerminalSquare} title="Run Simulation" subtitle="vsim -c portfolio.command_terminal;" />

            <div className="border border-gray-700 rounded-lg overflow-hidden bg-obsidian shadow-2xl font-mono text-[13px] text-left grid grid-cols-[56px_1fr] max-md:grid-cols-1">
                {/* Icon rail; phones have no hover to show its labels, so it becomes one row of icons labelled underneath */}
                <nav aria-label="Terminal actions" className="bg-gray-900 border-r border-gray-800 flex flex-col items-center py-3 gap-1 max-md:grid max-md:grid-cols-6 max-md:gap-0.5 max-md:border-r-0 max-md:border-b max-md:px-1 max-md:py-1.5">
                    {rail.map(r => (
                        <button
                            key={r.label}
                            onClick={r.act}
                            aria-label={r.label}
                            className="group relative w-10 h-10 flex items-center justify-center rounded-md text-gray-500 hover:text-electric hover:bg-gray-800 focus-visible:outline focus-visible:outline-1 focus-visible:outline-electric max-md:w-auto max-md:h-auto max-md:flex-col max-md:gap-1 max-md:py-2 max-md:min-w-0"
                        >
                            <r.icon size={18} />
                            <span className="md:hidden text-[10px] leading-none" aria-hidden>{r.short ?? r.label}</span>
                            <span className="max-md:hidden pointer-events-none absolute left-12 whitespace-nowrap rounded-sm bg-gray-800 border border-gray-700 px-2 py-1 text-[11px] text-gray-200 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 z-10">
                                {r.label}
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="flex flex-col min-w-0">
                    {/* Tabs */}
                    <div role="tablist" className="flex text-xs bg-gray-900 border-b border-gray-800">
                        {(['transcript', 'objects'] as const).map(t => (
                            <button
                                key={t}
                                role="tab"
                                aria-selected={tab === t}
                                onClick={() => setTab(t)}
                                className={`px-4 py-2 border-r border-gray-800 capitalize ${tab === t ? 'bg-obsidian text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                        <span className="ml-auto px-4 py-2 text-gray-600 hidden sm:block">sim:/portfolio.command_terminal</span>
                    </div>

                    {tab === 'transcript' ? (
                        <div role="tabpanel" className="flex flex-col h-[420px] max-md:h-[360px]" onClick={() => inputRef.current?.focus()}>
                            <div ref={scroller} aria-live="polite" className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                                {lines.map((l, i) => (
                                    <div key={i} className={`whitespace-pre-wrap break-words ${LINE_COLOR[l.kind]}`}>{l.text}</div>
                                ))}
                            </div>
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    if (input.trim()) exec(input);
                                    setInput('');
                                }}
                                className="flex items-center gap-2 px-5 py-3 border-t border-gray-800"
                            >
                                <label htmlFor="vsim-input" className="text-electric">VSIM&gt;</label>
                                <input
                                    id="vsim-input"
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    autoComplete="off"
                                    spellCheck={false}
                                    className="flex-1 min-w-0 bg-transparent outline-none text-gray-100 placeholder-gray-600 max-md:text-base"
                                    placeholder="type help"
                                />
                            </form>
                        </div>
                    ) : (
                        <div role="tabpanel" className="h-[420px] overflow-y-auto">
                            <div className="grid grid-cols-[1fr_1.4fr_60px] px-5 py-2 text-[10px] text-gray-500 border-b border-gray-800">
                                <span>Name</span><span>Value</span><span>Kind</span>
                            </div>
                            {CHANNELS.map(c => (
                                <a
                                    key={c.id}
                                    href={c.href}
                                    target={c.href.startsWith('http') ? '_blank' : undefined}
                                    rel="noreferrer"
                                    download={c.download || undefined}
                                    className="grid grid-cols-[1fr_1.4fr_60px] items-center px-5 py-3.5 border-b border-gray-800/60 hover:bg-gray-900 group"
                                >
                                    <span className="flex items-center gap-2">
                                        <c.icon size={14} style={{ color: c.accent }} />
                                        <span className="text-gray-300 group-hover:text-white">{c.signal}</span>
                                    </span>
                                    <span className="text-gray-400 group-hover:text-white truncate">{c.value}</span>
                                    <span className="text-[10px] text-gray-600">{c.download ? 'pdf' : 'link'}</span>
                                </a>
                            ))}
                        </div>
                    )}

                    <div className="flex max-md:flex-wrap max-md:gap-x-4 px-5 py-1.5 border-t border-gray-800 bg-gray-900 text-[10px] text-gray-500">
                        <span>Now: 0 ns</span>
                        <span className="ml-auto">© {new Date().getFullYear()} Mishat. Designed inside the silicon.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
