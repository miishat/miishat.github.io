/**
 * @file BreadboardBootSequence.tsx
 * @description Boot sequence for the Light theme. The hero's breadboard bench is drawn as a pencil
 * layout on graph paper, straight onto the live 3D hero underneath: board, rails, the jumper wires,
 * the three chips and the LEDs. It then powers on: the parts fill in with their real colours, the
 * wires thicken to the jumpers' width, and the paper and the drawing dissolve together into the hero.
 * @module Components/Features
 * @author Mishat
 */
import React, { useEffect, useRef, useState } from 'react';
import { BenchScene, Pt, V3, lightBoard } from './lightBoard';

const MONO = "'JetBrains Mono', ui-monospace, monospace";

// --- Timeline, as fractions of the run ---
const TOTAL_MS = 6000;
const BOARD: [number, number] = [0.02, 0.16];
const RAILS: [number, number] = [0.1, 0.22];
const WIRES: [number, number] = [0.2, 0.55];
const CHIPS: [number, number] = [0.4, 0.6];
const LEDS: [number, number] = [0.6, 0.66];
const POWER: [number, number] = [0.66, 0.82];     // fills come up, wires thicken
const NOTES_OUT: [number, number] = [0.62, 0.72];
const GRID_OUT: [number, number] = [0.62, 0.78];
// The paper and the drawing dissolve together, so the 3D wires come up under the drawn ones
const BG_OUT: [number, number] = [0.76, 0.94];
const DRAWING_OUT: [number, number] = [0.8, 1];
/** Longest the boot waits for the hero to load before giving up and revealing the page. */
const HERO_TIMEOUT_MS = 5000;

const STEPS: [number, string][] = [
    [0.03, 'layout: bench.brd'],
    [0.12, 'rails placed'],
    [0.22, 'routing 13 jumpers ...'],
    [0.42, 'placing U1 U2 U3'],
    [0.6, 'LEDs placed'],
    [0.66, 'power on'],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));
const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
const poly = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

/** Elapsed run as 0..1. The clock waits for the hero to load; any key or click finishes it. */
function useBootClock(onComplete: () => void) {
    const [p, setP] = useState(0);
    const done = useRef(false);
    useEffect(() => {
        const finish = () => { if (!done.current) { done.current = true; onComplete(); } };
        const start = performance.now();
        let t0 = start, last = start, raf = 0;
        const tick = (now: number) => {
            if (!lightBoard.project) {
                if (now - start > HERO_TIMEOUT_MS) return finish();
                t0 += now - last; // paused
            }
            last = now;
            const v = clamp01((now - t0) / TOTAL_MS);
            setP(v);
            if (v >= 1) finish(); else raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        window.addEventListener('keydown', finish);
        window.addEventListener('pointerdown', finish);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('keydown', finish);
            window.removeEventListener('pointerdown', finish);
        };
    }, []);
    return p;
}

/** A wire's on-screen tube width, measured across its midpoint. */
const tubeWidth = (w: BenchScene['wires'][number], project: (p: V3) => Pt) => {
    const m = w.pts[w.pts.length >> 1];
    const [ax, ay] = project(m), [bx, by] = project([m[0] + 2 * w.r, m[1], m[2]]);
    return Math.hypot(bx - ax, by - ay);
};

/** Draw progress of the i-th of n parts that draw one after another over k = 0..1. */
const nth = (k: number, i: number, n: number) => clamp01(k * n - i);

/** The bench drawn over the 3D hero. `power` takes it from pencil lines to the parts' real look. */
const Bench = ({ scene, project, frame, p, power }: {
    scene: BenchScene; project: (p: V3) => Pt; frame: DOMRect; p: number; power: number;
}) => {
    const board = span(p, BOARD), rails = span(p, RAILS), wires = span(p, WIRES), chips = span(p, CHIPS), leds = span(p, LEDS);
    return (
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 1 - smoother(span(p, DRAWING_OUT)) }}>
            <defs>
                {/* the hero's canvas fades out over its bottom 18%, so the drawing does too */}
                <linearGradient id="bb-hero-fade" gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={frame.top + frame.height * 0.82} y2={frame.bottom}>
                    <stop offset={0} stopColor="#fff" />
                    <stop offset={1} stopColor="#fff" stopOpacity={0} />
                </linearGradient>
                <mask id="bb-hero-mask" maskUnits="userSpaceOnUse" x={-1e4} y={-1e4} width={2e4} height={2e4}>
                    <rect x={-1e4} y={-1e4} width={2e4} height={2e4} fill="url(#bb-hero-fade)" />
                </mask>
            </defs>
            <g mask="url(#bb-hero-mask)">
                {board > 0 && (
                    <path d={poly(scene.board.map(project)) + ' Z'} fill="#f7f8f3" fillOpacity={power} stroke="#b9c1b5" strokeWidth={1.5}
                        pathLength={1} strokeDasharray={`${board} 1`} />
                )}
                {scene.rails.map((r, i) => (
                    <path key={i} d={poly([project(r.a), project(r.b)])} stroke={r.color} strokeWidth={2} strokeOpacity={0.8}
                        pathLength={1} strokeDasharray={`${rails} 1`} />
                ))}
                {scene.chips.map((c, i) => {
                    const k = nth(chips, i, scene.chips.length);
                    return k > 0 && (
                        <path key={c.sub} d={poly(c.quad.map(project)) + ' Z'} opacity={k}
                            fill="#4b564b" fillOpacity={0.15 + 0.85 * power} stroke="#4b564b" strokeWidth={1.5} />
                    );
                })}
                {scene.wires.map((w, i) => {
                    const k = nth(wires, i, scene.wires.length);
                    return k > 0 && (
                        <path key={i} d={poly(w.pts.map(project))} fill="none" stroke={w.color} strokeLinecap="round"
                            strokeWidth={3 + (tubeWidth(w, project) - 3) * power} pathLength={1} strokeDasharray={`${k} 1`} />
                    );
                })}
                {scene.leds.map((l, i) => {
                    const [x, y] = project(l.pos);
                    return <circle key={i} cx={x} cy={y} r={6} fill={l.color} opacity={leds} />;
                })}
            </g>
        </svg>
    );
};

const BreadboardBootSequence = ({ onComplete }: { onComplete: () => void }) => {
    const p = useBootClock(onComplete);
    useEffect(() => {
        lightBoard.booting = true;
        return () => { lightBoard.booting = false; };
    }, []);

    const { scene, project, frame } = lightBoard;
    const notes = 1 - span(p, NOTES_OUT);
    const status = STEPS.reduce((s, [at, text]) => (p >= at ? text : s), '');

    return (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none" style={{ fontFamily: MONO }}>
            <div className="absolute inset-0" style={{ background: '#eef1ea', opacity: 1 - smoother(span(p, BG_OUT)) }}>
                <div
                    className="absolute inset-0"
                    style={{
                        opacity: 1 - span(p, GRID_OUT),
                        backgroundImage: 'linear-gradient(#dde3d6 1px, transparent 1px), linear-gradient(90deg, #dde3d6 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            {scene && project && frame && <Bench scene={scene} project={project} frame={frame()} p={p} power={smoother(span(p, POWER))} />}

            <div className="absolute inset-x-0 top-[30%] text-center text-[13px] tracking-wide text-gray-400" style={{ opacity: notes }}>
                <span className="text-electric">&gt;</span> {status || ' '}
                <span className="text-electric" style={{ opacity: Math.floor((p * TOTAL_MS) / 450) % 2 ? 0 : 1 }}> _</span>
            </div>
            <div className="absolute inset-x-0 top-[5%] text-center text-[11px] text-gray-500" style={{ opacity: notes }}>
                Press any key or click to skip
            </div>
        </div>
    );
};

export default BreadboardBootSequence;
