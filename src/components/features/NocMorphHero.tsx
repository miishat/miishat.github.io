/**
 * @file NocMorphHero.tsx
 * @description Hero for the Default (dark) theme. It opens on a holographic die centred
 * under the name. Clicking the die turns it into a network-on-chip: the die glides to the
 * right and shrinks, the hologram flattens away, routers drop into a 7x7 mesh from the
 * centre outward, and the copy slides from the centre to a left column. Clicking again
 * reverses it. The IP blocks (hologram) and clusters (mesh) fill the hero tooltip on hover.
 *
 * @author Mishat
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Edges, Float, Html, Line, OrbitControls } from '@react-three/drei';
import { motion, useReducedMotion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import * as THREE from 'three';
import CyberText from '../ui/CyberText';
import { usePhone } from '../../usePhone';
import { BLOCK_DETAIL, DIE, FAN_OUT, FLOORPLAN, IPKey, MISC_BLOCKS, PACKAGE, ProjectChip, ROUTES, Rect, heroChip } from './heroChip';

type Props = { setTooltip: (t: string | null) => void; tooltip: string | null };
type V3 = [number, number, number];

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------
type IP = { key: IPKey; label: string; desc: string };
const IPS: IP[] = [
    { key: 'ai', label: 'AI Network Control', desc: 'Traffic management & control logic for AI clusters.' },
    { key: 'cpu', label: 'CPU & Memory', desc: 'Coherent mesh, L3 Cache & DDR controller verification.' },
    { key: 'serdes', label: 'SerDes & Ethernet', desc: 'COMPHY bringups & High-Speed I/O verification.' },
];
const tipOf = (ip: IP) => `${ip.label}: ${ip.desc}`;

/** Default theme tokens from index.html. */
const C = { cyan: '#00f3ff', purple: '#b026ff', gold: '#d4af37', ink: '#9ca3af', die: '#07080f', router: '#0b0d16' };
const IP_COLOR: Record<IPKey, string> = { ai: C.cyan, cpu: C.purple, serdes: C.gold };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ---------------------------------------------------------------------------
// Hologram (opening state)
// ---------------------------------------------------------------------------
const fpWorld = (fx: number, fy: number, y = 0): V3 => [(fx - 0.5) * DIE, y, (fy - 0.5) * DIE];
const rectPts = ([x, y, w, h]: Rect, yy = 0.06): V3[] =>
    [fpWorld(x, y, yy), fpWorld(x + w, y, yy), fpWorld(x + w, y + h, yy), fpWorld(x, y + h, yy), fpWorld(x, y, yy)];

const IP_OUTLINES: V3[][] = IPS.map(ip => rectPts(FLOORPLAN[ip.key]));
const MISC_OUTLINES: V3[][] = MISC_BLOCKS.map(b => rectPts(b));

/** Gold fan-out traces, just under the die. */
const FAN_OUT_3D: V3[][] = FAN_OUT.map(pts => pts.map(([x, z]): V3 => [x, -0.05, z]));
const BLOCK_DETAIL_3D: V3[][] = BLOCK_DETAIL.map(b => rectPts(b));

const Tag = ({ text, color, position }: { text: string; color: string; position: V3 }) => (
    <Html position={position} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="font-mono text-xs whitespace-nowrap px-2 py-1 rounded border bg-black/80" style={{ color, borderColor: color }}>{text}</div>
    </Html>
);

/** A dot travelling a route on the die surface. */
const Pulse = ({ route, speed, offset, color }: { route: [number, number][]; speed: number; offset: number; color: string }) => {
    const ref = useRef<THREE.Mesh>(null);
    const pts = useMemo(() => route.map(([x, y]) => new THREE.Vector3(...fpWorld(x, y, 0.09))), [route]);
    const lens = useMemo(() => pts.slice(1).map((p, i) => p.distanceTo(pts[i])), [pts]);
    const total = lens.reduce((a, b) => a + b, 0);
    useFrame(({ clock }) => {
        let d = ((clock.elapsedTime * speed + offset) % 1) * total, i = 0;
        while (i < lens.length - 1 && d > lens[i]) d -= lens[i++];
        ref.current?.position.lerpVectors(pts[i], pts[i + 1], d / lens[i]);
    });
    return (
        <mesh ref={ref}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
    );
};

/**
 * Phones have no hover, so a tap picks a block instead. A tap that lands on one sets `hit`, which tells the
 * hero's own click handler (it runs after the scene's) to leave the morph alone.
 */
const tap = { hit: false };

/** Whether an object and all its parents are visible, i.e. it belongs to the model on screen. */
const shown = (o: THREE.Object3D | null): boolean => !o || (o.visible && shown(o.parent));

/** A phone tap on a block of the model on screen: claims the tap and runs `pick`. */
const onTap = (pick: () => void) => (e: ThreeEvent<MouseEvent>) => {
    if (!shown(e.object)) return; // the faded-out model's hit boxes stay in the scene; let the tap pass through
    e.stopPropagation();
    tap.hit = true;
    pick();
};

/** Invisible hit box over an IP block; hovering (on a phone, tapping) outlines it and fills the tooltip. */
const BlockHover = ({ ip, setTooltip, picked, onPick }: { ip: IP; setTooltip: Props['setTooltip']; picked?: boolean; onPick?: () => void }) => {
    const [hovered, setHover] = useState(false);
    const hover = onPick ? !!picked : hovered;
    const [x, y, w, d] = FLOORPLAN[ip.key];
    const [px, , pz] = fpWorld(x + w / 2, y + d / 2);
    const color = IP_COLOR[ip.key];
    return (
        <group position={[px, 0.12, pz]}>
            <mesh
                onPointerOver={onPick ? undefined : (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); setTooltip(tipOf(ip)); }}
                onPointerOut={onPick ? undefined : () => setHover(false)}
                onClick={onPick && onTap(() => { onPick(); setTooltip(tipOf(ip)); })}
            >
                <boxGeometry args={[w * DIE, 0.12, d * DIE]} />
                <meshBasicMaterial color={color} transparent opacity={hover ? 0.18 : 0} depthWrite={false} />
                {hover && <Edges color={color} />}
            </mesh>
            {hover && <Tag text={ip.label} color={color} position={[0, 0.6, 0]} />}
        </group>
    );
};

/** The die as a wireframe: package and die outlines, floorplan line work, pulses and a scan bar. */
const Hologram = ({ setTooltip, phone, epoch }: { setTooltip: Props['setTooltip']; phone: boolean; epoch: number }) => {
    const scan = useRef<THREE.Group>(null);
    const [picked, setPicked] = useState<IPKey | null>(null);
    useEffect(() => setPicked(null), [epoch]);
    useFrame(({ clock }) => {
        if (scan.current) scan.current.position.z = (((clock.elapsedTime * 0.3) % 1) - 0.5) * DIE;
    });
    return (
        <group>
            <mesh position={[0, -0.16, 0]}>
                <boxGeometry args={[5, 0.22, 5]} />
                <meshBasicMaterial color={C.cyan} transparent opacity={0.025} depthWrite={false} />
                <Edges color={C.cyan} />
            </mesh>
            <mesh>
                <boxGeometry args={[DIE + 0.1, 0.1, DIE + 0.1]} />
                <meshBasicMaterial color={C.cyan} transparent opacity={0.06} depthWrite={false} />
                <Edges color={C.cyan} />
            </mesh>
            {FAN_OUT_3D.map((pts, i) => <Line key={i} points={pts} color={C.gold} lineWidth={1} transparent opacity={0.45} />)}
            {IPS.map((ip, i) => <Line key={ip.key} points={IP_OUTLINES[i]} color={IP_COLOR[ip.key]} lineWidth={1.6} />)}
            {MISC_OUTLINES.map((pts, i) => <Line key={i} points={pts} color={C.ink} lineWidth={1} dashed dashSize={0.05} gapSize={0.04} transparent opacity={0.6} />)}
            {BLOCK_DETAIL_3D.map((pts, i) => <Line key={i} points={pts} color={C.cyan} lineWidth={0.8} transparent opacity={0.3} />)}
            {ROUTES.map((r, i) => <Pulse key={i} route={r} speed={0.18 + i * 0.03} offset={i * 0.21} color={[C.cyan, C.gold, C.purple][i % 3]} />)}
            <group ref={scan} position={[0, 0.08, 0]}>
                <mesh><boxGeometry args={[DIE, 0.01, 0.025]} /><meshBasicMaterial color={C.cyan} toneMapped={false} /></mesh>
                <mesh position={[0, 0, -0.18]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[DIE, 0.36]} />
                    <meshBasicMaterial color={C.cyan} transparent opacity={0.08} depthWrite={false} />
                </mesh>
            </group>
            {IPS.map(ip => <BlockHover key={ip.key} ip={ip} setTooltip={setTooltip}
                picked={picked === ip.key} onPick={phone ? () => setPicked(ip.key) : undefined} />)}
        </group>
    );
};

// ---------------------------------------------------------------------------
// Network-on-chip (end state)
// ---------------------------------------------------------------------------
const N = 7;
const CLUSTERS: Record<IPKey, [number, number][]> = {
    ai: [[0, 0], [1, 0], [0, 1], [1, 1]],
    cpu: [[5, 0], [6, 0], [5, 1], [6, 1]],
    serdes: [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6]],
};
const gx = (i: number) => i - (N - 1) / 2;
const clusterOf = (x: number, z: number) => (Object.keys(CLUSTERS) as IPKey[]).find(k => CLUSTERS[k].some(([a, b]) => a === x && b === z));
const PACKETS = 36;

const LINKS: V3[][] = (() => {
    const out: V3[][] = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        if (i < N - 1) out.push([[gx(i), 0.05, gx(j)], [gx(i + 1), 0.05, gx(j)]]);
        if (j < N - 1) out.push([[gx(i), 0.05, gx(j)], [gx(i), 0.05, gx(j + 1)]]);
    }
    return out;
})();

/** Seeded PRNG so the packet traffic is the same on every visit. */
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/**
 * The 7x7 router mesh with XY-routed packets. `reveal` (0..1) drives the entrance:
 * each router drops in from above, the centre first.
 */
const NocMesh = ({ setTooltip, reveal, phone, epoch }: { setTooltip: Props['setTooltip']; reveal: React.MutableRefObject<number>; phone: boolean; epoch: number }) => {
    const routers = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const towers = useRef<(THREE.Group | null)[]>([]);
    const packets = useRef<(THREE.Mesh | null)[]>([]);
    const flash = useRef<number[]>(Array(N * N).fill(0));
    const [hover, setHover] = useState<IPKey | null>(null);
    useEffect(() => setHover(null), [epoch]);

    const traffic = useMemo(() => {
        const r = rng(11);
        const spawn = () => {
            const k = (Object.keys(CLUSTERS) as IPKey[])[Math.floor(r() * 3)];
            const src: [number, number] = r() < 0.7 ? CLUSTERS[k][Math.floor(r() * CLUSTERS[k].length)] : [Math.floor(r() * N), Math.floor(r() * N)];
            const dst: [number, number] = [Math.floor(r() * N), Math.floor(r() * N)];
            return { k, path: [src, [dst[0], src[1]], dst] as [number, number][], t: 0, speed: 0.25 + r() * 0.35, len: Math.abs(dst[0] - src[0]) + Math.abs(dst[1] - src[1]) || 1 };
        };
        return { spawn, list: Array.from({ length: PACKETS }, () => ({ ...spawn(), t: r() })) };
    }, []);

    useFrame((_, dt) => {
        flash.current = flash.current.map(f => Math.max(0, f - dt * 2));
        traffic.list.forEach((pk, i) => {
            pk.t += (dt * pk.speed * 3) / pk.len;
            if (pk.t >= 1) {
                const [x, z] = pk.path[2];
                flash.current[z * N + x] = 1;
                Object.assign(pk, traffic.spawn());
            }
            const [a, b, c] = pk.path;
            const l1 = Math.abs(b[0] - a[0]) / pk.len;
            const alongX = pk.t < l1;
            const [x, z] = alongX ? [a[0] + (b[0] - a[0]) * (pk.t / (l1 || 1)), a[1]] : [b[0], b[1] + (c[1] - b[1]) * ((pk.t - l1) / ((1 - l1) || 1))];
            const m = packets.current[i];
            if (m) {
                m.position.set(gx(x), 0.16, gx(z));
                m.scale.set(alongX ? 2.6 : 1, 1, alongX ? 1 : 2.6); // a streak along its link
                (m.material as THREE.MeshBasicMaterial).color.set(IP_COLOR[pk.k]);
            }
        });
        routers.current.forEach((m, i) => { if (m) m.emissiveIntensity = flash.current[i] * 1.1; });

        const q = reveal.current;
        towers.current.forEach((g, i) => {
            if (!g) return;
            const t = clamp01(q * 1.8 - (Math.hypot((i % N) - 3, Math.floor(i / N) - 3) / 4.25) * 0.8);
            const e = 1 - (1 - t) ** 3;
            g.position.y = 0.06 + (1 - e) * 3;
            g.scale.setScalar(t > 0 ? 1 : 0.0001);
        });
    });

    return (
        <group>
            <mesh position={[0, -0.09, 0]}>
                <boxGeometry args={[N + 0.6, 0.14, N + 0.6]} />
                <meshStandardMaterial color={C.die} roughness={0.35} metalness={0.6} />
            </mesh>
            <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[N + 0.3, N + 0.3, 28, 28]} />
                <meshBasicMaterial color={C.cyan} wireframe transparent opacity={0.04} />
            </mesh>
            {LINKS.map((pts, i) => <Line key={i} points={pts} color={C.cyan} lineWidth={1.2} transparent opacity={0.22} />)}
            {Array.from({ length: N * N }, (_, idx) => {
                const x = idx % N, z = Math.floor(idx / N), k = clusterOf(x, z);
                const color = k ? IP_COLOR[k] : C.ink;
                return (
                    <group key={idx} position={[gx(x), 0.06, gx(z)]} ref={(g: THREE.Group | null) => { towers.current[idx] = g; }}>
                        <mesh>
                            <boxGeometry args={[0.36, 0.1, 0.36]} />
                            <meshStandardMaterial ref={(m: THREE.MeshStandardMaterial | null) => { routers.current[idx] = m; }}
                                color={C.router} emissive={color} emissiveIntensity={0} roughness={0.3} metalness={0.7} />
                            <Edges color={color} />
                        </mesh>
                        <mesh position={[0, 0.051, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[0.16, 0.16]} />
                            <meshBasicMaterial color={color} transparent opacity={k ? 0.75 : 0.25} toneMapped={false} />
                        </mesh>
                    </group>
                );
            })}
            {(Object.keys(CLUSTERS) as IPKey[]).map(k => {
                const ip = IPS.find(i => i.key === k)!, cells = CLUSTERS[k];
                const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
                const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
                const w = x1 - x0 + 0.8, d = z1 - z0 + 0.8;
                return (
                    <group key={k} position={[(gx(x0) + gx(x1)) / 2, 0.01, (gx(z0) + gx(z1)) / 2]}>
                        <mesh
                            onPointerOver={phone ? undefined : (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(k); setTooltip(tipOf(ip)); }}
                            onPointerOut={phone ? undefined : () => setHover(null)}
                            onClick={phone ? onTap(() => { setHover(k); setTooltip(tipOf(ip)); }) : undefined}
                        >
                            <boxGeometry args={[w, 0.03, d]} />
                            <meshBasicMaterial color={IP_COLOR[k]} transparent opacity={hover === k ? 0.22 : 0.08} depthWrite={false} />
                            <Edges color={IP_COLOR[k]} />
                        </mesh>
                        {hover === k && <Tag text={ip.label} color={IP_COLOR[k]} position={[0, 0.7, k === 'serdes' ? d / 2 + 0.2 : -d / 2 - 0.2]} />}
                    </group>
                );
            })}
            {Array.from({ length: PACKETS }, (_, i) => (
                <mesh key={i} ref={(m: THREE.Mesh | null) => { packets.current[i] = m; }}>
                    <boxGeometry args={[0.08, 0.06, 0.08]} />
                    <meshBasicMaterial color={C.cyan} toneMapped={false} />
                </mesh>
            ))}
        </group>
    );
};

// ---------------------------------------------------------------------------
// Morph
// ---------------------------------------------------------------------------
const SPIN = 0.12;        // rad/s, the original chip's 0.002 per frame at 60 fps
const SHIFT = 0.2;        // end state: scene moved right by this fraction of the canvas width
const SHRINK = 0.15;      // end state: scene scaled down by this much
const MESH_SCALE = 0.6;   // the mesh's final scale
const MORPH_SECONDS = 1.6;

/**
 * Scales every material under a group to `a` of its own opacity, and hides the group
 * (and its hit areas) near zero. Materials are switched to transparent the first time
 * they are seen, which happens on the first frame, so the morph itself never triggers
 * a material update.
 */
const fadeGroup = (g: THREE.Object3D | null, a: number) => {
    if (!g) return;
    g.visible = a > 0.02;
    g.traverse((o: any) => {
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        mats.forEach((m: any) => {
            if (m.userData.baseOpacity === undefined) {
                m.userData.baseOpacity = m.opacity ?? 1;
                if (!m.transparent) { m.transparent = true; m.needsUpdate = true; }
            }
            m.opacity = m.userData.baseOpacity * a;
        });
    });
};

const MorphScene = React.memo(({ target, instant, setTooltip, shift = SHIFT, drop = 0, phone = false, epoch = 0 }: {
    target: React.MutableRefObject<number>; instant: boolean; setTooltip: Props['setTooltip'];
    shift?: number; drop?: number; phone?: boolean; epoch?: number;
}) => {
    const { camera, size, gl, scene } = useThree();
    const warmFrames = useRef(0);
    const progress = useRef(0);
    const reveal = useRef(0);
    const spin = useRef<THREE.Group>(null), scale = useRef<THREE.Group>(null);
    const holo = useRef<THREE.Group>(null), mesh = useRef<THREE.Group>(null);

    useEffect(() => () => (camera as THREE.PerspectiveCamera).clearViewOffset(), [camera]);

    // Lets the Default theme boot tilt its 2D drawing of the chip onto this hologram: the drawing
    // starts facing the camera and turns (a real rotation, slerped) into the hologram's own pose
    const project = useMemo<ProjectChip>(() => {
        const FACE = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)); // die face to camera, top edge up
        const h = PACKAGE / 2, corners = [[-h, -h], [h, -h], [h, h], [-h, h]];
        const tp = new THREE.Vector3(), tq = new THREE.Quaternion(), ts = new THREE.Vector3();
        const cp = new THREE.Vector3(), cq = new THREE.Quaternion(), cs = new THREE.Vector3();
        const m = new THREE.Matrix4(), v = new THREE.Vector3();
        return (tilt, y, flatScale) => {
            const r = gl.domElement.getBoundingClientRect();
            holo.current!.matrixWorld.decompose(tp, tq, ts);
            camera.matrixWorld.decompose(cp, cq, cs);
            m.compose(tp, cq.multiply(FACE).slerp(tq, tilt), ts.multiplyScalar(1 + (flatScale - 1) * (1 - tilt)));
            return corners.map(([x, z]) => {
                v.set(x, y, z).applyMatrix4(m).project(camera);
                return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height];
            });
        };
    }, [camera, gl]);
    useEffect(() => () => { heroChip.project = null; }, []);

    useFrame((_, dt) => {
        // On the second frame (after fadeGroup has set up the materials), show both states
        // and compile their shaders, so the first click doesn't stall on shader compilation.
        if (warmFrames.current < 2 && ++warmFrames.current === 2 && holo.current && mesh.current) {
            holo.current.visible = mesh.current.visible = true;
            gl.compile(scene, camera);
            heroChip.project = project; // the camera and matrices are settled by now
        }
        // held while the boot draws the chip, so its drawing lands on a still target
        if (spin.current && !heroChip.booting) spin.current.rotation.y += dt * SPIN;
        // advance toward the target at a fixed rate, then smoothstep
        const d = target.current - progress.current;
        progress.current += instant ? d : Math.sign(d) * Math.min(Math.abs(d), dt / MORPH_SECONDS);
        const x = progress.current, e = x * x * (3 - 2 * x);
        reveal.current = e;

        // Off-centre framing without moving the camera, so nothing clips at a canvas edge
        (camera as THREE.PerspectiveCamera).setViewOffset(size.width, size.height, -shift * e * size.width, -drop * size.height, size.width, size.height);
        scale.current?.scale.setScalar(1 - SHRINK * e);
        if (holo.current) holo.current.scale.y = Math.max(0.02, 1 - e * 1.6); // flattens into the die
        fadeGroup(holo.current, clamp01(1 - e * 1.6));
        fadeGroup(mesh.current, clamp01(e * 3));
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={[0, 0.8, 0]} rotation={[0.5, 0, 0]}>
                <group ref={spin}>
                    <group ref={scale}>
                        <group ref={holo}><Hologram setTooltip={setTooltip} phone={phone} epoch={epoch} /></group>
                        <group scale={MESH_SCALE / (1 - SHRINK)}>
                            <group ref={mesh}><NocMesh setTooltip={setTooltip} reveal={reveal} phone={phone} epoch={epoch} /></group>
                        </group>
                    </group>
                </group>
            </group>
        </Float>
    );
});

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

/**
 * The hero copy, centred over the hologram or in a left column over the mesh. Each row
 * is its own layout node, so the switch glides every row (including the narrow label,
 * tooltip and tip rows) rather than snapping them across.
 */
const Copy = ({ split, tooltip, hint, instant, phone }: { split: boolean; tooltip: string | null; hint: string; instant: boolean; phone: boolean }) => {
    const t = { duration: instant ? 0 : MORPH_SECONDS, ease: EASE };
    // layoutDependency limits the slide to the morph itself; otherwise swapping the hint for a
    // wider tooltip on hover also re-centres the row and glides it in from the side
    const row = { layout: 'position' as const, layoutDependency: split, transition: t };
    return (
        // Lifted with bottom padding rather than a transform, so layout animation measures cleanly.
        // The paddings are inline, not Tailwind classes: the CDN only generates a class's CSS the
        // first time it appears, so on the first split framer-motion would measure the target
        // layout before the padding existed and start the slide from the wrong place.
        <div
            className={`absolute inset-0 z-10 pointer-events-none flex flex-col justify-center ${split ? 'items-start' : 'items-center'}`}
            style={phone ? { justifyContent: 'flex-start', paddingTop: '13svh' } : split ? { paddingLeft: '9vw', paddingBottom: 96 } : { paddingBottom: 224 }}
        >
            <motion.div layout layoutDependency={split} transition={t}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
                    className={`flex flex-col ${split ? 'items-start text-left' : 'items-center text-center'}`}
                    style={{ textShadow: '0 0 14px var(--color-obsidian), 0 0 4px var(--color-obsidian), 0 2px 2px var(--color-obsidian)' }}
                >
                    <motion.div {...row} className="flex items-center gap-2 mb-2.5">
                        <Cpu className="text-electric w-6 h-6 animate-pulse" />
                        <span className="font-mono text-electric tracking-widest text-sm">SYSTEM_ON_CHIP :: VERIFICATION</span>
                    </motion.div>
                    {/* CyberText's h1 carries mb-4; -mb-0.5 trims the name-to-role gap to 14px */}
                    <motion.div {...row} className="-mb-0.5"><CyberText text="MISHAT" /></motion.div>
                    {/* Over the hologram the role sits on a dark band; it fades out over the mesh.
                        -mx-4 cancels the band padding so the text stays aligned in both states. */}
                    <motion.p {...row}
                        className={`max-w-3xl -mx-4 px-4 py-1 rounded-md whitespace-nowrap max-md:whitespace-normal max-md:max-w-[22rem] max-md:text-base text-lg md:text-xl font-bold transition-colors duration-[1600ms] ${split ? 'text-gray-400 bg-transparent' : 'text-gray-100 bg-obsidian/75'}`}>
                        Senior Design Verification Engineer <span className="text-pcbgold font-bold">@ Marvell Technology</span>
                    </motion.p>
                    <motion.div {...row} className="mt-4 h-12 flex items-center">
                        {tooltip ? (
                            <motion.div
                                key={tooltip}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-black/80 backdrop-blur-md border border-electric/50 px-6 py-2 rounded-full font-mono text-sm text-electric max-md:max-w-[calc(100vw-2rem)] max-md:rounded-2xl max-md:text-xs max-md:px-4 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                            >
                                {tooltip}
                            </motion.div>
                        ) : (
                            <span className="text-gray-700 text-xs font-mono animate-pulse">{hint}</span>
                        )}
                    </motion.div>
                    <motion.div {...row} className="mt-4 text-[10px] text-gray-400 font-mono max-md:hidden">
                        Tip: Use <span className="text-electric font-bold">j</span> / <span className="text-electric font-bold">k</span> to navigate, <span className="text-electric font-bold">gg</span> / <span className="text-electric font-bold">G</span> to jump, <span className="text-electric font-bold">:</span> for commands
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
/** Aims the camera at the die the way OrbitControls does, for phones where it isn't mounted. */
const LookAtOrigin = () => {
    const { camera } = useThree();
    useEffect(() => { camera.lookAt(0, 0, 0); }, [camera]);
    return null;
};

export default function NocMorphHero({ setTooltip, tooltip }: Props) {
    const instant = !!useReducedMotion();
    const [isMobile, setIsMobile] = useState(false);
    const target = useRef(0);
    const [split, setSplit] = useState(false);
    // Phones get the morph by tap, framed to fit the narrow screen, with the copy staying centred
    const phone = usePhone();
    // Bumped on each phone morph, so the model that fades out forgets its picked block
    const [epoch, setEpoch] = useState(0);

    // Tells ClockProbeBackdrop to swap the page background when the hero splits
    useEffect(() => { window.dispatchEvent(new CustomEvent('hero-split', { detail: split })); }, [split]);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // A drag orbits the die; only a click (pointer barely moved) toggles the morph.
    const down = useRef({ x: 0, y: 0 });
    const toggle = (e: React.MouseEvent) => {
        if (Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) > 5) return;
        if (tap.hit) { tap.hit = false; return; } // the tap picked a block
        target.current = target.current > 0.5 ? 0 : 1;
        setSplit(target.current > 0.5);
        if (phone) { setEpoch(n => n + 1); setTooltip(null); } // drop the old model's pick and caption
    };

    return (
        <>
            <div
                className={`absolute inset-0 z-0 ${isMobile && !phone ? 'pointer-events-none' : 'cursor-pointer'}`}
                style={{
                    opacity: 0.9,
                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                }}
                onPointerDown={e => { down.current = { x: e.clientX, y: e.clientY }; }}
                onClick={toggle}
            >
                <Canvas camera={{ position: phone ? [0, 8.4, 13.4] : [0, 5, 8], fov: 45 }} dpr={Math.min(window.devicePixelRatio, 2)}>
                    <ambientLight intensity={0.33} />
                    <directionalLight position={[5, 10, 2]} intensity={0.6} />
                    <pointLight position={[-4, 2, -3]} intensity={5} distance={12} color={C.purple} />
                    <pointLight position={[4, 2, 3]} intensity={5} distance={12} color={C.cyan} />
                    {/* Phones: tapping a block shows its caption, tapping anywhere else runs the morph */}
                    <MorphScene target={target} instant={instant} setTooltip={setTooltip} shift={phone ? 0 : SHIFT} drop={phone ? 0.13 : 0} phone={phone} epoch={epoch} />
                    {/* OrbitControls sets touch-action: none on the canvas, which would stop a phone scrolling past the hero */}
                    {phone ? <LookAtOrigin /> : <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={0} enabled={!isMobile} />}
                </Canvas>
            </div>
            <Copy split={split && !phone} phone={phone} tooltip={tooltip} instant={instant}
                hint={phone ? (split ? 'Tap a cluster, or elsewhere to fold back...' : 'Tap a block, or the die to boot the network...') : split ? 'Hover a cluster...' : 'Click the die to boot the network...'} />
        </>
    );
}
