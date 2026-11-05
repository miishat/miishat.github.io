/**
 * @file WaferCoverage.tsx
 * @description The Functional Coverage section drawn as a wafer sort.
 * When the section scrolls into view, a prober scans one wafer per skill and fills its slot in the rack.
 * Once the lot is sorted the stage shows every skill on one wafer; hovering a sector or slot highlights
 * that skill, and clicking shows its wafer without probing again. Only "re-run lot" replays the scan.
 * @module Components/Features
 * @author Mishat
 */
import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { SKILLS, OVERALL_YIELD } from '../../data/skillsData';
import { usePhone } from '../../usePhone';

const GRID = 15;        // dies per wafer row
const CELL = 20;        // die pitch in px
const PAD = 12;         // wafer edge to first die
const MS_PER_DIE = 5;   // probe pace; time-based so a slow render skips dies instead of slowing down
const SWAP_MS = 350;    // pause while the next wafer is loaded

interface Die { x: number; y: number; sector: number }

/** Dies inside the wafer circle; `sector` splits the full-lot view into one wedge per skill */
const DIES: Die[] = (() => {
    const dies: Die[] = [];
    const c = (GRID - 1) / 2;
    for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
            if (Math.hypot(x - c, y - c) > c + 0.3) continue;
            const angle = (Math.atan2(y - c, x - c) + Math.PI * 2.5) % (Math.PI * 2); // 0 at 12 o'clock
            dies.push({ x, y, sector: Math.floor(angle / ((Math.PI * 2) / SKILLS.length)) });
        }
    }
    return dies;
})();

/** Serpentine probe path: row by row, alternating direction */
const PROBE_ORDER = DIES.map((d, k) => ({ d, k }))
    .sort((a, b) => a.d.y - b.d.y || (a.d.y % 2 ? b.d.x - a.d.x : a.d.x - b.d.x))
    .map(o => o.k);

/** Per skill, the dies that pass: exactly `level`% of them, scattered deterministically */
const PASS: Set<number>[] = SKILLS.map((s, i) => {
    const scatter = (k: number) => (k * 7919 + i * 104729) % 1009;
    const order = DIES.map((_, k) => k).sort((a, b) => scatter(a) - scatter(b));
    return new Set(order.slice(0, Math.round((DIES.length * s.level) / 100)));
});

const scoreColor = (level: number) => (level >= 90 ? 'text-success' : level >= 80 ? 'text-pcbgold' : 'text-orange-400');

/**
 * Drives the lot: probes wafers in order, then hands the stage over to `view`.
 * While running, `view` is null; afterwards it is the wafer on the stage or 'all'.
 */
const useWaferSort = (start: boolean, instant: boolean) => {
    const [cur, setCur] = useState(0);
    const [step, setStep] = useState(0);
    const [sorted, setSorted] = useState<Set<number>>(new Set());
    const [swapTo, setSwapTo] = useState<number | null>(null);
    const [view, setView] = useState<number | 'all' | null>(null);
    const sortedRef = useRef(sorted);
    sortedRef.current = sorted;
    // When the wafer on the stage started probing; kept across renders so render time isn't lost
    const waferStart = useRef(0);

    const skip = () => {
        setSwapTo(null);
        setSorted(new Set(SKILLS.map((_, i) => i)));
        setStep(PROBE_ORDER.length);
        setView('all');
    };

    useEffect(() => {
        if (start && instant) skip();
    }, [start, instant]);

    useEffect(() => {
        if (!start || swapTo !== null || view !== null) return;
        if (step >= PROBE_ORDER.length) {
            const next = new Set(sortedRef.current).add(cur);
            setSorted(next);
            const nextWafer = SKILLS.findIndex((_, i) => !next.has(i));
            if (nextWafer === -1) setView('all');
            else setSwapTo(nextWafer);
            return;
        }
        if (step === 0) waferStart.current = performance.now();
        let raf = 0;
        const frame = (now: number) => {
            const due = Math.min(PROBE_ORDER.length, Math.floor((now - waferStart.current) / MS_PER_DIE));
            if (due > step) setStep(due);
            else raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [start, step, cur, swapTo, view]);

    // Separate effect so setting swapTo doesn't cancel its own timer
    useEffect(() => {
        if (swapTo === null) return;
        const t = setTimeout(() => {
            setCur(swapTo);
            setStep(0);
            setSwapTo(null);
        }, SWAP_MS);
        return () => clearTimeout(t);
    }, [swapTo]);

    const finished = view !== null;
    const probing = start && !finished && swapTo === null && step < PROBE_ORDER.length;
    const tested = new Set(PROBE_ORDER.slice(0, step));
    const passed = [...tested].filter(k => PASS[cur].has(k)).length;

    return {
        cur, step, sorted, view, finished,
        swapping: swapTo !== null,
        probe: probing ? DIES[PROBE_ORDER[step]] : null,
        /** Running yield of the wafer being probed */
        live: step ? Math.round((passed / step) * 100) : 0,
        tested,
        stateOf: (i: number) => (finished || sorted.has(i) ? 'sorted' : i === cur && probing ? 'probing' : 'queued') as 'sorted' | 'probing' | 'queued',
        /** Mid-lot: re-probe that wafer, then carry on. After the lot: just show it. */
        load: (i: number) => {
            if (finished) return setView(i);
            setSwapTo(null);
            setSorted(prev => { const s = new Set(prev); s.delete(i); return s; });
            setCur(i);
            setStep(0);
        },
        viewAll: () => setView('all'),
        skip,
        restart: () => {
            setSwapTo(null);
            setView(null);
            setSorted(new Set());
            setCur(0);
            setStep(0);
        },
    };
};

/**
 * One wafer on the prober stage. `skill` is a wafer index, or 'all' for the full lot split into sectors.
 * Between wafers the dies recolour top-down; while probing they update instantly.
 */
const Wafer = ({ skill, tested, probe, focus, onHover, onPick }: {
    skill: number | 'all';
    tested: Set<number> | 'all';
    probe: Die | null;
    focus: number | null;
    onHover?: (sector: number | null) => void;
    onPick?: (sector: number) => void;
}) => {
    const size = GRID * CELL + PAD * 2;
    // The narrowest phones can't fit the wafer, so it zooms down to the 16px page gutters
    const fit = usePhone() ? Math.min(1, (window.innerWidth - 32) / size) : 1;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size, zoom: fit }} onMouseLeave={onHover && (() => onHover(null))}>
            <div className="absolute inset-0 rounded-full border-2 border-gray-700 bg-gray-900/40" />
            {/* orientation notch */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-2.5 bg-obsidian rounded-t-full border-t-2 border-x-2 border-gray-700" />
            {DIES.map((d, k) => {
                const owner = skill === 'all' ? d.sector : skill;
                const hit = tested === 'all' || tested.has(k);
                const pass = PASS[owner].has(k);
                return (
                    <span
                        key={k}
                        className={`absolute rounded-[1px] ${onPick ? 'cursor-pointer' : ''}`}
                        onMouseEnter={onHover && (() => onHover(owner))}
                        onClick={onPick && (() => onPick(owner))}
                        style={{
                            left: PAD + d.x * CELL + 1,
                            top: PAD + d.y * CELL + 1,
                            width: CELL - 2,
                            height: CELL - 2,
                            background: hit && pass ? SKILLS[owner].color : 'transparent',
                            border: !hit ? '1px solid rgba(255,255,255,0.08)' : pass ? '1px solid transparent' : '1px solid rgba(255,60,60,0.7)',
                            opacity: focus !== null && owner !== focus ? 0.15 : 0.88,
                            transition: probe
                                ? 'opacity 150ms'
                                : `background-color 260ms ease ${d.y * 22}ms, border-color 260ms ease ${d.y * 22}ms, opacity 150ms`,
                        }}
                    />
                );
            })}
            {probe && (
                <span
                    className="absolute border-2 border-white rounded-sm shadow-[0_0_12px_white] pointer-events-none"
                    style={{ left: PAD + probe.x * CELL - 2, top: PAD + probe.y * CELL - 2, width: CELL + 4, height: CELL + 4 }}
                />
            )}
        </div>
    );
};

/**
 * A slot in the rack.
 */
const Slot = ({ index, active, fill, label, dim, onClick, onHover }: {
    index: number;
    active: boolean;
    fill: number;
    label: React.ReactNode;
    dim: boolean;
    onClick: () => void;
    onHover?: (hovering: boolean) => void;
}) => {
    const s = SKILLS[index];

    return (
        <div
            onClick={onClick}
            onMouseEnter={onHover && (() => onHover(true))}
            onMouseLeave={onHover && (() => onHover(false))}
            className={`grid grid-cols-[2rem_1fr_3.5rem] items-center gap-3 px-2 py-2 rounded cursor-pointer border transition-colors ${active ? 'border-electric' : 'border-transparent hover:border-gray-700'}`}
        >
            <span className="font-mono text-[10px] text-gray-600">S{String(index + 1).padStart(2, '0')}</span>
            <div className="flex flex-col gap-1.5">
                <span className={`font-mono text-sm ${dim ? 'text-gray-500' : 'text-gray-200'}`}>{s.name}</span>
                <div className="relative h-1.5 bg-gray-900 rounded-full overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: s.color, width: `${fill}%`, transition: 'width 200ms ease-out' }}
                    />
                </div>
            </div>
            <span className="font-mono text-sm font-bold text-right">{label}</span>
        </div>
    );
};

/**
 * Functional coverage as a wafer sort: slot rack on the left, prober stage on the right.
 */
const WaferCoverage = () => {
    const rootRef = useRef<HTMLDivElement>(null);
    const inView = useInView(rootRef, { once: true, amount: 0.4 });
    const reduceMotion = useReducedMotion();
    const lot = useWaferSort(inView, !!reduceMotion);
    const phone = usePhone();
    const [focus, setFocus] = useState<number | null>(null);

    const stage = lot.view ?? lot.cur;
    const allView = stage === 'all';
    const hovered = allView ? focus : null;
    // No separate "full lot" slot: clicking the slot on the stage again returns to the full lot
    const pick = (i: number) => (lot.view === i ? lot.viewAll() : lot.load(i));

    return (
        <div ref={rootRef} className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="border border-gray-800 rounded-lg bg-obsidian/80 p-4">
                <div className="font-mono text-xs text-gray-500 mb-3">
                    FOUP-01 · {SKILLS.length} slots{lot.finished && (phone ? ' · tap the wafer or a slot' : ' · hover the wafer or click a slot')}
                </div>
                <div className="flex flex-col gap-2">
                    {SKILLS.map((s, i) => {
                        const state = lot.stateOf(i);
                        const fill = state === 'sorted' ? s.level : state === 'probing' ? (lot.step / PROBE_ORDER.length) * s.level : 0;
                        const label = state === 'sorted'
                            ? <span className={scoreColor(s.level)}>{s.level}%</span>
                            : state === 'probing'
                                ? <span className={scoreColor(lot.live)}>{lot.live}%</span>
                                : <span className="text-gray-600">--</span>;
                        return (
                            <Slot
                                key={s.name}
                                index={i}
                                active={allView ? hovered === i : stage === i}
                                fill={fill}
                                label={label}
                                dim={state === 'queued'}
                                onClick={() => pick(i)}
                                onHover={allView ? (on => setFocus(on ? i : null)) : undefined}
                            />
                        );
                    })}
                </div>
                {/* status: one line, right-aligned with the percentage column */}
                <div className="mt-4 px-2 flex justify-end items-center gap-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                    <span>{lot.sorted.size}/{SKILLS.length} sorted{lot.swapping ? ' · loading...' : ''}</span>
                    {!lot.finished && <button onClick={lot.skip} className="text-electric hover:underline">[skip]</button>}
                    {typeof lot.view === 'number' && <button onClick={lot.viewAll} className="text-electric hover:underline">[full lot]</button>}
                    <button onClick={lot.restart} className="text-electric hover:underline">[re-run lot]</button>
                </div>
            </div>

            {/* Phones put the prober above the rack, so the scan is what scrolls into view */}
            <div className="flex flex-col items-center gap-3 max-md:order-first">
                <Wafer
                    skill={stage}
                    tested={lot.finished ? 'all' : lot.tested}
                    probe={lot.probe}
                    focus={hovered}
                    onHover={allView ? setFocus : undefined}
                    onPick={allView ? (i => { setFocus(null); lot.load(i); }) : undefined}
                />
                <div className="font-mono text-center min-h-[4.5rem]">
                    <div className="text-xs text-gray-500">{allView ? 'STAGE · full lot' : `STAGE · S${String(stage + 1).padStart(2, '0')}`}</div>
                    <div className="text-lg font-bold text-gray-100">
                        {hovered !== null ? SKILLS[hovered].name : allView ? 'All Skills' : SKILLS[stage].name}
                    </div>
                    {allView && (
                        <div className="text-sm text-gray-500">
                            {hovered !== null ? 'Yield ' : 'Overall Yield '}
                            <span className={`font-bold text-xl ${scoreColor(hovered !== null ? SKILLS[hovered].level : OVERALL_YIELD)}`}>
                                {hovered !== null ? SKILLS[hovered].level : OVERALL_YIELD}%
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WaferCoverage;
