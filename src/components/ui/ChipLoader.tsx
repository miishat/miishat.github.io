/**
 * @file ChipLoader.tsx
 * @description A premium animated chip loader for the 3D scene loading state.
 * Features an animated chip outline with scanning effects and pulsing pins.
 */
import React from 'react';
import { motion } from 'framer-motion';

const ChipLoader = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-obsidian/50">
            <div className="relative w-48 h-48">
                {/* Outer glow */}
                <motion.div
                    className="absolute inset-0 rounded-lg"
                    style={{
                        background: 'radial-gradient(circle, rgba(0, 243, 255, 0.1) 0%, transparent 70%)',
                    }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Main chip body */}
                <div className="absolute inset-8 border-2 border-electric/40 rounded-sm bg-gray-900/80 backdrop-blur-sm">
                    {/* Inner die */}
                    <div className="absolute inset-3 border border-electric/60 rounded-sm">
                        {/* Circuit pattern grid */}
                        <div className="absolute inset-0 opacity-30">
                            <div className="grid grid-cols-3 grid-rows-3 h-full w-full gap-0.5 p-1">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="bg-electric/20 border border-electric/30"
                                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.15,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Scanning line */}
                        <motion.div
                            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-electric to-transparent"
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                    </div>

                    {/* Center processor symbol */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            className="w-6 h-6 border-2 border-electric rounded-sm"
                            animate={{
                                scale: [1, 1.1, 1],
                                borderColor: ['#00f3ff', '#b026ff', '#00f3ff'],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </div>

                {/* Pins - Top */}
                <div className="absolute top-5 left-10 right-10 flex justify-between">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                            key={`top-${i}`}
                            className="w-1.5 h-3 bg-pcbgold/70 rounded-t-sm"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.1,
                            }}
                        />
                    ))}
                </div>

                {/* Pins - Bottom */}
                <div className="absolute bottom-5 left-10 right-10 flex justify-between">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                            key={`bottom-${i}`}
                            className="w-1.5 h-3 bg-pcbgold/70 rounded-b-sm"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: (6 - i) * 0.1,
                            }}
                        />
                    ))}
                </div>

                {/* Pins - Left */}
                <div className="absolute left-5 top-10 bottom-10 flex flex-col justify-between">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                            key={`left-${i}`}
                            className="w-3 h-1.5 bg-pcbgold/70 rounded-l-sm"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.1 + 0.3,
                            }}
                        />
                    ))}
                </div>

                {/* Pins - Right */}
                <div className="absolute right-5 top-10 bottom-10 flex flex-col justify-between">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                            key={`right-${i}`}
                            className="w-3 h-1.5 bg-pcbgold/70 rounded-r-sm"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: (6 - i) * 0.1 + 0.3,
                            }}
                        />
                    ))}
                </div>

                {/* Loading text */}
                <motion.div
                    className="absolute -bottom-10 left-0 right-0 text-center"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <span className="text-electric font-mono text-xs tracking-widest">
                        INITIALIZING 3D KERNEL
                    </span>
                    <motion.span
                        className="text-electric font-mono text-xs"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        ...
                    </motion.span>
                </motion.div>
            </div>
        </div>
    );
};

export default ChipLoader;
