/**
 * @file ClockProbeBackdrop.tsx
 * @description Page background for the Default (dark) theme. While the hero name sits
 * centred over the die, a clock tree (an H-tree) fans out from the middle of the screen:
 * every clock edge sends pulses to random flops, which flash as they latch, and a few
 * leaves carry skew labels. When the hero splits into the network-on-chip
 * (NocMorphHero fires `hero-split`), it crossfades to a circuit board under a probe
 * light, with a small scope by the cursor showing the net under it. CRT scanlines sit
 * over both. It is a fixed layer behind every section, so it shows through the hero
 * canvas; index.html makes the cards near-opaque and fades it into the footer.
 *
 * @author Mishat
 */
import React, { useEffect, useRef, useState } from 'react';

const CYAN = '0, 243, 255';
const PURPLE = '176, 38, 255';
const GOLD = '212, 175, 55';
const NETS = ['SERDES_TX', 'AXI_AW', 'DDR_DQ', 'NOC_FLIT', 'CLK_DIV', 'AI_CTRL', 'L3_REQ', 'PCIE_RX'];
/** How long the crossfade takes; a layer stops drawing once it has faded out. */
const FADE_MS = 1600;

type P = [number, number];

const Layer = ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
    <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden" style={style}>{children}</div>
);

/**
 * Viewport-sized canvas at device pixel ratio. `draw` runs every frame while `active`
 * (and for one fade after it goes inactive); under reduced motion it draws one still frame.
 */
const useCanvas = (active: boolean, draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void, setup: (w: number, h: number) => void) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const on = useRef({ active, since: 0 });
    if (on.current.active !== active) on.current = { active, since: performance.now() };
    useEffect(() => {
        const cv = ref.current!, ctx = cv.getContext('2d')!;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let w = 0, h = 0, raf = 0;
        const frame = (t: number) => { ctx.clearRect(0, 0, w, h); draw(ctx, w, h, t / 1000); };
        const size = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            w = window.innerWidth; h = window.innerHeight;
            cv.width = w * dpr; cv.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            setup(w, h);
            if (still) frame(performance.now());
        };
        size();
        const loop = (t: number) => {
            const { active, since } = on.current;
            if (active || t - since < FADE_MS) frame(t);
            raf = requestAnimationFrame(loop);
        };
        if (!still) raf = requestAnimationFrame(loop);
        window.addEventListener('resize', size);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
    }, []);
    return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
};

const useMouse = () => {
    const m = useRef({ x: -9999, y: -9999 });
    useEffect(() => {
        const on = (e: PointerEvent) => { m.current.x = e.clientX; m.current.y = e.clientY; };
        window.addEventListener('pointermove', on);
        return () => window.removeEventListener('pointermove', on);
    }, []);
    return m;
};

// The hero can split before this mounts, so keep the latest value at module level too.
let heroSplit = false;
window.addEventListener('hero-split', e => { heroSplit = (e as CustomEvent<boolean>).detail; });

const useHeroSplit = () => {
    const [split, setSplit] = useState(heroSplit);
    useEffect(() => {
        const on = (e: Event) => setSplit((e as CustomEvent<boolean>).detail);
        window.addEventListener('hero-split', on);
        return () => window.removeEventListener('hero-split', on);
    }, []);
    return split;
};

// ---------------------------------------------------------------------------
// Clock tree
// ---------------------------------------------------------------------------
const ClockTree = ({ active }: { active: boolean }) => {
    const segs = useRef<[P, P][]>([]);
    const leaves = useRef<P[][]>([]);
    const skews = useRef<string[]>([]);
    const pulses = useRef<{ path: P[]; born: number }[]>([]);
    const flashes = useRef<{ p: P; born: number }[]>([]);
    const lastEdge = useRef(0);
    const build = (w: number, h: number) => {
        const s: [P, P][] = [], l: P[][] = [];
        // horizontal bars span +-lx, vertical bars +-ly; both halve every second level
        const grow = (x: number, y: number, lx: number, ly: number, horiz: boolean, depth: number, path: P[]) => {
            const a: P = horiz ? [x - lx, y] : [x, y - ly], b: P = horiz ? [x + lx, y] : [x, y + ly];
            s.push([a, b]);
            for (const end of [a, b]) {
                const p = [...path, [x, y] as P, end];
                if (depth === 0) l.push(p);
                else if (horiz) grow(end[0], end[1], lx, ly, false, depth - 1, p);
                else grow(end[0], end[1], lx / 2, ly / 2, true, depth - 1, p);
            }
        };
        grow(w / 2, h / 2, w * 0.25, h * 0.25, true, 7, []);
        segs.current = s; leaves.current = l;
        skews.current = l.map((_, i) => (i % 9 === 0 ? `${i % 2 ? '+' : '-'}${(i * 7) % 13}ps` : ''));
    };
    const at = (path: P[], f: number): P => {
        const n = path.length - 1, s = Math.min(n - 1, Math.floor(f * n)), k = f * n - s;
        return [path[s][0] + (path[s + 1][0] - path[s][0]) * k, path[s][1] + (path[s + 1][1] - path[s][1]) * k];
    };
    const canvas = useCanvas(active, (ctx, _w, _h, t) => {
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(${CYAN},0.14)`;
        ctx.beginPath();
        for (const [a, b] of segs.current) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
        ctx.stroke();
        // flops at the leaves, a few with skew labels
        ctx.font = '9px ui-monospace, monospace';
        leaves.current.forEach((l, i) => {
            const e = l[l.length - 1];
            ctx.fillStyle = `rgba(${PURPLE},0.35)`;
            ctx.fillRect(e[0] - 1.5, e[1] - 1.5, 3, 3);
            if (skews.current[i]) {
                ctx.fillStyle = `rgba(${GOLD},0.4)`;
                ctx.fillText(skews.current[i], e[0] + 5, e[1] - 4);
            }
        });
        // a clock edge every 1.4s launches a burst
        if (t - lastEdge.current > 1.4) {
            lastEdge.current = t;
            for (let i = 0; i < 12; i++) pulses.current.push({ path: leaves.current[Math.floor(Math.random() * leaves.current.length)], born: t });
        }
        const DUR = 2.6;
        pulses.current = pulses.current.filter(p => {
            if (t - p.born < DUR) return true;
            flashes.current.push({ p: p.path[p.path.length - 1], born: t });
            return false;
        });
        for (const p of pulses.current) {
            const f = (t - p.born) / DUR;
            for (let k = 0; k < 6; k++) {
                const ff = f - k * 0.012;
                if (ff < 0) continue;
                const [x, y] = at(p.path, ff);
                ctx.fillStyle = `rgba(${CYAN},${0.75 * (1 - k / 6) * (1 - f * 0.5)})`;
                ctx.beginPath(); ctx.arc(x, y, 2.2 - k * 0.25, 0, Math.PI * 2); ctx.fill();
            }
        }
        // a flop flashes a small square as its pulse latches
        flashes.current = flashes.current.filter(fl => t - fl.born < 0.7);
        for (const fl of flashes.current) {
            ctx.strokeStyle = `rgba(${CYAN},${(1 - (t - fl.born) / 0.7) * 0.8})`;
            ctx.strokeRect(fl.p[0] - 5, fl.p[1] - 5, 10, 10);
        }
    }, build);
    return (
        <Layer style={{ background: `radial-gradient(40% 40% at 50% 50%, rgba(${CYAN},0.06), transparent 70%)` }}>
            {canvas}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(110% 80% at 50% 50%, transparent 45%, #050510 100%)' }} />
        </Layer>
    );
};

// ---------------------------------------------------------------------------
// Board under a probe light
// ---------------------------------------------------------------------------
type Trace = { pts: P[]; color: string; net: string };

/** Manhattan traces on a 28px grid with a 45 degree chamfer before each turn. */
const buildTraces = (w: number, h: number): Trace[] => {
    const G = 28, out: Trace[] = [];
    const cols = [CYAN, CYAN, PURPLE, GOLD];
    const D = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const n = Math.round((w * h) / 22000);
    for (let i = 0; i < n; i++) {
        let x = Math.round(Math.random() * w / G) * G, y = Math.round(Math.random() * h / G) * G;
        const pts: P[] = [[x, y]];
        let dir = Math.floor(Math.random() * 4);
        for (let s = 0; s < 3 + Math.floor(Math.random() * 4); s++) {
            const len = G * (2 + Math.floor(Math.random() * 6)), d = D[dir];
            x += d[0] * len; y += d[1] * len;
            pts.push([x, y]);
            const nd = (dir + (Math.random() < 0.5 ? 1 : 3)) % 4, e = D[nd];
            x += (d[0] + e[0]) * G * 0.5; y += (d[1] + e[1]) * G * 0.5;
            pts.push([x, y]);
            dir = nd;
        }
        out.push({ pts, color: cols[i % cols.length], net: `${NETS[i % NETS.length]}${i % 16}` });
    }
    return out;
};

/** Distance from (x, y) to the nearest segment of a trace. */
const distTo = (tr: Trace, x: number, y: number) => {
    let best = Infinity;
    for (let i = 0; i < tr.pts.length - 1; i++) {
        const [ax, ay] = tr.pts[i], [bx, by] = tr.pts[i + 1];
        const L = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
        const k = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L));
        best = Math.min(best, Math.hypot(x - (ax + (bx - ax) * k), y - (ay + (by - ay) * k)));
    }
    return best;
};

const ProbedBoard = ({ active }: { active: boolean }) => {
    const traces = useRef<Trace[]>([]);
    const mouse = useMouse();
    const stroke = (ctx: CanvasRenderingContext2D, alpha: number, via: number) => {
        ctx.lineWidth = 1.5;
        for (const tr of traces.current) {
            ctx.strokeStyle = `rgba(${tr.color},${alpha})`;
            ctx.beginPath();
            tr.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.stroke();
            for (const [x, y] of [tr.pts[0], tr.pts[tr.pts.length - 1]]) {
                ctx.strokeStyle = `rgba(${GOLD},${via})`;
                ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.stroke();
            }
        }
        ctx.lineWidth = 1;
    };
    const canvas = useCanvas(active, (ctx, w, h, t) => {
        stroke(ctx, 0.07, 0.1);
        // packets on every third trace
        traces.current.forEach((tr, i) => {
            if (i % 3) return;
            const f = (t * 0.12 + i * 0.37) % 1, n = tr.pts.length - 1;
            const s = Math.floor(f * n), k = f * n - s, a = tr.pts[s], b = tr.pts[s + 1];
            ctx.fillStyle = `rgba(${tr.color},0.55)`;
            ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, 1.8, 0, Math.PI * 2); ctx.fill();
        });
        const { x, y } = mouse.current;
        if (x < 0) return;
        // probe light: nested clips fake a soft edge on the lit traces
        for (const [r, a] of [[200, 0.12], [150, 0.2], [100, 0.3]] as const) {
            ctx.save();
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
            stroke(ctx, a, a * 1.3);
            ctx.restore();
        }
        const g = ctx.createRadialGradient(x, y, 0, x, y, 190);
        g.addColorStop(0, `rgba(${CYAN},0.08)`); g.addColorStop(1, 'rgba(5,5,16,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 190, 0, Math.PI * 2); ctx.fill();

        // a small scope that shows the net under the probe
        let near: Trace | null = null, nd = 40;
        for (const tr of traces.current) { const d = distTo(tr, x, y); if (d < nd) { nd = d; near = tr; } }
        const W = 170, H = 64, bx = Math.min(x + 26, w - W - 8), by = Math.min(y + 26, h - H - 8);
        ctx.fillStyle = 'rgba(5,5,16,0.9)'; ctx.fillRect(bx, by, W, H);
        ctx.strokeStyle = `rgba(${CYAN},0.5)`; ctx.strokeRect(bx, by, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        for (let gx = 1; gx < 6; gx++) { ctx.moveTo(bx + gx * W / 6, by); ctx.lineTo(bx + gx * W / 6, by + H); }
        ctx.moveTo(bx, by + H / 2); ctx.lineTo(bx + W, by + H / 2);
        ctx.stroke();
        ctx.strokeStyle = near ? `rgba(${near.color},0.95)` : 'rgba(156,163,175,0.5)';
        ctx.beginPath();
        const per = near ? 18 + (near.net.length % 4) * 8 : 0;
        for (let i = 0; i <= W - 8; i++) {
            let yy = by + H / 2 + (Math.random() - 0.5) * 2;
            if (near) {
                const ph = ((i + t * 60) % per) / per, edge = Math.min(ph, Math.abs(ph - 0.5)) * per;
                // square wave with a little ringing after each edge
                yy = by + H / 2 + (ph < 0.5 ? -14 : 14) + Math.exp(-edge / 2) * Math.sin(edge * 2) * 5;
            }
            i ? ctx.lineTo(bx + 4 + i, yy) : ctx.moveTo(bx + 4 + i, yy);
        }
        ctx.stroke();
        ctx.font = '10px ui-monospace, monospace';
        ctx.fillStyle = 'rgba(156,163,175,0.8)';
        ctx.fillText(near ? `${near.net}  ${(1000 / per).toFixed(0)} MHz` : 'no signal', bx + 6, by + 12);
    }, (w, h) => { traces.current = buildTraces(w, h); });
    return <Layer>{canvas}</Layer>;
};

const Fade = ({ on, children }: { on: boolean; children: React.ReactNode }) => (
    <div style={{ opacity: on ? 1 : 0, transition: `opacity ${FADE_MS}ms ease` }}>{children}</div>
);

const ClockProbeBackdrop = () => {
    const split = useHeroSplit();
    // dimmed as a whole so it stays behind the content
    return (
        <div style={{ opacity: 0.6 }}>
            <Fade on={!split}><ClockTree active={!split} /></Fade>
            <Fade on={split}><ProbedBoard active={split} /></Fade>
            <Layer style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.28) 0 1px, transparent 1px 3px)' }} />
        </div>
    );
};

export default ClockProbeBackdrop;
