/**
 * @file VimGutter.tsx
 * @description Fixed position left gutter simulating a Vim editor.
 * Displays relative line numbers based on current scroll position.
 * @module Components/Layout
 * @author Mishat
 */
import React, { useState } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';

/**
 * A visual gutter on the left side simulating a Vim editor.
 * Shows relative line numbers based on the current scroll position.
 */
const VimGutter = () => {
    const [currentLine, setCurrentLine] = useState(0);
    const totalLines = 100;
    const { scrollYProgress } = useScroll();

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        setCurrentLine(Math.floor(latest * totalLines));
    });

    const windowSize = 25;
    const startLine = Math.max(0, currentLine - windowSize);

    return (
        <div className="fixed left-0 top-0 bottom-0 w-12 bg-obsidian/95 border-r border-gray-800 hidden lg:flex flex-col items-end py-[50vh] pr-2 text-gray-600 font-mono text-xs select-none z-40">
            {Array.from({ length: windowSize * 2 }).map((_, i) => {
                const lineNum = startLine + i;
                const relativeNum = Math.abs(lineNum - currentLine);
                if (lineNum < 0 || lineNum > totalLines) return null;

                return (
                    <div key={lineNum} className={`h-6 leading-6 w-full text-right transition-colors ${relativeNum === 0 ? 'text-electric font-bold' : 'text-gray-700'}`}>
                        {relativeNum === 0 ? currentLine : relativeNum}
                    </div>
                );
            })}
        </div>
    );
};

export default VimGutter;
