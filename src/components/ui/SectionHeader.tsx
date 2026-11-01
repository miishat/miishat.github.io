/**
 * @file SectionHeader.tsx
 * @description Standard header for page sections, with a design per theme.
 * Default: a holographic title floating in corner brackets, projected up from a probed
 * gold pad by two thin rays; the subtitle is the net label beside the pad.
 * Silicon and Light: the original icon-and-title header, until they get their own designs.
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
}

/** The two corner pairs of the hologram's frame. */
const CORNERS = ['top-0 left-0 border-t border-l', 'top-0 right-0 border-t border-r', 'bottom-0 left-0 border-b border-l', 'bottom-0 right-0 border-b border-r'];

/**
 * Default theme. The pad centre sits 22px in and 18px up from the block's bottom-left;
 * the probe's needle tip and the rays both start there.
 */
const ProjectedHeader = ({ icon: Icon, title, subtitle, className }: SectionHeaderProps) => {
    const ref = useRef<HTMLDivElement>(null);
    // Flips once the header scrolls into view: the hologram flickers on and the rays fade in
    const [lit, setLit] = useState(false);
    useEffect(() => {
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setLit(true); io.disconnect(); }
        }, { threshold: 0.6 });
        io.observe(ref.current!);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={ref} className={`relative z-10 ${className}`}>
            <div className="relative inline-block" style={{ paddingLeft: 72, paddingBottom: 52 }}>
                <div className="holo-bob">
                    <div className={`relative px-6 py-3 ${lit ? 'holo-flicker' : 'opacity-0'}`}>
                        {CORNERS.map(c => <span key={c} className={`absolute w-4 h-4 border-electric ${c}`} />)}
                        <div className="flex items-center gap-3">
                            <Icon size={24} className="text-electric shrink-0" />
                            <h2 className="holo-text text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
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

/** Silicon and Light: magnetic icon box, with a "decoding" scramble on the title on hover. */
const IconHeader = ({ icon: Icon, title, subtitle, className }: SectionHeaderProps) => {
    const [displayTitle, setDisplayTitle] = useState(title);

    return (
        <div className={`flex items-start gap-6 relative z-10 ${className}`}>
            <MagneticWrapper strength={0.3}>
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800 text-electric relative z-20">
                    <Icon size={32} />
                </div>
            </MagneticWrapper>
            <div>
                <h2
                    className="text-4xl font-bold text-white mb-2 relative"
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
                <p className="text-gray-400 font-mono text-sm pl-2">
                    {subtitle}
                </p>
            </div>
        </div>
    );
};

const SectionHeader = ({ className = "mb-12", ...props }: SectionHeaderProps) => {
    const theme = useTheme();
    const Header = theme === 'default' ? ProjectedHeader : IconHeader;
    return <Header {...props} className={className} />;
};

export default SectionHeader;
