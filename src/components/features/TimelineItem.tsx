/**
 * @file TimelineItem.tsx
 * @description An entry in the vertical experience timeline.
 * Registers as a signal target to receive "packets" from the skills section.
 * @module Components/Features
 * @author Mishat
 */
import React, { useRef, useEffect } from 'react';
import { useSignal } from '../../context/SignalContext';

const TimelineItem = ({ year, title, company, description, degree, index }: { year: string, title: string, company: string, description: string, degree?: string, index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { registerTarget, activeHits } = useSignal();
    const id = `trace-${index}`;

    useEffect(() => {
        registerTarget('trace', ref);
    }, []);

    const isHit = activeHits.has(id);

    return (
        <div ref={ref} className={`relative pl-8 pb-12 border-l-2 transition-all duration-500 group ${isHit ? 'border-electric' : 'border-gray-800 hover:border-pcbgold'}`}>
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-obsidian border-2 transition-all ${isHit ? 'border-electric bg-electric scale-125 shadow-[0_0_10px_var(--color-electric)]' : 'border-gray-600 group-hover:border-electric group-hover:bg-electric'}`} />
            <div className="flex flex-col gap-1">
                <span className={`font-mono text-sm transition-colors ${isHit ? 'text-electric' : 'text-electric'}`}>{year}</span>
                <h3 className={`text-xl font-bold transition-colors ${isHit ? 'text-electric' : 'text-white'}`}>{title} <span className="text-gray-400">@ {company}</span></h3>
                {degree && <div className="text-pcbgold font-mono text-xs">{degree}</div>}
                <p className="text-gray-400 max-w-lg mt-2 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

export default TimelineItem;
