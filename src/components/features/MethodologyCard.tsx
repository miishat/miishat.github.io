/**
 * @file MethodologyCard.tsx
 * @description Interactable card representing a verification methodology or philosophy.
 * @module Components/Features
 * @author Mishat
 */
import React, { useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { useSignal } from '../../context/SignalContext';

const MethodologyCard = ({ title, desc, icon: Icon, color, delay, colorHex }: { title: string, desc: string, icon: any, color: string, delay: number, colorHex: string }) => {
    const { emitSignal } = useSignal();
    const cardRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseEnter = () => {
        if (cardRef.current) {
            emitSignal(cardRef.current.getBoundingClientRect(), colorHex);
        }
    };

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            ref={cardRef}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            className="relative group p-6 border border-gray-800/50 bg-gray-900/20 backdrop-blur-md hover:bg-gray-800/40 transition-all duration-500 rounded-2xl overflow-hidden hover:border-gray-500 cursor-crosshair h-full"
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            400px circle at ${mouseX}px ${mouseY}px,
                            ${colorHex}15,
                            transparent 80%
                        )
                    `,
                }}
            />
            <motion.div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100 mix-blend-overlay"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            250px circle at ${mouseX}px ${mouseY}px,
                            ${colorHex}30,
                            transparent 80%
                        )
                    `,
                }}
            />
            
            <div className={`absolute top-0 left-0 w-1 h-full ${color} group-hover:w-2 transition-all`} />
            <Icon className="w-8 h-8 mb-4 text-gray-300 group-hover:text-white transition-colors relative z-10" />
            <h3 className="text-xl font-bold font-display tracking-tight text-gray-100 mb-2 relative z-10">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed relative z-10">{desc}</p>

            <div className="absolute -bottom-4 -right-4 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 rotate-12 transform scale-150 pointer-events-none">
                <Icon size={120} />
            </div>
        </motion.div>
    );
}

export default MethodologyCard;
