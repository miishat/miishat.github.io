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
            className="relative group p-6 border border-gray-800 bg-gray-900/40 hover:bg-gray-800/80 transition-all duration-300 rounded-xl overflow-hidden hover:border-gray-600 cursor-crosshair h-full"
        >
            <div className={`absolute top-0 left-0 w-1 h-full ${color} group-hover:w-2 transition-all`} />
            <Icon className="w-8 h-8 mb-4 text-gray-300 group-hover:text-white transition-colors" />
            <h3 className="text-lg font-bold text-gray-100 mb-2 font-mono">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>

            <div className="absolute -bottom-4 -right-4 opacity-0 group-hover:opacity-10 transition-opacity rotate-12 transform scale-150">
                <Icon size={100} />
            </div>
        </motion.div>
    );
}

export default MethodologyCard;
