/**
 * @file SectionHeader.tsx
 * @description Standard reusable header for page sections.
 * Features a magnetic icon and a cyber-text reveal animation on hover.
 * @module Components/UI
 * @author Mishat
 */
import React, { useState } from 'react';
import MagneticWrapper from './MagneticWrapper';

/**
 * Standard section header with a magnetic icon and a "decoding" text effect on hover.
 */
const SectionHeader = ({ icon: Icon, title, subtitle, className = "mb-12" }: { icon: any, title: string, subtitle: string, className?: string }) => {
    // Decode effect on view
    const [displayTitle, setDisplayTitle] = useState(title);

    return (
        <div className={`flex items-start gap-6 relative z-10 group ${className}`}>
            <MagneticWrapper strength={0.3}>
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800 text-electric relative z-20 group-hover:border-electric transition-colors duration-500 shadow-[0_0_0_rgba(0,243,255,0)] group-hover:shadow-[0_0_20px_rgba(0,243,255,0.2)]">
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
                <p className="text-gray-400 font-mono text-sm border-l-2 border-transparent pl-2 group-hover:border-electric transition-all duration-300">
                    {subtitle}
                </p>
            </div>
        </div>
    )
};

export default SectionHeader;
