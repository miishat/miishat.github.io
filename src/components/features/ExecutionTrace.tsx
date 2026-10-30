/**
 * @file ExecutionTrace.tsx
 * @description The Execution Trace (career) section: a log timeline and a
 * GTKWave-style waveform of the same entries, switched by a two-segment toggle.
 * The views are linked: picking a log entry parks the waveform cursor on it,
 * and clicking the waveform selects the entry under the cursor.
 * @module Components/Features
 * @author Mishat
 */
import React, { useEffect, useRef, useState, createRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useSignal } from '../../context/SignalContext';
import { TRACE_DATA, PRESENT } from '../../data/traceData';
import SectionHeader from '../ui/SectionHeader';

type Entry = typeof TRACE_DATA[number];
type Mode = 'log' | 'wave';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/** Decimal year (2025.41) to "May 2025" */
const formatYear = (y: number) => {
    const month = Math.max(0, Math.min(11, Math.round((y - Math.floor(y)) * 12) - 1));
    return `${MONTH_NAMES[month]} ${Math.floor(y)}`;
};
const isOngoing = (e: Entry) => e.end >= PRESENT - 0.1;
const formatRange = (e: Entry) => `${formatYear(e.start)} - ${isOngoing(e) ? 'Present' : formatYear(e.end)}`;
const orgOf = (e: Entry) => e.company || e.school;
const shortTitle = (e: Entry) => e.title.replace('Design Verification Engineer Intern', 'DV Intern').replace('Design Verification', 'DV');
const endOf = (e: Entry) => Math.min(e.end, PRESENT);
const midOf = (e: Entry) => e.start + (endOf(e) - e.start) / 2;

const TYPE_COLOR: Record<string, string> = { WORK: '#00f3ff', INTERN: '#d4af37', EDU: '#b026ff' };
const TYPE_TAG: Record<string, string> = { WORK: 'ROLE', INTERN: 'INTERN', EDU: 'EDU' };
const rgba = (hex: string, a: number) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// --- Time axis ---------------------------------------------------------------

const T0 = 2017;
const T1 = Math.ceil(PRESENT);
const YEARS = Array.from({ length: T1 - T0 + 1 }, (_, i) => T0 + i);
/** Year to percent along the axis */
const tx = (y: number) => ((y - T0) / (T1 - T0)) * 100;

// --- Which entry drives each signal over time --------------------------------

type Seg = { a: number; b: number; e: Entry | null };

const activeAt = (t: number, types?: string[]) =>
    TRACE_DATA.filter(e => t >= e.start && t < e.end && (!types || types.includes(e.type)));
/** Work wins over school where they overlap (the internship ran during the degree) */
const primaryAt = (t: number) =>
    activeAt(t).sort((x, y) => (x.type === 'EDU' ? 1 : 0) - (y.type === 'EDU' ? 1 : 0))[0] ?? null;

/** Splits [T0, PRESENT] into runs of whichever entry drives a signal; null is undriven (z) */
const drive = (pick: (t: number) => Entry | null): Seg[] => {
    const cuts = [...new Set([T0, PRESENT, ...TRACE_DATA.flatMap(e => [e.start, endOf(e)])])].sort((x, y) => x - y);
    const segs: Seg[] = [];
    for (let i = 0; i < cuts.length - 1; i++) {
        const a = cuts[i], b = cuts[i + 1], e = pick((a + b) / 2), last = segs[segs.length - 1];
        if (last && last.e === e) last.b = b; else segs.push({ a, b, e });
    }
    return segs;
};

const SEG_STATE = drive(primaryAt);
const SEG_WORK = drive(t => activeAt(t, ['WORK', 'INTERN'])[0] ?? null);
const SEG_EDU = drive(t => activeAt(t, ['EDU'])[0] ?? null);

const BUS_ROWS: { name: string; color: string; segs: Seg[]; label: (e: Entry) => string }[] = [
    { name: 'state[3:0]', color: 'text-pcbgold', segs: SEG_STATE, label: e => e.stateCode },
    { name: 'work.org', color: 'text-electric', segs: SEG_WORK, label: orgOf },
    { name: 'work.role', color: 'text-electric', segs: SEG_WORK, label: shortTitle },
    { name: 'edu.school', color: 'text-neonpurple', segs: SEG_EDU, label: orgOf },
    { name: 'edu.degree', color: 'text-neonpurple', segs: SEG_EDU, label: e => e.degree },
];
const ROW_H = 36;

const CLK_CYCLES = 54;
const CLK_PATH = 'M 0 26 ' + Array.from({ length: CLK_CYCLES }, (_, i) => {
    const a = (i / CLK_CYCLES) * 1000, b = ((i + 0.5) / CLK_CYCLES) * 1000, c = ((i + 1) / CLK_CYCLES) * 1000;
    return `L ${a} 6 L ${b} 6 L ${b} 26 L ${c} 26`;
}).join(' ');

// --- Shared bits ---------------------------------------------------------------

const ModeToggle = ({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) => (
    <div className="flex font-mono text-sm border border-gray-700 rounded-lg overflow-hidden shrink-0">
        {(['log', 'wave'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-2 transition-colors ${m === 'wave' ? 'border-l border-gray-700' : ''} ${mode === m ? 'bg-gray-800 text-electric' : 'bg-gray-900 text-gray-500 hover:text-white'}`}>
                {m === 'log' ? 'Log' : 'Waveform'}
            </button>
        ))}
    </div>
);

// --- Log view ------------------------------------------------------------------

/** Where an entry sits on the waveform's time axis */
const SpanBar = ({ e }: { e: Entry }) => (
    <div className="relative h-1 rounded-full bg-gray-800 overflow-hidden">
        <div className="absolute inset-y-0 rounded-full"
            style={{ left: `${tx(e.start)}%`, width: `${tx(endOf(e)) - tx(e.start)}%`, background: TYPE_COLOR[e.type] }} />
    </div>
);

interface LogEntryProps {
    entry: Entry;
    targetRef: React.RefObject<HTMLDivElement | null>;
    isHit: boolean;
    isLast: boolean;
    selected: boolean;
    onSelect: () => void;
    onShowWave: () => void;
}

const LogEntry = ({ entry: e, targetRef, isHit, isLast, selected, onSelect, onShowWave }: LogEntryProps) => {
    const color = TYPE_COLOR[e.type];
    const lit = selected || isHit;
    return (
        <div ref={targetRef} className="relative pl-10 pb-8">
            {!isLast && <span className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-gray-800" />}
            <span className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 transition-all"
                style={{ borderColor: color, background: lit ? color : 'var(--color-obsidian)', boxShadow: lit ? `0 0 12px ${color}` : 'none' }} />
            {isOngoing(e) && <span className="absolute left-0 top-1.5 w-4 h-4 rounded-full animate-ping" style={{ background: rgba(color, 0.4) }} />}

            <div onClick={onSelect}
                className="cursor-pointer rounded-lg border p-5 transition-colors"
                style={{ borderColor: lit ? 'var(--color-electric)' : 'var(--color-gray-800)', background: lit ? 'var(--color-gray-900)' : 'transparent' }}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
                    <span className="text-electric text-sm">{formatRange(e)}</span>
                    <span className="px-1.5 rounded border" style={{ color, borderColor: rgba(color, 0.5) }}>{TYPE_TAG[e.type]}</span>
                    <span className="ml-auto text-gray-600">{e.stateCode}</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-2">{e.title} <span className="text-gray-400">@ {orgOf(e)}</span></h3>
                {e.degree && <div className="text-pcbgold font-mono text-xs mt-1">{e.degree}</div>}
                <p className="text-gray-400 mt-2 leading-relaxed">{e.description}</p>
                <div className="mt-4 flex items-center gap-3 font-mono text-[10px] text-gray-600">
                    <span>{T0}</span>
                    <div className="flex-1"><SpanBar e={e} /></div>
                    <span>now</span>
                    <button onClick={ev => { ev.stopPropagation(); onShowWave(); }} className="text-gray-500 hover:text-electric transition-colors">
                        view in waveform →
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Waveform view -------------------------------------------------------------

const BusLane = ({ segs, selected, label }: { segs: Seg[]; selected: number | null; label: (e: Entry) => string }) => {
    const m = ROW_H / 2, top = 5, bot = ROW_H - 5;
    return (
        <div className="relative" style={{ height: ROW_H }}>
            <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 1000 ${ROW_H}`} preserveAspectRatio="none">
                {segs.map((s, k) => {
                    const x1 = tx(s.a) * 10, x2 = tx(s.b) * 10;
                    if (!s.e) return <line key={k} x1={x1} x2={x2} y1={m} y2={m} stroke="var(--color-pcbgold)" strokeOpacity={0.6} strokeDasharray="4 3" strokeWidth={1} vectorEffect="non-scaling-stroke" />;
                    const color = TYPE_COLOR[s.e.type], on = selected === s.e.id;
                    const d = `M ${x1} ${m} L ${x1 + 5} ${top} L ${x2 - 5} ${top} L ${x2} ${m} L ${x2 - 5} ${bot} L ${x1 + 5} ${bot} Z`;
                    return <path key={k} d={d} fill={rgba(color, on ? 0.35 : 0.14)} stroke={color} strokeOpacity={on ? 1 : 0.5} strokeWidth={1} vectorEffect="non-scaling-stroke" />;
                })}
            </svg>
            {segs.map((s, k) => s.e && (
                <span key={k} className="absolute inset-y-0 flex items-center px-2.5 text-[11px] pointer-events-none"
                    style={{ left: `${tx(s.a)}%`, width: `${tx(s.b) - tx(s.a)}%`, color: TYPE_COLOR[s.e.type] }}>
                    <span className="truncate">{label(s.e)}</span>
                </span>
            ))}
        </div>
    );
};

const StaticLane = ({ path, color }: { path: string; color: string }) => (
    <svg className="block w-full" style={{ height: ROW_H }} viewBox="0 0 1000 32" preserveAspectRatio="none">
        <path d={path} fill="none" stroke={color} strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
);

interface WaveformProps {
    cursor: number;
    setCursor: (t: number) => void;
    selected: number | null;
    onPick: (id: number) => void;
}

const Waveform = ({ cursor, setCursor, selected, onPick }: WaveformProps) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const under = primaryAt(cursor);
    const focus = TRACE_DATA.find(e => e.id === selected) ?? under;

    const onMouseMove = (ev: React.MouseEvent) => {
        const r = canvasRef.current!.getBoundingClientRect();
        setCursor(T0 + Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * (T1 - T0));
    };
    const valueAt = (segs: Seg[], label: (e: Entry) => string) => {
        const s = segs.find(s => cursor >= s.a && cursor < s.b);
        return s?.e ? label(s.e) : 'z';
    };

    return (
        <>
            <div className="border border-gray-800 rounded-lg bg-obsidian overflow-hidden font-mono text-xs shadow-2xl select-none">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
                    <div className="flex items-center gap-4">
                        <span className="text-electric font-bold">career.vcd</span>
                        <span className="text-gray-500 hidden sm:inline">{T0} → {formatYear(PRESENT)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-gray-500">cursor <span className="text-pcbgold">{formatYear(cursor)}</span></span>
                        <span className="px-2 py-0.5 rounded border border-gray-700 text-success">ZOOM 100%</span>
                    </div>
                </div>
                <div className="grid grid-cols-[9rem_1fr] md:grid-cols-[15rem_1fr]">
                    {/* Signal names with their value at the cursor */}
                    <div className="border-r border-gray-800 bg-gray-900">
                        <div className="h-7 px-3 flex items-center text-gray-600 border-b border-gray-800">signals</div>
                        {[{ name: 'sys_clk', color: 'text-success' }, { name: 'rst_n', color: 'text-red-400' }].map(r => (
                            <div key={r.name} className="px-3 flex items-center justify-between border-b border-gray-800" style={{ height: ROW_H }}>
                                <span className={r.color}>{r.name}</span><span className="text-gray-500">1</span>
                            </div>
                        ))}
                        {BUS_ROWS.map(r => (
                            <div key={r.name} className="px-3 flex items-center justify-between gap-2 border-b border-gray-800" style={{ height: ROW_H }}>
                                <span className={r.color}>{r.name}</span>
                                <span className="hidden md:inline truncate px-1 rounded bg-gray-800 text-gray-300 max-w-[7rem]">{valueAt(r.segs, r.label)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Canvas */}
                    <div ref={canvasRef} onMouseMove={onMouseMove} onClick={() => under && onPick(under.id)} className="relative cursor-crosshair">
                        <div className="h-7 border-b border-gray-800 relative">
                            {YEARS.slice(0, -1).map(y => (
                                <span key={y} className="absolute top-1.5 text-[10px] text-gray-600" style={{ left: `calc(${tx(y)}% + 3px)` }}>{y}</span>
                            ))}
                        </div>
                        {YEARS.map(y => <span key={y} className="absolute top-0 bottom-0 border-l border-gray-800 pointer-events-none" style={{ left: `${tx(y)}%` }} />)}
                        {/* Hatched future: nothing simulated past today */}
                        <div className="absolute top-0 bottom-0 right-0 pointer-events-none"
                            style={{ left: `${tx(PRESENT)}%`, background: 'repeating-linear-gradient(135deg, transparent 0 6px, var(--color-gray-800) 6px 7px)', opacity: 0.6 }} />
                        <div className="border-b border-gray-800"><StaticLane path={CLK_PATH} color="var(--color-success)" /></div>
                        {/* rst_n is active low and never asserted */}
                        <div className="border-b border-gray-800"><StaticLane path="M 0 6 L 1000 6" color="#ff4d4d" /></div>
                        {BUS_ROWS.map(r => (
                            <div key={r.name} className="border-b border-gray-800"><BusLane segs={r.segs} selected={selected} label={r.label} /></div>
                        ))}
                        <div className="absolute top-0 bottom-0 w-px bg-pcbgold pointer-events-none" style={{ left: `${tx(cursor)}%` }}>
                            <span className="absolute top-1 left-1 px-1 rounded bg-pcbgold text-black text-[10px] whitespace-nowrap">{formatYear(cursor)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction detail for the selected entry */}
            <div className="mt-6 min-h-[9rem]">
                <AnimatePresence mode="wait">
                    {focus ? (
                        <motion.div key={focus.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="border border-gray-800 rounded-lg bg-gray-900 p-5 grid md:grid-cols-[12rem_1fr] gap-4">
                            <div className="font-mono text-xs flex flex-col gap-1.5">
                                <span className="text-gray-500">transaction · {focus.stateCode}</span>
                                <span className="text-electric">{formatRange(focus)}</span>
                                <span style={{ color: TYPE_COLOR[focus.type] }}>{TYPE_TAG[focus.type]}</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{focus.title} <span className="text-gray-400">@ {orgOf(focus)}</span></h3>
                                {focus.degree && <div className="text-pcbgold font-mono text-xs mt-1">{focus.degree}</div>}
                                <p className="text-gray-400 text-sm mt-2 leading-relaxed">{focus.description}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="idle" className="font-mono text-sm text-gray-500">bus idle at {formatYear(cursor)} (z)</motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

// --- Section -------------------------------------------------------------------

const ExecutionTrace = () => {
    const { registerTarget, activeHits } = useSignal();
    // One stable ref per entry, registered once in TRACE_DATA order so signal
    // packets can target log entries by index (`trace-${i}`) across view switches
    const targetRefs = useRef(TRACE_DATA.map(() => createRef<HTMLDivElement>()));
    useEffect(() => { targetRefs.current.forEach(ref => registerTarget('trace', ref)); }, []);

    const [mode, setMode] = useState<Mode>('log');
    const [selected, setSelected] = useState<number | null>(TRACE_DATA[0].id);
    const [cursor, setCursor] = useState(midOf(TRACE_DATA[0]));
    const select = (e: Entry) => { setSelected(e.id); setCursor(midOf(e)); };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-12 gap-4">
                <SectionHeader icon={Zap} title="Execution Trace" subtitle='$monitor("Career Log: %t", $time);' className="mb-0" />
                <ModeToggle mode={mode} setMode={setMode} />
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    {mode === 'log' ? (
                        <div className="ml-2 md:ml-8 mt-4">
                            {TRACE_DATA.map((e, i) => (
                                <LogEntry key={e.id} entry={e} targetRef={targetRefs.current[i]} isHit={activeHits.has(`trace-${i}`)}
                                    isLast={i === TRACE_DATA.length - 1} selected={selected === e.id}
                                    onSelect={() => select(e)} onShowWave={() => { select(e); setMode('wave'); }} />
                            ))}
                        </div>
                    ) : (
                        <Waveform cursor={cursor} setCursor={setCursor} selected={selected} onPick={setSelected} />
                    )}
                </motion.div>
            </AnimatePresence>
        </>
    );
};

export default ExecutionTrace;
