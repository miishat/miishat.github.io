/**
 * @file MarkedPackageHero.tsx
 * @description Hero for the Silicon theme: the page title laser-marked on the lid
 * of a large QFP package that lies at the 3D chip's tilt and leans toward the mouse.
 * Each pin row is an IP block; hovering it fills the hero tooltip.
 * The package's parts are exported so LaserMarkBootSequence can draw the same package
 * over this one and burn its marking in.
 *
 * @author Mishat
 */
import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { Cpu } from 'lucide-react';
import CyberText from '../ui/CyberText';
import { usePhone } from '../../usePhone';

export type Side = 'top' | 'right' | 'bottom' | 'left';

export const PIN_ROWS: { side: Side; label: string; desc: string }[] = [
    { side: 'top', label: 'AI Network Control', desc: 'Traffic management & control logic for AI clusters.' },
    { side: 'right', label: 'CPU & Memory', desc: 'Coherent mesh, L3 Cache & DDR controller verification.' },
    { side: 'bottom', label: 'SerDes & Ethernet', desc: 'COMPHY bringups & High-Speed I/O verification.' },
    { side: 'left', label: 'JTAG & DFT', desc: 'Scan chains, debug access and silicon bring-up.' },
];

const PIN_LEN = 36;   // px, how far a pin row sticks out of the body
const PIN_INSET = 72; // px, corner clearance at each end of a row

export const rowPosition = (side: Side): React.CSSProperties => {
    switch (side) {
        case 'top': return { top: -PIN_LEN, left: PIN_INSET, right: PIN_INSET, height: PIN_LEN };
        case 'bottom': return { bottom: -PIN_LEN, left: PIN_INSET, right: PIN_INSET, height: PIN_LEN };
        case 'left': return { left: -PIN_LEN, top: PIN_INSET, bottom: PIN_INSET, width: PIN_LEN };
        case 'right': return { right: -PIN_LEN, top: PIN_INSET, bottom: PIN_INSET, width: PIN_LEN };
    }
};

/** A pin row's leads, 12px wide on a 30px pitch, in `color`. */
export const pinLeads = (side: Side, color: string) =>
    `repeating-linear-gradient(${side === 'top' || side === 'bottom' ? 90 : 180}deg, ${color} 0 12px, transparent 12px 30px)`;

/** What the boot needs to draw over the package: the hero fills `el` with the package's plane. */
export const markedPackage: { el: HTMLDivElement | null } = { el: null };

const PinRow = ({ side, label, desc, onHover }: { side: Side; label: string; desc: string; onHover: (t: string) => void }) => {
    const [hover, setHover] = useState(false);
    return (
        <div
            className="absolute cursor-crosshair"
            style={{
                ...rowPosition(side),
                background: pinLeads(side, hover ? 'var(--color-electric)' : 'var(--color-pcbgold)'),
                filter: hover ? 'drop-shadow(0 0 6px var(--color-electric))' : 'none',
            }}
            onMouseEnter={() => { setHover(true); onHover(`${label}: ${desc}`); }}
            onMouseLeave={() => setHover(false)}
            onClick={() => onHover(`${label}: ${desc}`)}
        />
    );
};

/** Package body; the stacked shadows fake its thickness. Its marking goes in as `children`. */
export const PackageBody = ({ children }: { children: React.ReactNode }) => (
    <div
        className="absolute inset-0 rounded-md border border-white/[0.08]"
        style={{
            background: 'linear-gradient(145deg, #08080c, #020203)',
            boxShadow: '0 6px 0 #020203, 0 12px 0 #010101, 0 40px 90px rgba(0,0,0,0.85)',
        }}
    >
        {/* Moulding-compound grain and the pin 1 dimple */}
        <div className="absolute inset-0 rounded-md opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
        <span className="absolute top-8 left-8 w-7 h-7 rounded-full bg-black/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
        {children}
    </div>
);

/** The pin-row readout's resting text, before a row is hovered (tapped, on a phone). */
const PinHint = () => <span className="text-gray-700 text-xs animate-pulse">{usePhone() ? 'Tap a pin row...' : 'Hover a pin row...'}</span>;
export const PIN_HINT = <PinHint />;

export const MARKING_LINES = 7;

/**
 * The laser marking. `line` wraps each of its MARKING_LINES lines, top to bottom, so the boot
 * can burn them in one at a time; the name and the pin-row readout come in as nodes.
 */
export const Marking = ({ name, readout, line = (_i, node) => node }: {
    name: React.ReactNode;
    readout: React.ReactNode;
    line?: (i: number, node: React.ReactNode) => React.ReactNode;
}) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-1 font-mono">
        {line(0, <div className="flex items-center gap-2 mb-2 text-electric text-sm tracking-[0.3em] max-md:text-[11px] max-md:tracking-[0.12em]">
            <Cpu className="w-5 h-5" /> SYSTEM_ON_CHIP :: VERIFICATION
        </div>)}
        {line(1, name)}
        {line(2, <div className="-mt-1 text-2xl max-md:text-base max-md:px-4 font-sans font-bold text-gray-300">Senior Design Verification Engineer</div>)}
        {line(3, <div className="text-2xl max-md:text-base font-sans font-bold text-pcbgold">@ Marvell Technology</div>)}
        {line(4, <div className="mt-8 max-md:mt-3 h-12 flex items-center pointer-events-none max-md:px-3">{readout}</div>)}
        {line(5, <div className="mt-6 max-md:mt-3 text-xs tracking-[0.25em] max-md:text-[10px] max-md:tracking-[0.1em] text-gray-500">MRVL-DV · 2026 · REV 4'h3 · CANADA</div>)}
        {line(6, <div className="mt-6 text-[10px] text-gray-400 max-md:hidden">
            Tip: Use <span className="text-electric font-bold">j</span> / <span className="text-electric font-bold">k</span> to navigate, <span className="text-electric font-bold">gg</span> / <span className="text-electric font-bold">G</span> to jump, <span className="text-electric font-bold">:</span> for commands
        </div>)}
    </div>
);

interface MarkedPackageHeroProps {
    tooltip: string | null;
    setTooltip: (t: string) => void;
}

export default function MarkedPackageHero({ tooltip, setTooltip }: MarkedPackageHeroProps) {
    const reduceMotion = useReducedMotion();

    // Pointer position (0..1) drives a gentle lean around the resting 38deg tilt.
    const px = useMotionValue(0.5);
    const py = useMotionValue(0.5);
    // Phones: the package lies flat, seen straight from above; a narrow package laid back reads as a tall wedge
    const phone = usePhone();
    const rotateX = useSpring(useTransform(py, [0, 1], phone ? [0, 0] : [44, 32]), { stiffness: 60, damping: 18 });
    const rotateZ = useSpring(useTransform(px, [0, 1], phone ? [0, 0] : [-10, 10]), { stiffness: 60, damping: 18 });

    useEffect(() => {
        if (reduceMotion) return;
        const onMove = (e: MouseEvent) => {
            px.set(e.clientX / window.innerWidth);
            py.set(e.clientY / window.innerHeight);
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, [reduceMotion]);

    return (
        <div className="absolute inset-0 z-0 flex items-center justify-center -translate-y-16 max-md:-translate-y-8">
            <motion.div
                ref={el => { markedPackage.el = el; }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                style={{ rotateX, rotateZ, transformPerspective: 1400 }}
                className="relative w-[820px] h-[660px] max-md:w-[calc(100vw-88px)] max-md:h-[max(calc(100vw-88px),340px)]"
            >
                {PIN_ROWS.map(row => <PinRow key={row.side} {...row} onHover={setTooltip} />)}

                <PackageBody>
                    <Marking
                        name={<CyberText text="MISHAT" />}
                        readout={tooltip ? (
                            <motion.div
                                key={tooltip}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-black/80 backdrop-blur-md border border-electric/50 px-6 py-2 rounded-full text-sm text-electric max-md:text-xs max-md:px-3 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                            >
                                {tooltip}
                            </motion.div>
                        ) : PIN_HINT}
                    />
                </PackageBody>
            </motion.div>
        </div>
    );
}
