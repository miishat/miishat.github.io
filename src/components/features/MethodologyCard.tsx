/**
 * @file MethodologyCard.tsx
 * @description Interactable card representing a verification methodology or philosophy.
 * @module Components/Features
 * @author Mishat
 */
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useSignal } from '../../context/SignalContext';

const MethodologyCard = ({ title, desc, icon: Icon, color, delay, colorHex }: { title: string, desc: string, icon: any, color: string, delay: number, colorHex: string }) => {
    const { emitSignal } = useSignal();
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (cardRef.current) {
            emitSignal(cardRef.current.getBoundingClientRect(), colorHex);
        }
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseEnter={handleMouseEnter}
            className="relative group p-6 rounded-2xl overflow-hidden cursor-crosshair h-full
                       bg-white/5 backdrop-blur-md
                       border border-white/10 hover:border-white/25
                       shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30
                       transition-all duration-300 hover:-translate-y-1"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
            }}
        >
            {/* Gradient accent bar */}
            <div
                className={`absolute top-0 left-0 w-1 h-full ${color} group-hover:w-1.5 transition-all duration-300`}
                style={{ boxShadow: `0 0 20px ${colorHex}40` }}
            />

            {/* Subtle gradient overlay on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${colorHex}15 0%, transparent 60%)`
                }}
            />

            <Icon className="w-8 h-8 mb-4 text-gray-300 group-hover:text-white transition-colors relative z-10" />
            <h3 className="text-lg font-bold text-gray-100 mb-2 font-mono relative z-10">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed relative z-10">{desc}</p>

            <div className="absolute -bottom-4 -right-4 opacity-0 group-hover:opacity-10 transition-opacity rotate-12 transform scale-150">
                <Icon size={100} />
            </div>
        </motion.div>
    );
}

export default MethodologyCard;
