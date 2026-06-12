import React from 'react';
import { motion } from 'framer-motion';

interface ConstructionTapeProps {
    text?: string;
}

export default function ConstructionTape({ text = "WORK IN PROGRESS 🚧" }: ConstructionTapeProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -50, rotate: 45 }}
            animate={{ opacity: 1, y: 0, rotate: 45 }}
            exit={{ opacity: 0, y: -50, rotate: 45 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            className="fixed top-12 -right-16 z-[200] pointer-events-none select-none shadow-2xl"
            style={{ width: '300px' }}
        >
            <div className="bg-yellow-400 text-black font-black uppercase tracking-widest text-sm py-2 px-8 flex items-center justify-center space-x-2 border-y-4 border-black overflow-hidden relative shadow-lg">
                {/* Diagonal striping background */}
                <div 
                    className="absolute inset-0 opacity-20 pointer-events-none" 
                    style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)`
                    }}
                />
                
                {/* Marquee or static text */}
                <span className="relative z-10 whitespace-nowrap font-mono flex gap-6 text-base font-bold items-center">
                    <span className="bg-yellow-400 px-3 py-1 shadow-sm border border-yellow-500 rounded-sm">{text}</span>
                    <span className="bg-yellow-400 px-3 py-1 shadow-sm border border-yellow-500 rounded-sm">{text}</span>
                    <span className="bg-yellow-400 px-3 py-1 shadow-sm border border-yellow-500 rounded-sm">{text}</span>
                </span>
            </div>
        </motion.div>
    );
}
