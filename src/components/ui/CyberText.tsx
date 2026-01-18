/**
 * @file CyberText.tsx
 * @description A text component that performs a "decoding" animation on mount and hover.
 * Scrambles characters randomly before settling on the final text.
 * @module Components/UI
 * @author Mishat
 */
import React, { useState, useEffect } from 'react';

/**
 * Text component that scrambles its characters on mount and hover.
 * Adds a "glitch" aesthetic.
 */
const CyberText = ({ text }: { text: string }) => {
    const [displayText, setDisplayText] = useState(text);
    const chars = "X01";

    const scramble = () => {
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplayText(prev =>
                prev.split("").map((letter, index) => {
                    if (index < iterations) {
                        return text[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join("")
            );

            if (iterations >= text.length) {
                clearInterval(interval);
            }
            iterations += 1 / 8;
        }, 50);
    };

    useEffect(() => {
        scramble();
    }, []);

    return (
        <div
            className="relative group cursor-default inline-block"
            onMouseEnter={scramble}
        >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 glow-text relative z-10 mix-blend-screen text-white">
                {displayText}
            </h1>
            <h1 className="absolute top-0 left-0 text-6xl md:text-8xl font-black tracking-tighter mb-4 text-red-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-[4px] transition-all duration-75 -z-10 mix-blend-screen select-none pointer-events-none">
                {text}
            </h1>
            <h1 className="absolute top-0 left-0 text-6xl md:text-8xl font-black tracking-tighter mb-4 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-[4px] transition-all duration-75 -z-10 mix-blend-screen select-none pointer-events-none">
                {text}
            </h1>
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity" />
        </div>
    );
};

export default CyberText;
