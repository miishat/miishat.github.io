/**
 * @file ScrollCue.tsx
 * @description The scroll cue under the hero: "SCROLL" over a short wire that fades out
 * downward, with a packet travelling down it, like the signal handing off to the next
 * section. Clicking scrolls one screen down.
 * @module Components/UI
 * @author Mishat
 */
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import MagneticWrapper from './MagneticWrapper';

const WIRE_HEIGHT = 56; // px

const ScrollCue = () => {
    const reduceMotion = useReducedMotion();
    return (
        <button
            type="button"
            aria-label="Scroll to the next section"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto cursor-pointer"
        >
            <MagneticWrapper>
                <span className="group flex flex-col items-center gap-2">
                    <span className="font-mono text-[10px] tracking-[0.35em] text-gray-500 group-hover:text-electric transition-colors">SCROLL</span>
                    <span className="relative block w-px" style={{ height: WIRE_HEIGHT }}>
                        {/* The wire, in the theme's accent, fading out toward the next section */}
                        <span className="absolute inset-0 opacity-50" style={{ background: 'linear-gradient(to bottom, var(--color-electric), transparent)' }} />
                        <motion.span
                            className="absolute -left-[3px] top-0 w-[7px] h-[7px] rounded-full bg-electric"
                            style={{ boxShadow: '0 0 10px var(--color-electric)' }}
                            animate={reduceMotion ? { y: WIRE_HEIGHT / 2 - 3 } : { y: [-6, WIRE_HEIGHT + 2], opacity: [0, 1, 1, 0] }}
                            transition={reduceMotion ? { duration: 0 } : { duration: 1.8, ease: 'easeIn', repeat: Infinity, times: [0, 0.15, 0.85, 1] }}
                        />
                    </span>
                </span>
            </MagneticWrapper>
        </button>
    );
};

export default ScrollCue;
