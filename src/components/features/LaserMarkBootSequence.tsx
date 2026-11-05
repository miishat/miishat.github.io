/**
 * @file LaserMarkBootSequence.tsx
 * @description Boot sequence for the Silicon theme. The hero's package appears blank right
 * where the hero has it, its pin rows grow out, and a laser spot burns the marking in line by
 * line, left to right. The black then clears so the RTL rain and the real hero show through,
 * and the boot lifts. The drawing is built from the hero's own parts and follows the hero's
 * live pose (its lean toward the mouse included), so the hand-off doesn't move a pixel.
 * @module Components/Features
 * @author Mishat
 */
import React, { useEffect, useRef, useState } from 'react';
import CyberText from '../ui/CyberText';
import { MARKING_LINES, Marking, PIN_HINT, PIN_ROWS, PackageBody, Side, markedPackage, pinLeads, rowPosition } from './MarkedPackageHero';

// Silicon's colours, hardcoded: the boot's first frames come before the theme class is on <body>
const GREEN = '#39ff14', LIME = '#ccff00', INK = '#66cc66', FAINT = '#339933';

// --- Timeline, as fractions of the run ---
const TOTAL_MS = 6200;
const PACKAGE_IN: [number, number] = [0, 0.06];
const PINS_OUT: [number, number] = [0.02, 0.14];
const BURN: [number, number] = [0.14, 0.86];
const NOTES_OUT: [number, number] = [0.86, 0.9];
const BG_OUT: [number, number] = [0.9, 0.98];

/** Each pin row grows out from the body edge it sits on. */
const GROW_FROM: Record<Side, string> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** Elapsed run as 0..1; any key or click finishes it. */
function useBootClock(onComplete: () => void) {
    const [p, setP] = useState(0);
    const done = useRef(false);
    useEffect(() => {
        const finish = () => { if (!done.current) { done.current = true; onComplete(); } };
        const t0 = performance.now();
        let raf = 0;
        const tick = (now: number) => {
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

/**
 * Where the hero's package plane is right now, as a fixed-position box and its transform.
 * Read every render (the clock re-renders each frame): the page settles under the boot, and
 * the hero keeps leaning toward the mouse.
 */
function heroPlane(): React.CSSProperties {
    const el = markedPackage.el;
    const r = el?.parentElement?.getBoundingClientRect();
    if (!el || !r) {
        return { left: '50%', top: 'calc(50% - 64px)', width: 820, height: 660, translate: '-50% -50%', transform: 'perspective(1400px) rotateX(38deg)' };
    }
    const w = el.offsetWidth, h = el.offsetHeight;
    return {
        left: r.left + (r.width - w) / 2,
        top: r.top + (r.height - h) / 2,
        width: w,
        height: h,
        transform: el.style.transform || 'perspective(1400px) rotateX(38deg)',
    };
}

const LaserMarkBootSequence = ({ onComplete }: { onComplete: () => void }) => {
    const t = useBootClock(onComplete);
    const per = (BURN[1] - BURN[0]) / MARKING_LINES;
    const burnt = (i: number) => span(t, [BURN[0] + per * i, BURN[0] + per * (i + 1)]);
    const current = Math.min(MARKING_LINES - 1, Math.floor(span(t, BURN) * MARKING_LINES));
    const pins = easeOut(span(t, PINS_OUT));
    const bg = 1 - span(t, BG_OUT);
    const notes = 1 - span(t, NOTES_OUT);

    return (
        <div className="fixed inset-0 overflow-hidden font-mono" style={{ background: `rgba(0, 5, 0, ${bg})` }}>
            <div className="absolute" style={{ ...heroPlane(), opacity: span(t, PACKAGE_IN) }}>
                {PIN_ROWS.map(({ side }) => (
                    <div key={side} className="absolute" style={{
                        ...rowPosition(side),
                        background: pinLeads(side, 'var(--color-pcbgold)'),
                        transformOrigin: GROW_FROM[side],
                        transform: side === 'top' || side === 'bottom' ? `scaleY(${pins})` : `scaleX(${pins})`,
                    }} />
                ))}
                <PackageBody>
                    <Marking
                        name={<CyberText text="MISHAT" decode={false} />}
                        readout={PIN_HINT}
                        line={(i, node) => {
                            const k = burnt(i);
                            return (
                                <div key={i} className="relative">
                                    {/* Burnt so far: the line up to the spot, glowing while it's hot */}
                                    <div style={{ clipPath: `inset(-20% ${100 - k * 100}% -20% 0)`, filter: k < 1 ? `drop-shadow(0 0 6px ${LIME})` : 'none' }}>
                                        {node}
                                    </div>
                                    {k > 0 && k < 1 && (
                                        <span
                                            className="absolute top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                                            style={{ left: `${k * 100}%`, background: '#fff', boxShadow: `0 0 12px 6px ${LIME}, 0 0 40px 14px ${GREEN}` }}
                                        />
                                    )}
                                </div>
                            );
                        }}
                    />
                </PackageBody>
            </div>

            <div className="absolute bottom-10 left-16 text-xs leading-6" style={{ opacity: notes }}>
                <div style={{ color: GREEN }}>LASER MARK · 1064nm · 20W · 0.08mm</div>
                <div style={{ color: INK }}>
                    LINE {current + 1}/{MARKING_LINES} {'█'.repeat(Math.round(burnt(current) * 16)).padEnd(16, '░')}
                </div>
            </div>
            <div className="absolute bottom-6 right-8 text-[11px] tracking-widest uppercase" style={{ color: FAINT, opacity: notes }}>
                <span className="max-md:hidden">Press any key or click to skip</span><span className="md:hidden">Tap to skip</span>
            </div>
        </div>
    );
};

export default LaserMarkBootSequence;
