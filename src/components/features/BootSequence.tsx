/**
 * @file BootSequence.tsx
 * @description Simulates a hardware POST (Power-On Self-Test) sequence.
 * Displays scrolling log messages before the main content reveals.
 * @module Components/Features
 * @author Mishat
 */
import React, { useState, useEffect } from 'react';

// Utility toHex was used here, let's include it or import it.
// It was defined in index.tsx: const toHex = (num: number) => num.toString(16).toUpperCase().padStart(4, '0');
const toHex = (num: number) => num.toString(16).toUpperCase().padStart(4, '0');

/**
 * Simulates a hardware bootup sequence with scrolling log text.
 * Blocks the main UI until the "boot" is complete.
 */
const BootSequence = ({ onComplete }: { onComplete: () => void }) => {
    const [lines, setLines] = useState<string[]>([]);

    const bootLog = [
        "BIOS_REV 4.09.23 // CHECKING PERIPHERALS...",
        "DETECTED: CPU [ARM Cortex-A78]",
        "DETECTED: GPU [Mali-G710]",
        "LOADING MEMORY MAP... 0xFFFF_FFFF OK",
        "INITIALIZING UVM PHASES...",
        " > build_phase... DONE",
        " > connect_phase... DONE",
        " > elaboration_phase... DONE",
        "STARTING SIMULATION...",
        "LOADING PORTFOLIO V2.0..."
    ];

    useEffect(() => {
        let delay = 0;
        bootLog.forEach((line, index) => {
            delay += Math.random() * 300 + 100;
            setTimeout(() => {
                setLines(prev => [...prev, line]);
                if (index === bootLog.length - 1) {
                    setTimeout(onComplete, 800);
                }
            }, delay);
        });
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-end pb-12 pl-12 font-mono text-sm md:text-base">
            {lines.map((line, i) => (
                <div key={i} className="text-electric mb-1">
                    <span className="text-gray-500 mr-4">[{toHex(i * 128)}]</span>
                    {line}
                </div>
            ))}
            <div className="text-electric animate-pulse mt-2">_</div>
        </div>
    );
};

export default BootSequence;
