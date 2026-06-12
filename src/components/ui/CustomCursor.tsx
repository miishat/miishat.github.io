/**
 * @file CustomCursor.tsx
 * @description Renders a custom hardware-probe style cursor that replaces the default pointer.
 * @module Components/UI
 * @author Mishat
 */
import React, { useState, useEffect, useRef } from 'react';

/**
 * Custom hardware-probe style cursor (crosshair) that replaces the default pointer.
 * Optimized to bypass React state on mousemove for zero-lag tracking.
 */
const CustomCursor = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Accessibility: Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const onMouseMove = (e: MouseEvent) => {
            if (!isVisible) setIsVisible(true);
            if (cursorRef.current) {
                // Use transform instead of left/top for better performance
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
        };

        // Hide default cursor
        document.body.style.cursor = 'none';

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            document.body.style.cursor = 'auto';
        };
    }, [isVisible]);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

    return (
        <div
            ref={cursorRef}
            className={`fixed top-0 left-0 pointer-events-none z-[100] hidden md:block mix-blend-difference will-change-transform ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Crosshair */}
            <div className="absolute -left-4 -top-[1px] w-8 h-[2px] bg-electric" />
            <div className="absolute -left-[1px] -top-4 w-[2px] h-8 bg-electric" />
        </div>
    );
};

export default CustomCursor;
