/**
 * @file SignalPacket.tsx
 * @description Visual particle that traverses between two DOM elements.
 * Managed by the SignalContext system.
 * @module Components/Features
 * @author Mishat
 */
import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SignalType, TargetRegistry } from '../../context/SignalContext';

interface SignalPacketProps {
    signal: SignalType;
    targets: TargetRegistry;
    onHit: (id: string) => void;
}

const SignalPacket: React.FC<SignalPacketProps> = ({ signal, targets, onHit }) => {
    // Select random targets
    const skillTarget = useMemo(() => targets.skills[Math.floor(Math.random() * targets.skills.length)], []);
    const traceTarget = useMemo(() => targets.trace[Math.floor(Math.random() * targets.trace.length)], []);

    // Calculate positions relative to the entire document
    const getPos = (ref: React.RefObject<HTMLDivElement | null> | undefined) => {
        if (!ref || !ref.current) return { x: 0, y: 0 };
        const rect = ref.current.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + rect.height / 2 + window.scrollY
        };
    };

    const start = { x: signal.startX + window.scrollX, y: signal.startY + window.scrollY };
    const mid = getPos(skillTarget);
    const end = getPos(traceTarget);

    // If targets aren't mounted/found, just shoot down
    const safeMid = mid.y === 0 ? { x: start.x, y: start.y + 800 } : mid;
    const safeEnd = end.y === 0 ? { x: safeMid.x, y: safeMid.y + 800 } : end;

    // Trigger hits when animation reaches stages
    useEffect(() => {
        const t1 = setTimeout(() => {
            // Find index to create ID for hit
            if (skillTarget) {
                const idx = targets.skills.indexOf(skillTarget);
                if (idx !== -1) onHit(`skill-${idx}`);
            }
        }, 1000); // 1s to reach mid

        const t2 = setTimeout(() => {
            if (traceTarget) {
                const idx = targets.trace.indexOf(traceTarget);
                if (idx !== -1) onHit(`trace-${idx}`);
            }
        }, 2000); // 2s to reach end

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        <motion.div
            initial={{ left: start.x, top: start.y, opacity: 1, scale: 1 }}
            animate={{
                left: [start.x, safeMid.x, safeEnd.x],
                top: [start.y, safeMid.y, safeEnd.y],
                opacity: [1, 1, 0],
                scale: [1, 1, 0]
            }}
            transition={{
                duration: 2.5,
                times: [0, 0.4, 1], // 40% time to get to skills, rest to trace
                ease: "easeInOut"
            }}
            style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: signal.color,
                boxShadow: `0 0 15px ${signal.color}, 0 0 30px ${signal.color}`,
                zIndex: 100,
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)'
            }}
        />
    );
};

export default SignalPacket;
