/**
 * @file MagneticWrapper.tsx
 * @description A wrapper component that creates a "magnetic" pull effect.
 * The child element moves towards the mouse cursor when hovered.
 * @module Components/UI
 * @author Mishat
 */
import React, { useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';

/**
 * A wrapper that applies a magnetic pull effect to its children when hovered.
 * Uses Framer Motion spring physics for smooth return-to-center.
 */
const MagneticWrapper = ({ children, strength = 0.5 }: { children: React.ReactNode, strength?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const position = { x: useMotionValue(0), y: useMotionValue(0) };

    const handleMouse = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current!.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        position.x.set(middleX * strength);
        position.y.set(middleY * strength);
    };

    const reset = () => {
        position.x.set(0);
        position.y.set(0);
    };

    const { x, y } = position;
    return (
        <motion.div
            style={{ x, y }}
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        >
            {children}
        </motion.div>
    );
};

export default MagneticWrapper;
