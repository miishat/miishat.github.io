/**
 * @file CustomCursor.tsx
 * @description Renders a custom hardware-probe style cursor that replaces the default pointer.
 * @module Components/UI
 * @author Mishat
 */
import React, { useState, useEffect } from 'react';

/**
 * Custom hardware-probe style cursor (crosshair) that replaces the default pointer.
 * Only visible on non-touch devices.
 */
const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            setIsVisible(true);
        };

        // Hide default cursor
        document.body.style.cursor = 'none';

        window.addEventListener('mousemove', updateMousePosition);
        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
            document.body.style.cursor = 'auto';
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className="fixed pointer-events-none z-[100] hidden md:block mix-blend-difference"
            style={{ left: mousePosition.x, top: mousePosition.y }}
        >
            {/* Crosshair */}
            <div className="absolute -left-4 -top-[1px] w-8 h-[2px] bg-electric" />
            <div className="absolute -left-[1px] -top-4 w-[2px] h-8 bg-electric" />
        </div>
    );
};

export default CustomCursor;
