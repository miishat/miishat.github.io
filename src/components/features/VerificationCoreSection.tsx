/**
 * @file VerificationCoreSection.tsx
 * @description The Verification Core section drawn as a UVM testbench.
 * The left card is a print_topology() tree (test, env, one agent per methodology, scoreboard).
 * Hovering, focusing or tapping a tree node drives the right card; the right card itself is
 * display-only, so moving the pointer across it never changes what it shows.
 * uvm_test_top (the philosophy) is pinned to the bottom of the right card.
 * Phones list only the agents (their sqr/drv/mon rows say nothing new), with taller tap rows,
 * so the inspector stacked under the tree stays in view.
 * @module Components/Features
 * @author Mishat
 */
import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import Section from '../layout/Section';
import SectionHeader from '../ui/SectionHeader';
import { HIGHLIGHTS, METHODOLOGIES, Methodology, PHILOSOPHY_BODY, PHILOSOPHY_LEAD } from '../../data/verificationData';

interface TopoNode {
    id: string;
    depth: number;
    label: string;
    type: string;
    method?: Methodology;
    /** Last child at its depth, drawn with a closing branch */
    last?: boolean;
}

const NODES: TopoNode[] = [
    { id: 'test', depth: 0, label: 'uvm_test_top', type: 'portfolio_test' },
    { id: 'env', depth: 1, label: 'env', type: 'mishat_env', last: true },
    ...METHODOLOGIES.flatMap((m): TopoNode[] => [
        { id: m.id, depth: 2, label: `${m.short}_agent`, type: `${m.short}_agent_t`, method: m },
        { id: `${m.id}-sqr`, depth: 3, label: 'sqr', type: 'uvm_sequencer', method: m },
        { id: `${m.id}-drv`, depth: 3, label: 'drv', type: 'uvm_driver', method: m },
        { id: `${m.id}-mon`, depth: 3, label: 'mon', type: 'uvm_monitor', method: m, last: true },
    ]),
    { id: 'sb', depth: 2, label: 'sb', type: 'mishat_scoreboard', last: true },
];

/** test_top and env both stand for the whole testbench. */
const isRoot = (n: TopoNode) => n.id === 'test' || n.id === 'env';

/** ASCII branch prefix in the style of uvm print_topology(). */
const branch = (n: TopoNode) => (n.depth ? '  '.repeat(n.depth - 1) + (n.last ? '`-- ' : '|-- ') : '');

const TopologyTree = ({ sel, onSelect }: { sel: string; onSelect: (id: string) => void }) => (
    <div className="verification-topology border border-gray-800 rounded-lg bg-obsidian overflow-hidden">
        <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 text-[11px] text-gray-500">
            <span className="text-success">UVM_INFO</span> @ 0: uvm_test_top [UVMTOP] UVM testbench topology:
        </div>
        <div className="py-3 text-[13px]">
            <div className="grid grid-cols-[1fr_auto] px-4 text-[10px] text-gray-600 mb-1">
                <span>Name</span><span className="hidden sm:block">Type</span>
            </div>
            {NODES.map(n => {
                const on = n.id === sel;
                const dim = n.depth === 3;
                const color = on ? (n.method?.accent ?? 'var(--color-electric)') : dim ? 'var(--color-gray-500)' : n.method?.accent ?? 'var(--color-gray-200)';
                return (
                    <button
                        key={n.id}
                        onMouseEnter={() => onSelect(n.id)}
                        onFocus={() => onSelect(n.id)}
                        onClick={() => onSelect(n.id)}
                        aria-pressed={on}
                        className={`w-full grid grid-cols-[1fr_auto] px-4 leading-7 text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-electric ${on ? 'bg-gray-800/70' : 'hover:bg-gray-900/70'} ${dim ? 'max-md:hidden' : 'max-md:leading-9'}`}
                    >
                        <span className="whitespace-pre">
                            <span className="text-gray-700">{branch(n)}</span>
                            <span style={{ color }}>{n.label}</span>
                        </span>
                        <span className="hidden sm:block text-gray-600 text-[11px]">{n.type}</span>
                    </button>
                );
            })}
        </div>
    </div>
);

/** All four agents as large title cards, shown when the whole testbench is selected. */
const AgentOverview = () => (
    <div className="grid grid-cols-2 auto-rows-fr gap-4 flex-1">
        {METHODOLOGIES.map(m => (
            <div
                key={m.id}
                className="border border-gray-800 rounded-lg bg-obsidian/60 p-4 sm:p-6 lg:p-5 flex flex-col justify-between gap-6 lg:gap-2 min-h-[130px] lg:min-h-0"
                style={{ borderLeft: `4px solid ${m.accent}` }}
            >
                <span className="w-12 h-12 lg:w-10 lg:h-10 rounded-md border flex items-center justify-center" style={{ borderColor: m.accent }}>
                    <m.icon size={22} style={{ color: m.accent }} />
                </span>
                <span className="font-sans font-bold text-white text-lg sm:text-xl leading-tight">{m.title}</span>
            </div>
        ))}
    </div>
);

const AgentDetail = ({ node }: { node: TopoNode }) => {
    const m = node.method!;
    return (
        <>
            <div className="flex items-center gap-3 mb-4">
                <span className="w-11 h-11 rounded-md border flex items-center justify-center" style={{ borderColor: m.accent }}>
                    <m.icon size={20} style={{ color: m.accent }} />
                </span>
                <h3 className="font-sans text-2xl font-bold text-white">{m.title}</h3>
            </div>
            <p className="font-sans text-gray-300 leading-relaxed">{m.desc}</p>
            {node.depth === 3 && <p className="text-[11px] text-gray-500 mt-4">// {node.type} inside {m.short}_agent</p>}
        </>
    );
};

const Scoreboard = () => (
    <div className="space-y-3">
        <h3 className="font-sans text-2xl font-bold text-white mb-2">Scoreboard</h3>
        {HIGHLIGHTS.map(h => (
            <div key={h.label} className="flex items-center gap-3 text-sm text-gray-200">
                <span style={{ color: h.color }}>{h.mark}</span>{h.label}
                <span className="ml-auto text-[10px] text-success">MATCH</span>
            </div>
        ))}
    </div>
);

export default function VerificationCoreSection() {
    const [sel, setSel] = useState('test');
    const node = NODES.find(n => n.id === sel)!;

    return (
        <Section fill={false} className="relative overflow-hidden pt-[28rem] pb-48 max-md:pt-40 max-md:pb-24" id="verification">
            <div className="max-w-7xl w-full z-10 relative">
                <SectionHeader icon={Activity} title="Verification Core" subtitle="module portfolio_top;" />

                <div className="mt-12 w-full grid lg:grid-cols-2 gap-6 items-stretch font-mono">
                    <TopologyTree sel={sel} onSelect={setSel} />

                    {/* Inspector: display-only, driven by the tree. Side by side, the tree alone sets the
                        row height and the inspector fills it, so switching nodes never resizes the section */}
                    <div className="relative">
                    <aside className="lg:absolute lg:inset-0 h-full border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-md flex flex-col overflow-hidden">
                        <div className="p-6 sm:p-8 flex-1 flex flex-col" aria-live="polite">
                            <div className="text-[11px] text-gray-500 mb-4">{node.label} : {node.type}</div>
                            {isRoot(node) ? <AgentOverview /> : node.id === 'sb' ? <Scoreboard /> : <AgentDetail node={node} />}
                        </div>

                        {/* uvm_test_top is always pinned here */}
                        <div className={`px-6 sm:px-8 py-6 border-t transition-colors ${node.id === 'test' ? 'border-electric bg-gray-800/40' : 'border-gray-800 bg-obsidian/40'}`}>
                            <div className="text-[10px] text-gray-500 mb-2">// uvm_test_top</div>
                            <p className="font-sans text-base text-white font-semibold leading-snug mb-2">{PHILOSOPHY_LEAD}</p>
                            <p className="font-sans text-sm text-gray-400 leading-relaxed">{PHILOSOPHY_BODY}</p>
                        </div>
                    </aside>
                    </div>
                </div>
            </div>
        </Section>
    );
}
