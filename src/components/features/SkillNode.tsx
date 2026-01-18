/**
 * @file SkillNode.tsx
 * @description A dashboard widget representing a technical skill.
 * Visualizes proficiency levels (bins) and registers as a signal target.
 * @module Components/Features
 * @author Mishat
 */
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSignal } from '../../context/SignalContext';

/**
 * Represents a specific skill in the coverage dashboard.
 * Registers itself as a target for the Signal System.
 */
const SkillNode = ({ name, level, index }: { name: string; level: number; index: number }) => {
    const bins = 16;
    const filledBins = Math.floor((level / 100) * bins);
    const ref = useRef<HTMLDivElement>(null);
    const { registerTarget, activeHits } = useSignal();
    const id = `skill-${index}`;

    useEffect(() => {
        registerTarget('skills', ref);
    }, []);

    const isHit = activeHits.has(id);

    return (
        <div ref={ref} className="relative z-10 transition-transform duration-200" style={{ transform: isHit ? 'scale(1.05)' : 'scale(1)' }}>
            <div className={`flex flex-col gap-2 p-4 border transition-all duration-300 bg-obsidian/80 backdrop-blur-sm rounded-lg group relative overflow-hidden ${isHit ? 'border-electric shadow-[0_0_20px_rgba(0,243,255,0.3)]' : 'border-gray-800 hover:border-electric'}`}>
                <div className="absolute top-0 right-0 p-1">
                    <div className={`w-1 h-1 rounded-full transition-colors ${isHit ? 'bg-electric' : 'bg-gray-600 group-hover:bg-electric'}`} />
                </div>
                <div className="flex justify-between items-center mb-1">
                    <span className={`font-mono font-bold transition-colors ${isHit ? 'text-electric' : 'text-gray-200 group-hover:text-electric'}`}>{name}</span>
                    <span className="text-xs text-gray-500 font-mono">{level}% COV</span>
                </div>
                <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: bins }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`w-2 h-2 rounded-sm ${i < filledBins ? 'bg-success shadow-[0_0_5px_var(--color-success)]' : 'bg-gray-800'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SkillNode;
