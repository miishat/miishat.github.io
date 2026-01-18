/**
 * @file SignalContext.tsx
 * @description Context to manage the "Signal" visual effect system.
 * This system allows independent components to communicate visually by sending
 * "packets" (particles) between source and target elements on the screen.
 * 
 * @module Context/Signal
 * @author Mishat
 */
import React, { createContext, useContext } from 'react';

/**
 * Represents a single visual signal packet traveling across the screen.
 */
export type SignalType = {
    id: string;      // Unique identifier for the particle
    startX: number;  // Starting X coordinate (absolute)
    startY: number;  // Starting Y coordinate (absolute)
    color: string;   // Color of the particle
};

/**
 * Registry of DOM references for potential targets.
 * Components register themselves here so signals can "find" them.
 */
export type TargetRegistry = {
    skills: React.RefObject<HTMLDivElement | null>[];
    trace: React.RefObject<HTMLDivElement | null>[];
};

interface SignalContextType {
    /** Registers a DOM element as a potential target for signals */
    registerTarget: (type: 'skills' | 'trace', ref: React.RefObject<HTMLDivElement | null>) => void;
    /** Emits a new signal from a source rectangle */
    emitSignal: (rect: DOMRect, color: string) => void;
    /** Triggers a visual "hit" effect on a target ID */
    hitTarget: (id: string) => void;
    /** Set of currently "hit" target IDs (used for visual feedback like glowing) */
    activeHits: Set<string>;
}

/**
 * Context to manage the "Signal" visual effect system.
 * Allows components to register their position and emit/receive signal packets (particles).
 */
export const SignalContext = createContext<SignalContextType | null>(null);

/**
 * Hook to access the Signal System.
 * @throws {Error} if used outside of SignalProvider.
 */
export const useSignal = () => {
    const context = useContext(SignalContext);
    if (!context) throw new Error("useSignal must be used within SignalProvider");
    return context;
};
