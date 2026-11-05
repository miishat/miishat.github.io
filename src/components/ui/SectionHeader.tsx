/**
 * @file SectionHeader.tsx
 * @description Standard header for page sections, with a design per theme.
 * Default: a holographic title floating in corner brackets, projected up from a probed
 * gold pad by two thin rays; the subtitle is the net label beside the pad.
 * Silicon: an off-page port tag carrying the title, feeding a bus that runs across the page;
 * the subtitle is the bus's net name and `aside` sits where the bus ends.
 * Light: the icon-and-title header, its subtitle led in by an LED and a resistor on a short trace.
 * @module Components/UI
 * @author Mishat
 */
import React, { useEffect, useRef, useState } from 'react';
import MagneticWrapper from './MagneticWrapper';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '../../theme';

interface SectionHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    className?: string;
    /** Control kept level with the title, at the far end of the header (the trace's view toggle) */
    aside?: React.ReactNode;
}

/** Flips true once the header scrolls into view. */
const useLit = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);
    const [lit, setLit] = useState(false);
    useEffect(() => {
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setLit(true); io.disconnect(); }
        }, { threshold: 0.6 });
        io.observe(ref.current!);
        return () => io.disconnect();
    }, []);
    return [ref, lit] as const;
};

/** The two corner pairs of the hologram's frame. */
const CORNERS = ['top-0 left-0 border-t border-l', 'top-0 right-0 border-t border-r', 'bottom-0 left-0 border-b border-l', 'bottom-0 right-0 border-b border-r'];

/**
 * Default theme. The pad centre sits 22px in and 18px up from the block's bottom-left;
 * the probe's needle tip and the rays both start there.
 */
const ProjectedHeader = ({ icon: Icon, title, subtitle, className }: SectionHeaderProps) => {
    // Once in view the hologram flickers on and the rays fade in
    const [ref, lit] = useLit<HTMLDivElement>();

    return (
        <div ref={ref} className={`relative z-10 ${className}`}>
            {/* Phones: inset so the probe body, which hangs left of the block, stays on screen */}
            <div className="relative inline-block max-md:ml-10" style={{ paddingLeft: 72, paddingBottom: 52 }}>
                <div className="holo-bob">
                    <div className={`relative px-6 py-3 ${lit ? 'holo-flicker' : 'opacity-0'}`}>
                        {CORNERS.map(c => <span key={c} className={`absolute w-4 h-4 border-electric ${c}`} />)}
                        <div className="flex items-center gap-3">
                            <Icon size={24} className="text-electric shrink-0" />
                            <h2 className="holo-text text-2xl sm:text-4xl font-bold tracking-tight">{title}</h2>
                        </div>
                    </div>
                </div>

                {/* Rays from the pad to the frame's bottom corners, over a faint fill */}
                <span
                    aria-hidden
                    className="absolute transition-opacity duration-700"
                    style={{
                        left: 22, bottom: 18, width: 'calc(100% - 22px)', height: 34, opacity: lit ? 1 : 0,
                        clipPath: 'polygon(0 100%, 50px 0, 100% 0)', background: 'rgba(0, 243, 255, 0.07)',
                    }}
                />
                <svg
                    aria-hidden
                    className="absolute transition-opacity duration-700"
                    style={{ left: 22, bottom: 18, width: 'calc(100% - 22px)', height: 34, opacity: lit ? 1 : 0 }}
                >
                    <line x1="0" y1="100%" x2="50" y2="0" stroke="rgba(0, 243, 255, 0.7)" strokeWidth="1" />
                    <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(0, 243, 255, 0.7)" strokeWidth="1" />
                </svg>

                {/* Gold pad */}
                <span className="absolute w-3 h-3 rounded-full border-2 border-pcbgold bg-black shadow-[0_0_10px_rgba(212,175,55,0.6)]" style={{ left: 16, bottom: 12 }} />
                <span className="absolute w-3 h-3 rounded-full border border-pcbgold probe-ping" style={{ left: 16, bottom: 12 }} />

                {/* Probe: body, then the needle, whose tip (52, 30) lands on the pad centre */}
                <svg aria-hidden className="absolute overflow-visible" width="52" height="30" style={{ left: -30, bottom: 18 }}>
                    <polygon points="-14,-4 -8,-10 20,6 14,12" fill="#1f2937" stroke="#6b7280" strokeWidth="1" />
                    <line x1="2" y1="-1" x2="8" y2="-7" stroke="rgb(0, 243, 255)" strokeWidth="2" />
                    <line x1="17" y1="9" x2="52" y2="30" stroke="#cbd5e1" strokeWidth="1.25" />
                </svg>

                {/* Net label */}
                <p className="absolute font-mono text-xs whitespace-nowrap border-l-2 border-electric bg-black/60 px-1.5 py-0.5 text-electric/80" style={{ left: 44, bottom: 0 }}>
                    {subtitle}
                </p>
            </div>
        </div>
    );
};

/** A code token: not a <span>, so the Silicon theme leaves its case alone. */
const Code = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <code className={className} style={{ textTransform: 'none', fontSize: 'inherit' }}>{children}</code>
);

/**
 * Silicon. The tag is an off-page connector pointing into a two-rail bus, which draws itself
 * out to the right once the header scrolls in. The hierarchy path above names the instance.
 */
const PortHeader = ({ icon: Icon, title, subtitle, className, aside }: SectionHeaderProps) => {
    const [ref, lit] = useLit<HTMLDivElement>();
    const rail = { background: 'var(--color-electric)' };
    return (
        <div ref={ref} className={`relative z-10 w-full font-mono ${className}`}>
            <div className="mb-2 text-xs text-gray-500">
                <Code>top <b className="text-gray-600">/</b> u_{title.toLowerCase().replace(/\W+/g, '_')}</Code>
            </div>
            <div className="flex items-center max-md:flex-wrap">
                <div
                    className="silicon-port flex items-center gap-3 pl-4 pr-8 py-3 shrink-0"
                    style={{ ...rail, clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 0 100%)' }}
                >
                    <Icon size={20} />
                    <h2 className="text-2xl max-md:text-xl font-black" style={{ color: '#000500' }}>{title}</h2>
                </div>
                {/* Bus: two rails, a width slash, the net name riding on top, and a pad at the end */}
                <div
                    className="relative flex-1 min-w-12 h-4 origin-left"
                    style={{ transform: `scaleX(${lit ? 1 : 0})`, transition: 'transform .6s steps(12)' }}
                >
                    <i className="absolute left-0 right-0 top-[5px] h-px" style={rail} />
                    <i className="absolute left-0 right-0 bottom-[5px] h-px" style={rail} />
                    <i className="absolute left-16 top-[-4px] w-px h-6 rotate-[30deg]" style={rail} />
                    <div className="absolute left-[72px] -top-5 text-[10px] text-gray-500 max-md:hidden"><Code>[63:0]</Code></div>
                    <p className="absolute left-36 -top-6 whitespace-nowrap text-xs text-gray-400 max-md:hidden"><Code>{subtitle}</Code></p>
                    <i className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5" style={rail} />
                </div>
                {/* Phones leave the bus too short to carry the net name, so it goes under the tag */}
                <p className="md:hidden basis-full mt-2 text-xs text-gray-400"><Code>{subtitle}</Code></p>
                {aside && <div className="ml-4 shrink-0 max-md:ml-0 max-md:mt-3 max-md:basis-full">{aside}</div>}
            </div>
        </div>
    );
};

/** Ease shared by the signal line's parts; reduced motion just shows them lit. */
const signalTr = (prop: string, ms: number, delay = 0) =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : `${prop} ${ms}ms cubic-bezier(.4,0,.2,1) ${delay}ms`;

/**
 * Light: the lead-in to the subtitle, an LED and a resistor on a short coral trace.
 * Once in view the trace draws in, the resistor appears on it, then the LED lights.
 */
const SignalLine = ({ lit }: { lit: boolean }) => (
    <svg width="62" height="14" viewBox="0 0 62 14" aria-hidden className="shrink-0 overflow-visible">
        <circle cx="6" cy="7" r="8" fill="#6f9a7a" style={{ opacity: lit ? 0.28 : 0, transition: signalTr('opacity', 800, 700) }} />
        <circle cx="6" cy="7" r="4.5" fill="#6f9a7a" style={{ filter: lit ? 'brightness(1.3)' : 'saturate(.3)', transition: signalTr('filter', 600, 700) }} />
        <circle cx="4.8" cy="5.6" r="1.3" fill="#fff" opacity=".75" />
        <line x1="11" y1="7" x2="60" y2="7" stroke="rgb(214,120,110)" strokeWidth="1.5" pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: lit ? 0 : 1, transition: signalTr('stroke-dashoffset', 600) }} />
        <g style={{ opacity: lit ? 1 : 0, transition: signalTr('opacity', 300, 300) }}>
            <rect x="22" y="2.5" width="24" height="9" rx="4.5" fill="#e6d8b4" stroke="#c9aa6a" strokeWidth=".8" />
            <rect x="28" y="3" width="2" height="8" fill="#9a8aa6" />
            <rect x="33" y="3" width="2" height="8" fill="#6f9a7a" />
            <rect x="38" y="3" width="2" height="8" fill="#c9aa6a" />
        </g>
    </svg>
);

/** Light: magnetic icon box, with a "decoding" scramble on the title on hover, and a signal line into the subtitle. */
const IconHeader = ({ icon: Icon, title, subtitle, className }: SectionHeaderProps) => {
    const [displayTitle, setDisplayTitle] = useState(title);
    const [ref, lit] = useLit<HTMLDivElement>();

    return (
        <div ref={ref} className={`flex items-start gap-6 relative z-10 ${className}`}>
            <MagneticWrapper strength={0.3}>
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800 text-electric relative z-20">
                    <Icon size={32} />
                </div>
            </MagneticWrapper>
            <div className="min-w-0">
                <h2
                    className="text-4xl max-md:text-[26px] max-md:leading-[1.25] font-bold text-white mb-2 relative"
                    onMouseEnter={() => {
                        // Quick scramble effect
                        let iter = 0;
                        const interval = setInterval(() => {
                            setDisplayTitle(title.split("").map((l, i) => {
                                if (i < iter) return title[i];
                                return "ABCDEF0123456789"[Math.floor(Math.random() * 16)];
                            }).join(""));
                            if (iter >= title.length) clearInterval(interval);
                            iter += 0.35;
                        }, 30);
                    }}
                >
                    {displayTitle}
                </h2>
                <p className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                    <SignalLine lit={lit} />
                    <span className="min-w-0 break-words">{subtitle}</span>
                </p>
            </div>
        </div>
    );
};

const SectionHeader = ({ className = "mb-12", aside, ...props }: SectionHeaderProps) => {
    const theme = useTheme();
    if (theme === 'silicon') return <PortHeader {...props} aside={aside} className={className} />;
    const Header = theme === 'default' ? ProjectedHeader : IconHeader;
    if (!aside) return <Header {...props} className={className} />;
    return (
        // Phones: the header stays at the left edge like every other section's, with the control full width under it
        <div className={`flex flex-col md:flex-row justify-between items-end md:items-center max-md:items-stretch gap-4 ${className}`}>
            <Header {...props} className="mb-0" />
            {aside}
        </div>
    );
};

export default SectionHeader;
