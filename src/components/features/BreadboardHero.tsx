/**
 * @file BreadboardHero.tsx
 * @description Hero for the Light theme: a long breadboard across the bottom of the hero,
 * tall jumper arcs up both sides framing the name, and the three IP blocks as DIP chips.
 * Hovering a chip (or a labelled wire) fills the hero tooltip.
 *
 * @author Mishat
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import CyberText from '../ui/CyberText';
import { lightBoard } from './lightBoard';

type Props = { setTooltip: (t: string | null) => void; tooltip: string | null };
type V3 = [number, number, number];

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------
type IP = { label: string; desc: string; sig: string };
const IPS: IP[] = [
    { label: 'AI Network Control', desc: 'Traffic management & control logic for AI clusters.', sig: 'AI_NET_CTRL' },
    { label: 'CPU & Memory', desc: 'Coherent mesh, L3 Cache & DDR controller verification.', sig: 'CPU_MEM' },
    { label: 'SerDes & Ethernet', desc: 'COMPHY bringups & High-Speed I/O verification.', sig: 'SERDES_ETH' },
];
const [AI, CPU, SERDES] = IPS;
const tipOf = (ip: IP) => `${ip.label}: ${ip.desc}`;

/** Breadboard palette, matched to the sage Light theme tokens in index.html. */
const C = {
    board: '#f7f8f3', side: '#e3e8dc', red: '#d6786e', blue: '#6e8cc8',
    chip: '#4b564b', chipHover: '#5d7a66', silk: '#e3e9dc', pin: '#b9c1b5', gold: '#c9aa6a',
    wires: { coral: '#e0907e', blue: '#7d9bd0', sage: '#7fae8a', mustard: '#d9b860', lilac: '#b9a3c9' },
};

const P = 0.2; // breadboard pitch in world units (0.1 in)
/** Row offsets in pitches: two rails, a-e, the centre channel, f-j, two rails. */
const RAILS = [-8, -7, 7, 8];
const TERM = [-5.5, -4.5, -3.5, -2.5, -1.5, 1.5, 2.5, 3.5, 4.5, 5.5];
const BOARD_D = 18.6 * P;
const boardW = (cols: number) => (cols + 2) * P;
/** World position of a hole, relative to the board's centre. */
const hole = (cols: number, col: number, row: number, y = 0): V3 => [(col - (cols - 1) / 2) * P, y, row * P];
const colX = (cols: number, col: number) => (col - (cols - 1) / 2) * P;

const useCursor = () => ({
    over: () => { document.body.style.cursor = 'pointer'; },
    out: () => { document.body.style.cursor = ''; },
});

// ---------------------------------------------------------------------------
// Textures
// ---------------------------------------------------------------------------
const canvasTex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
};

/** Breadboard top: square contacts, the centre channel, +/- rails and row letters. */
const makeBreadboard = (cols: number) => {
    const PX = 40, c = document.createElement('canvas');
    c.width = (cols + 2) * PX; c.height = Math.round(18.6 * PX);
    const g = c.getContext('2d')!;
    const cx = (col: number) => (col + 1.5) * PX, cy = (row: number) => (row + 9.3) * PX;
    g.fillStyle = C.board; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#e8ece3'; g.fillRect(0, cy(-0.55), c.width, 1.1 * PX);
    g.fillStyle = '#d5dccf'; g.fillRect(0, cy(-0.08), c.width, 0.16 * PX);
    const dot = (x: number, y: number) => {
        g.fillStyle = '#e1e6db'; g.fillRect(x - 10, y - 10, 20, 20);
        g.fillStyle = '#9ea99b'; g.fillRect(x - 5.5, y - 5.5, 11, 11);
    };
    for (let col = 0; col < cols; col++) {
        TERM.forEach(r => dot(cx(col), cy(r)));
        if (col % 6 !== 5) RAILS.forEach(r => dot(cx(col), cy(r)));
    }
    const line = (row: number, col: string) => { g.fillStyle = col; g.fillRect(PX, cy(row) - 2, c.width - 2 * PX, 4); };
    line(-8.8, C.red); line(-6.25, C.blue); line(6.25, C.red); line(8.8, C.blue);
    g.font = 'bold 18px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = C.red; g.fillText('+', PX * 0.55, cy(-8)); g.fillText('+', PX * 0.55, cy(7));
    g.fillStyle = C.blue; g.fillText('−', PX * 0.55, cy(-7)); g.fillText('−', PX * 0.55, cy(8));
    g.fillStyle = '#9aa597'; g.font = 'bold 15px monospace';
    'abcdefghij'.split('').forEach((l, i) => g.fillText(l, PX * 0.55, cy(TERM[i])));
    for (let col = 0; col < cols; col += 5) g.fillText(String(col + 1), cx(col), cy(-6.25) + 16);
    return canvasTex(c);
};

/** Chip lid marking with notch and pin-1 dot, drawn at 256 px per world unit. */
const makeMark = (lines: string[], w: number, h: number, bg: string, ink: string) => {
    const S = 256, c = document.createElement('canvas');
    c.width = Math.round(w * S); c.height = Math.round(h * S);
    const g = c.getContext('2d')!;
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.beginPath(); g.arc(0, c.height / 2, c.height * 0.17, -Math.PI / 2, Math.PI / 2); g.fill();
    g.beginPath(); g.arc(c.height * 0.16, c.height * 0.78, c.height * 0.06, 0, Math.PI * 2); g.fill();
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length;
    lines.forEach((l, i) => {
        // shrink to fit the width as well as the height
        const size = Math.min(i === 0 ? c.height * (n > 1 ? 0.26 : 0.34) : c.height * 0.16, (c.width * 0.86) / (l.length * 0.62));
        g.font = `${i === 0 ? 'bold ' : ''}${Math.round(size)}px "JetBrains Mono", monospace`;
        g.fillText(l, c.width / 2, c.height * (n > 1 ? (i === 0 ? 0.42 : 0.72) : 0.5));
    });
    return canvasTex(c);
};

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------
const Breadboard = ({ cols }: { cols: number }) => {
    const tex = useMemo(() => makeBreadboard(cols), [cols]);
    const w = boardW(cols);
    return (
        <group>
            <RoundedBox args={[w, 0.24, BOARD_D]} radius={0.05} smoothness={3} position={[0, -0.12, 0]}>
                <meshStandardMaterial color={C.side} roughness={0.9} />
            </RoundedBox>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
                <planeGeometry args={[w - 0.03, BOARD_D - 0.03]} />
                <meshStandardMaterial map={tex} roughness={0.9} />
            </mesh>
        </group>
    );
};

/**
 * A DIP straddling the channel, pins in rows e and f. Hover lifts it out of the board;
 * `bob` makes it unplug and replug on its own every few seconds.
 */
const Dip = ({ x, n, ip, sub, setTooltip, bob = false, phase = 0 }: {
    x: number; n: number; ip: IP; sub: string; setTooltip: Props['setTooltip']; bob?: boolean; phase?: number;
}) => {
    const g = useRef<THREE.Group>(null);
    const [hover, setHover] = useState(false);
    const cur = useCursor();
    const L = n * P - 0.03, W = 0.44, H = 0.13, base = 0.06;
    const tex = useMemo(() => makeMark([ip.sig, sub], L, W, hover ? C.chipHover : C.chip, C.silk), [ip, sub, L, hover]);
    useFrame(({ clock }) => {
        if (!g.current) return;
        let target = hover ? 0.32 : 0;
        if (bob && !hover && !lightBoard.booting) {
            const t = (clock.elapsedTime * 0.2 + phase) % 1;
            target = t < 0.14 ? Math.sin((t / 0.14) * Math.PI) * 0.5 : 0;
        }
        g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, target, 0.12);
    });
    return (
        <group position={[x, 0, 0]}>
            {/* fixed hit box covering the lift, so a rising chip doesn't slip out from under the cursor */}
            <mesh position={[0, base + 0.3, 0]}
                onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); cur.over(); setTooltip(tipOf(ip)); }}
                onPointerOut={() => { setHover(false); cur.out(); }}>
                <boxGeometry args={[L, 0.6, W + 0.2]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <group ref={g}>
                <mesh position={[0, base + H / 2, 0]}>
                    <boxGeometry args={[L, H, W]} />
                    <meshStandardMaterial color={hover ? C.chipHover : C.chip} roughness={0.75} />
                </mesh>
                <mesh position={[0, base + H + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[L, W]} />
                    <meshStandardMaterial map={tex} roughness={0.8} />
                </mesh>
                {Array.from({ length: n }).flatMap((_, i) => [-1, 1].map(s => (
                    <group key={`${i}${s}`} position={[(i - (n - 1) / 2) * P, 0, 0]}>
                        <mesh position={[0, base + 0.04, s * 0.255]}>
                            <boxGeometry args={[0.06, 0.02, 0.09]} />
                            <meshStandardMaterial color={C.pin} metalness={0.3} roughness={0.4} />
                        </mesh>
                        <mesh position={[0, 0.025, s * 0.29]}>
                            <boxGeometry args={[0.045, 0.15, 0.015]} />
                            <meshStandardMaterial color={C.pin} metalness={0.3} roughness={0.4} />
                        </mesh>
                    </group>
                )))}
            </group>
        </group>
    );
};

/** Jumper wire: leaves one hole straight up, arcs, drops into the other. */
const jumperCurve = (a: V3, b: V3, h: number) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const mid = A.clone().lerp(B, 0.5); mid.y += h;
    const rise = Math.min(0.15, h * 0.4);
    return new THREE.CatmullRomCurve3([
        A.clone().setY(-0.04), A.clone().setY(rise), mid, B.clone().setY(rise), B.clone().setY(-0.04),
    ], false, 'centripetal');
};

const Bead = ({ curve, speed, offset }: { curve: THREE.Curve<THREE.Vector3>; speed: number; offset: number }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => { ref.current?.position.copy(curve.getPointAt((clock.elapsedTime * speed + offset) % 1)); });
    return (
        <mesh ref={ref}>
            <sphereGeometry args={[0.05, 14, 14]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
    );
};

const Jumper = ({ a, b, h, color, pulse, ip, setTooltip, r = 0.028 }: {
    a: V3; b: V3; h: number; color: string; pulse?: number; ip?: IP; setTooltip?: Props['setTooltip']; r?: number;
}) => {
    const curve = useMemo(() => jumperCurve(a, b, h), [...a, ...b, h]);
    const [hover, setHover] = useState(false);
    const cur = useCursor();
    const col = useMemo(() => hover ? new THREE.Color(color).multiplyScalar(0.8) : new THREE.Color(color), [color, hover]);
    return (
        <group>
            <mesh
                onPointerOver={ip ? (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); cur.over(); setTooltip?.(tipOf(ip)); } : undefined}
                onPointerOut={ip ? () => { setHover(false); cur.out(); } : undefined}>
                <tubeGeometry args={[curve, 80, hover ? r * 1.4 : r, 10, false]} />
                <meshStandardMaterial color={col} roughness={0.45} />
            </mesh>
            {[a, b].map((p, i) => (
                <mesh key={i} position={[p[0], 0.04, p[2]]}>
                    <cylinderGeometry args={[r * 1.35, r * 1.35, 0.08, 12]} />
                    <meshStandardMaterial color={col} roughness={0.6} />
                </mesh>
            ))}
            {pulse !== undefined && <Bead curve={curve} speed={0.22 + (pulse % 3) * 0.05} offset={pulse * 0.37} />}
        </group>
    );
};

/** 5 mm LED with its legs in two neighbouring holes, blinking on its own rhythm. */
const Led = ({ pos, color, phase = 0 }: { pos: V3; color: string; phase?: number }) => {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => { if (mat.current) mat.current.emissiveIntensity = Math.sin(clock.elapsedTime * 2.2 + phase) > 0 ? 0.9 : 0.1; });
    return (
        <group position={[pos[0] + P / 2, 0, pos[2]]}>
            {[-1, 1].map(s => (
                <mesh key={s} position={[s * P / 2, 0.08, 0]}><boxGeometry args={[0.02, 0.18, 0.02]} /><meshStandardMaterial color={C.pin} metalness={0.4} roughness={0.4} /></mesh>
            ))}
            <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.115, 0.115, 0.03, 20]} /><meshStandardMaterial color={color} transparent opacity={0.85} /></mesh>
            <mesh position={[0, 0.24, 0]}><cylinderGeometry args={[0.1, 0.1, 0.12, 20]} /><meshStandardMaterial ref={mat} color={color} emissive={color} transparent opacity={0.85} /></mesh>
            <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.85} /></mesh>
        </group>
    );
};

/** Axial resistor spanning `span` holes along x, legs bent down into the board. */
const Resistor = ({ pos, span = 4, bands = ['#a0522d', '#222', '#d6786e', C.gold] }: { pos: V3; span?: number; bands?: string[] }) => {
    const half = (span * P) / 2;
    return (
        <group position={[pos[0] + half, 0, pos[2]]}>
            <mesh position={[0, 0.17, 0]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.065, 0.24, 6, 14]} /><meshStandardMaterial color="#ead9b0" roughness={0.6} /></mesh>
            {bands.map((b, i) => (
                <mesh key={i} position={[-0.1 + i * 0.065, 0.17, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.069, 0.069, 0.025, 14]} /><meshStandardMaterial color={b} roughness={0.6} /></mesh>
            ))}
            {[-1, 1].map(s => (
                <group key={s}>
                    <mesh position={[s * (half + 0.17) / 2, 0.17, 0]}><boxGeometry args={[half - 0.17, 0.018, 0.018]} /><meshStandardMaterial color={C.pin} metalness={0.4} roughness={0.4} /></mesh>
                    <mesh position={[s * half, 0.08, 0]}><boxGeometry args={[0.018, 0.18, 0.018]} /><meshStandardMaterial color={C.pin} metalness={0.4} roughness={0.4} /></mesh>
                </group>
            ))}
        </group>
    );
};

/** Gentle lean toward the pointer, the 3D version of the cards' hover. */
const Lean = ({ children, amt = 0.12 }: { children: React.ReactNode; amt?: number }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame(({ pointer }) => {
        if (!ref.current) return;
        // level while booting, so the boot's drawing lands on a still bench
        const k = lightBoard.booting ? 0 : amt;
        ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -pointer.y * k, 0.05);
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, pointer.x * k, 0.05);
    });
    return <group ref={ref}>{children}</group>;
};

const SoftLights = () => (
    <>
        <hemisphereLight args={['#ffffff', '#cfd8c8', 1.6]} />
        <directionalLight position={[3, 8, 5]} intensity={1.6} color="#fffaf0" />
        <directionalLight position={[-5, 3, -2]} intensity={0.4} color="#e8f2e2" />
    </>
);

/** The bench's layout, shared by the scene and the boot bridge. */
const K = 64;
const bh = (c: number, r: number) => hole(K, c, r);
const W = C.wires;
const CHIPS = [
    { col: 15 + 3.5, n: 8, ip: AI, sub: 'U1' },
    { col: 28 + 4, n: 9, ip: CPU, sub: 'U2', bob: true, phase: 0.3 },
    { col: 42 + 3.5, n: 8, ip: SERDES, sub: 'U3' },
];
const WIRES: { a: V3; b: V3; h: number; color: string; pulse?: number; ip?: IP; r?: number }[] = [
    // tall arcs up both sides, a gate the name stands in
    { a: bh(1, -5.5), b: bh(16, -4.5), h: 3.4, color: W.coral, pulse: 0, ip: AI, r: 0.036 },
    { a: bh(4, 4.5), b: bh(13, 3.5), h: 2.5, color: W.mustard, pulse: 1, r: 0.036 },
    { a: bh(7, -3.5), b: bh(10, -2.5), h: 1.4, color: W.sage, r: 0.036 },
    { a: bh(47, -4.5), b: bh(62, -5.5), h: 3.4, color: W.blue, pulse: 2, ip: SERDES, r: 0.036 },
    { a: bh(50, 3.5), b: bh(59, 4.5), h: 2.5, color: W.lilac, pulse: 3, r: 0.036 },
    { a: bh(53, -2.5), b: bh(56, -3.5), h: 1.4, color: W.coral, r: 0.036 },
    // low wires under the name
    { a: bh(20, -3.5), b: bh(30, -3.5), h: 0.45, color: W.lilac, pulse: 4, ip: CPU, r: 0.034 },
    { a: bh(34, 3.5), b: bh(44, 3.5), h: 0.45, color: W.sage, pulse: 5, r: 0.034 },
    { a: bh(18, 4.5), b: bh(46, 5.5), h: 0.7, color: W.blue, r: 0.034 },
    ...[3, 22, 40, 60].map((c, i) => ({ a: bh(c, i % 2 ? 8 : -8), b: bh(c, i % 2 ? 5.5 : -5.5), h: 0.18, color: i % 2 ? W.blue : W.coral })),
];
const LEDS = [{ pos: bh(25, -2.5), color: '#e7a08f' }, { pos: bh(38, -2.5), color: '#9cc7a5', phase: 1.2 }];

// The boot draws the bench from these, so they match the scene part for part
lightBoard.scene = (() => {
    const w = boardW(K) / 2, d = BOARD_D / 2, top = 0.06 + 0.13;
    const rail = (row: number, color: string) => ({ color, a: [-w + P, 0, row * P] as V3, b: [w - P, 0, row * P] as V3 });
    return {
        board: [[-w, 0, -d], [w, 0, -d], [w, 0, d], [-w, 0, d]],
        rails: [rail(-8.8, C.red), rail(-6.25, C.blue), rail(6.25, C.red), rail(8.8, C.blue)],
        chips: CHIPS.map(c => {
            const x = colX(K, c.col), L = (c.n * P - 0.03) / 2, H = 0.22;
            return { sig: c.ip.sig, sub: c.sub, quad: [[x - L, top, -H], [x + L, top, -H], [x + L, top, H], [x - L, top, H]] as V3[] };
        }),
        wires: WIRES.map(j => ({ color: j.color, r: j.r ?? 0.028, pts: jumperCurve(j.a, j.b, j.h).getSpacedPoints(40).map(v => [v.x, v.y, v.z] as V3) })),
        leds: LEDS.map(l => ({ color: l.color, pos: [l.pos[0] + P / 2, 0.3, l.pos[2]] as V3 })),
    };
})();

/** Publishes the bench-to-page projection for the boot, measured where the bench actually sits. */
const BootBridge = () => {
    const ref = useRef<THREE.Group>(null);
    const { camera, gl } = useThree();
    useEffect(() => () => { lightBoard.project = null; lightBoard.frame = null; }, []);
    useFrame(() => {
        const g = ref.current;
        if (!g || lightBoard.project) return;
        const v = new THREE.Vector3();
        lightBoard.frame = () => gl.domElement.getBoundingClientRect();
        lightBoard.project = p => {
            const r = gl.domElement.getBoundingClientRect();
            v.set(...p).applyMatrix4(g.matrixWorld).project(camera);
            return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
        };
    });
    return <group ref={ref} />;
};

/** The bench: three IP chips, tall side arcs framing the name, low wires under it. */
const Bench = ({ setTooltip }: { setTooltip: Props['setTooltip'] }) => (
    <group>
        <BootBridge />
        <Breadboard cols={K} />
        {CHIPS.map(c => <Dip key={c.sub} x={colX(K, c.col)} n={c.n} ip={c.ip} sub={c.sub} setTooltip={setTooltip} bob={c.bob} phase={c.phase} />)}
        {WIRES.map((j, i) => <Jumper key={i} {...j} setTooltip={j.ip && setTooltip} />)}
        {LEDS.map((l, i) => <Led key={i} {...l} />)}
        <Resistor pos={bh(23, 4.5)} span={4} />
        <Resistor pos={bh(37, 5.5)} span={4} bands={['#6e8cc8', '#222', '#a0522d', C.gold]} />
    </group>
);

// ---------------------------------------------------------------------------
// Hero copy
// ---------------------------------------------------------------------------
/** A +/- power rail pair, the breadboard's signature, flanking the eyebrow line. */
const Rails = () => (
    <span className="inline-flex flex-col gap-[3px] w-10">
        <span className="h-[1.5px] rounded" style={{ background: 'rgba(214,120,110,0.7)' }} />
        <span className="h-[1.5px] rounded" style={{ background: 'rgba(110,140,200,0.7)' }} />
    </span>
);

const Pill = ({ tooltip, hint }: { tooltip: string | null; hint: string }) => (
    <div className="h-12 flex items-center">
        {tooltip ? (
            <motion.div key={tooltip} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="px-5 py-2 rounded-full font-mono text-sm text-gray-200"
                style={{ background: '#f9faf6', border: '1px solid rgba(111,154,122,0.55)', boxShadow: '0 8px 20px -14px rgba(62,72,62,0.6)' }}>
                <span className="text-electric font-bold mr-2">&#9679;</span>{tooltip}
            </motion.div>
        ) : <span className="text-gray-500 text-xs font-mono animate-pulse">{hint}</span>}
    </div>
);

const Tip = () => (
    <div className="text-[10px] text-gray-500 font-mono">
        Tip: Use <span className="text-electric font-bold">j</span> / <span className="text-electric font-bold">k</span> to navigate, <span className="text-electric font-bold">gg</span> / <span className="text-electric font-bold">G</span> to jump, <span className="text-electric font-bold">:</span> for commands
    </div>
);

const HERO_MASK = { maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)' };

/** Renders the Light theme hero: the breadboard scene behind, the copy lifted above the chips. */
export default function BreadboardHero({ setTooltip, tooltip }: Props) {
    return (
        <>
            <div className="absolute inset-0 z-0" style={HERO_MASK}>
                <Canvas camera={{ position: [0, 2.6, 7.6], fov: 45 }} dpr={[1, 2]}>
                    <SoftLights />
                    <group position={[0, -1.6, 0.9]} scale={0.84}>
                        <Lean amt={0.06}><Bench setTooltip={setTooltip} /></Lean>
                    </group>
                </Canvas>
            </div>
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-center items-center -translate-y-24">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
                    className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 mb-1 font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-gray-500">
                        <Rails /> ROW 0 &middot; SoC verification <Rails />
                    </div>
                    <CyberText text="MISHAT" />
                    <p className="-mt-2 text-lg md:text-xl font-bold text-gray-300 whitespace-nowrap">
                        Senior Design Verification Engineer <span style={{ color: '#a88a45' }}>@ Marvell Technology</span>
                    </p>
                    <div className="mt-3"><Pill tooltip={tooltip} hint="Hover a chip or a wire..." /></div>
                    <div className="mt-2"><Tip /></div>
                </motion.div>
            </div>
        </>
    );
}
