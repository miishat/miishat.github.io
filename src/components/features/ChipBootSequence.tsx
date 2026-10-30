/**
 * @file ChipBootSequence.tsx
 * @description Boot sequence for the Default theme. The hero's chip is drawn flat in 2D, one
 * layer at a time (package and fan-out, die, floorplan and cells, routing), then tilts in 3D onto
 * the live hologram underneath, its layers fanning apart and settling back as it turns, and fades
 * into it. The page is already mounted below, so the hand-off is to the real hero.
 * @module Components/Features
 * @author Mishat
 */
import React, { useEffect, useRef, useState } from 'react';
import { BLOCK_DETAIL, DIE, FAN_OUT, FLOORPLAN, IPKey, MISC_BLOCKS, PACKAGE, Quad, ROUTES, Rect, heroChip } from './heroChip';

const CYAN = '#00f3ff', PURPLE = '#b026ff', GOLD = '#d4af37', INK = '#9ca3af';
const IP_COLOR: Record<IPKey, string> = { ai: CYAN, cpu: PURPLE, serdes: GOLD };
const IP_LABEL: Record<IPKey, string> = { ai: 'AI', cpu: 'CPU', serdes: 'SERDES' };
const ROUTE_COLOR = [CYAN, GOLD, PURPLE];

// --- Timeline, as fractions of the run ---
const TOTAL_MS = 7000;
const DRAW_END = 0.58;                         // the drawing phase
const TILT: [number, number] = [0.6, 0.92];    // the turn onto the hologram
const NOTES_OUT: [number, number] = [0.54, 0.62];
const BG_OUT: [number, number] = [0.92, 0.97];
const DRAWING_OUT: [number, number] = [0.93, 1];
/** Longest the boot waits for the hero to load before giving up and revealing the page. */
const HERO_TIMEOUT_MS = 5000;

/** The hologram's layers: their height above its plane, and when each is drawn within the drawing phase. */
const LAYERS = [
    { name: 'L0 · package + fan-out', y: -0.05, draw: [0, 0.25] },
    { name: 'L1 · die', y: 0.05, draw: [0.25, 0.4] },
    { name: 'L2 · floorplan + cells', y: 0.06, draw: [0.4, 0.75] },
    { name: 'L3 · routing', y: 0.09, draw: [0.75, 1] },
] as const;
const FLAT_SCALE = 0.8;  // the flat drawing's size relative to the hologram
const FAN = 1.2;         // how far apart the layers spread mid-tilt, in die units per layer

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));
const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

// --- Projection ---
// Every point is projected and drawn as plain 2D SVG rather than CSS 3D-transformed: Chrome
// rasterizes 3D-transformed layers in tiles at a scale of its choosing, so mid-tilt some blocks
// came out sharp and others soft. A homography maps straight lines to straight lines, so
// projecting the vertices is exact.
type Map2 = (x: number, z: number) => [number, number];

/** Maps package-local (x, z) onto the screen quad (TL, TR, BR, BL). */
function homography(q: Quad): Map2 {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, h = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
    return (x, z) => {
        const u = x / PACKAGE + 0.5, v = z / PACKAGE + 0.5, w = g * u + h * v + 1;
        return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w];
    };
}
const pathD = (M: Map2, pts: [number, number][], close = false) =>
    pts.map(([x, z], i) => { const [X, Y] = M(x, z); return `${i ? 'L' : 'M'}${X.toFixed(1)},${Y.toFixed(1)}`; }).join(' ') + (close ? ' Z' : '');
const rectD = (M: Map2, x: number, z: number, w: number, h: number) => pathD(M, [[x, z], [x + w, z], [x + w, z + h], [x, z + h]], true);
const fp = (f: number) => (f - 0.5) * DIE;
const fpRectD = (M: Map2, [x, y, w, h]: Rect) => rectD(M, fp(x), fp(y), w * DIE, h * DIE);
const quadValid = (q: Quad) => q.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

/** Draws a path on from start to end as `k` goes 0 to 1. */
const drawOn = (k: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - k });

/** A point `t` (0..1) of the way along a route, in world units. */
function pointOnRoute(route: [number, number][], t: number): [number, number] {
    const pts = route.map(([x, y]) => [fp(x), fp(y)]);
    const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
    let d = t * lens.reduce((a, b) => a + b, 0), i = 0;
    while (i < lens.length - 1 && d > lens[i]) d -= lens[i++];
    const k = d / lens[i];
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
}

// --- Layers ---
const Package = ({ M, k }: { M: Map2; k: number }) => (
    <>
        <path d={rectD(M, -PACKAGE / 2, -PACKAGE / 2, PACKAGE, PACKAGE)} fill="rgba(0,243,255,0.025)" stroke={CYAN} strokeWidth={1.3} {...drawOn(clamp01(k / 0.35))} />
        {FAN_OUT.map((pts, i) => {
            const a = 0.3 + (i % 14) * 0.03;
            return <path key={i} d={pathD(M, pts)} fill="none" stroke={GOLD} strokeOpacity={0.55} strokeWidth={1} {...drawOn(span(k, [a, a + 0.3]))} />;
        })}
    </>
);
const Die = ({ M, k }: { M: Map2; k: number }) => (
    <path d={rectD(M, -1.65, -1.65, 3.3, 3.3)} fill={k >= 1 ? 'rgba(0,243,255,0.05)' : 'none'} stroke={CYAN} strokeWidth={1.3} {...drawOn(k)} />
);
const Floorplan = ({ M, k, labels }: { M: Map2; k: number; labels: boolean }) => {
    // label size follows the drawing's scale where it sits
    const unit = Math.hypot(...(([[ax, ay], [bx, by]]) => [bx - ax, by - ay])([M(0, 0), M(1, 0)]));
    return (
        <>
            {BLOCK_DETAIL.map((b, i) => <path key={i} d={fpRectD(M, b)} fill="none" stroke={CYAN} strokeOpacity={0.3 * span(k, [0.6 + (i % 16) * 0.01, 0.9])} strokeWidth={0.7} />)}
            {MISC_BLOCKS.map((b, i) => <path key={i} d={fpRectD(M, b)} fill="none" stroke={INK} strokeOpacity={0.6 * span(k, [0.5, 0.7])} strokeWidth={0.9} strokeDasharray="4 3" />)}
            {(Object.keys(FLOORPLAN) as IPKey[]).map((key, i) => {
                const [x, y] = FLOORPLAN[key], c = IP_COLOR[key];
                const [lx, ly] = M(fp(x) + 0.06, fp(y) - 0.05);
                return (
                    <g key={key}>
                        <path d={fpRectD(M, FLOORPLAN[key])} fill={k > 0.6 ? `${c}10` : 'none'} stroke={c} strokeWidth={1.8} {...drawOn(span(k, [i * 0.12, 0.35 + i * 0.12]))} />
                        {labels && <text x={lx} y={ly} fontSize={0.12 * unit} fill={c} opacity={span(k, [0.3 + i * 0.12, 0.45 + i * 0.12])}>{IP_LABEL[key]}</text>}
                    </g>
                );
            })}
        </>
    );
};
const Routing = ({ M, k, seconds }: { M: Map2; k: number; seconds: number }) => (
    <>
        {ROUTES.map((r, i) => <path key={i} d={pathD(M, r.map(([x, y]) => [fp(x), fp(y)]))} fill="none" stroke={ROUTE_COLOR[i % 3]} strokeOpacity={0.35} strokeWidth={1.1} {...drawOn(span(k, [i * 0.1, 0.5 + i * 0.1]))} />)}
        {/* the same travelling pulses as the hologram, once the routes are in */}
        {k > 0.6 && ROUTES.map((r, i) => {
            const [X, Y] = M(...pointOnRoute(r, (seconds * (0.18 + i * 0.03) + i * 0.21) % 1));
            return <circle key={i} cx={X} cy={Y} r={4} fill={ROUTE_COLOR[i % 3]} />;
        })}
    </>
);

/** Elapsed run as 0..1. The clock waits for the hero to load; any key or click finishes it. */
function useBootClock(onComplete: () => void) {
    const [p, setP] = useState(0);
    const done = useRef(false);
    useEffect(() => {
        const finish = () => { if (!done.current) { done.current = true; onComplete(); } };
        const start = performance.now();
        let t0 = start, last = start, raf = 0;
        const tick = (now: number) => {
            if (!heroChip.project) {
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

const ChipBootSequence = ({ onComplete }: { onComplete: () => void }) => {
    const p = useBootClock(onComplete);
    useEffect(() => {
        heroChip.booting = true;
        return () => { heroChip.booting = false; };
    }, []);

    const draw = span(p, [0, DRAW_END]);
    const tilt = smoother(span(p, TILT));
    const notes = 1 - span(p, NOTES_OUT);
    const project = heroChip.project;
    const quads = project && LAYERS.map((l, i) => project(tilt, l.y + Math.sin(Math.PI * tilt) * FAN * i, FLAT_SCALE));
    const ready = quads && quads.every(quadValid);
    const flatY = ready ? project!(0, LAYERS[0].y, FLAT_SCALE).reduce((a, q) => a + q[1], 0) / 4 : window.innerHeight / 2;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden font-mono pointer-events-none">
            <div className="absolute inset-0 bg-obsidian" style={{ opacity: 1 - span(p, BG_OUT) }} />
            <div
                className="absolute inset-0"
                style={{
                    opacity: notes,
                    backgroundImage: 'linear-gradient(rgba(0,243,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
                }}
            />

            {ready && (() => {
                const [pkg, die, plan, routes] = quads!.map(homography);
                return (
                    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 1 - span(p, DRAWING_OUT), animation: 'boot-in .25s ease-out', filter: `drop-shadow(0 0 3px ${CYAN}88)` }}>
                        <Package M={pkg} k={span(draw, LAYERS[0].draw)} />
                        <Die M={die} k={span(draw, LAYERS[1].draw)} />
                        <Floorplan M={plan} k={span(draw, LAYERS[2].draw)} labels={notes > 0.5} />
                        <Routing M={routes} k={span(draw, LAYERS[3].draw)} seconds={p * TOTAL_MS / 1000} />
                    </svg>
                );
            })()}

            {/* layer legend, centred on the flat chip, which sits above screen centre like the hero */}
            <div className="absolute right-28 -translate-y-1/2 text-xs leading-8" style={{ top: flatY, opacity: notes }}>
                <div className="text-gray-500 tracking-[0.3em] uppercase mb-2">stack-up</div>
                {LAYERS.map(l => {
                    const k = span(draw, l.draw);
                    return (
                        <div key={l.name} className="flex items-center gap-3">
                            <span className="w-8 h-1" style={{ background: k >= 1 ? CYAN : k > 0 ? PURPLE : '#1f2937' }} />
                            <span className={k > 0 ? 'text-white' : 'text-gray-600'}>{l.name}</span>
                        </div>
                    );
                })}
            </div>

            <div className="absolute bottom-6 right-8 text-[11px] tracking-widest text-gray-600 uppercase" style={{ opacity: notes }}>
                Press any key or click to skip
            </div>
            <style>{'@keyframes boot-in { from { opacity: 0; } }'}</style>
        </div>
    );
};

export default ChipBootSequence;
