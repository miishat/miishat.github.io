/**
 * @file SoCScene.tsx
 * @description 3D Visualization of the System-on-Chip (SoC).
 * Renders a stylized silicon die with interactive IP blocks using React Three Fiber.
 * 
 * @author Mishat
 */
import React, { useRef, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Float, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion-3d';

/**
 * TypeScript definitions for React Three Fiber (R3F) elements.
 * R3F dynamically creates these elements, so we must explicitly tell TS about them
 * to avoid "Property does not exist on type JSX.IntrinsicElements" errors.
 */
declare global {
    namespace JSX {
        interface IntrinsicElements {
            group: any;
            mesh: any;
            boxGeometry: any;
            meshStandardMaterial: any;
            planeGeometry: any;
            sphereGeometry: any;
            meshBasicMaterial: any;
            fog: any;
            ambientLight: any;
            pointLight: any;
        }
    }
}

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            group: any;
            mesh: any;
            boxGeometry: any;
            meshStandardMaterial: any;
            planeGeometry: any;
            meshBasicMaterial: any;
            fog: any;
            ambientLight: any;
            pointLight: any;
        }
    }
}

interface BlockProps {
    position: [number, number, number];
    size: [number, number, number];
    color: string;
    label: string;
    description: string;
    onClick: (label: string, desc: string) => void;
    hoverColor?: string;
}

/**
 * Represents a single functional block (IP) on the silicon die.
 * Interactive: Expands and glows on hover, displays a floating HTML label.
 */
const IPBlock = ({ position, size, color, label, description, onClick, hoverColor = '#00f3ff' }: BlockProps) => {
    const mesh = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.scale.y = hovered ? 1.2 : 1;
        }
    });

    return (
        <group position={new THREE.Vector3(...position)}>
            <mesh
                ref={mesh}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation();
                    onClick(label, description);
                }}
                onPointerOver={(e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation();
                    setHover(true);
                }}
                onPointerOut={() => {
                    setHover(false);
                }}
            >
                <boxGeometry args={[size[0], size[1], size[2]]} />
                <meshStandardMaterial
                    color={hovered ? hoverColor : color}
                    emissive={hovered ? hoverColor : '#000000'}
                    emissiveIntensity={hovered ? 0.5 : 0}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
            {hovered && (
                <Html position={[0, size[1] + 0.5, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                    <div className="flex flex-col items-center">
                        <div className="bg-black/95 border border-electric/80 px-4 py-2 rounded-lg shadow-[0_0_25px_rgba(0,243,255,0.4)] backdrop-blur-md">
                            <span className="text-electric font-bold font-mono text-sm whitespace-nowrap tracking-wide drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]">
                                {label}
                            </span>
                        </div>
                        {/* Pointer Triangle */}
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-electric/80 mt-[-1px]" />
                    </div>
                </Html>
            )}
        </group>
    );
};

/**
 * Rotating lights that orbit the chip in dark mode to highlight the pins.
 * Adds dynamic specular reflections to make details visible in low light.
 */
const ActivePinLights = () => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y -= 0.005;
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Cyan Light Source */}
            <pointLight position={[3.2, 0.5, 0]} intensity={3} distance={10} color="#00f3ff" decay={2} />
            {/* Purple Light Source */}
            <pointLight position={[-3.2, -0.5, 0]} intensity={3} distance={10} color="#b026ff" decay={2} />
        </group>
    );
};

/**
 * The main Processor Chip assembly.
 * Composed of:
 * - Substrate (Base layer)
 * - Die (Silicon layer)
 * - Pins (gold/silver connectors)
 * - IP Blocks (Interactive zones)
 * 
 * Rotates slowly to showcase 3D depth.
 */
const ProcessorChip = ({ onBlockSelect, isLightMode }: { onBlockSelect: (l: string, d: string) => void, isLightMode: boolean }) => {
    const chipRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (chipRef.current) {
            chipRef.current.rotation.y += 0.002;
        }
    });

    const baseColor = isLightMode ? '#cbd5e1' : '#1a1a1a';
    const dieColor = isLightMode ? '#64748b' : '#111';
    const pinColor = isLightMode ? '#475569' : '#d4af37';
    const blockColor1 = isLightMode ? '#475569' : '#333';
    const blockColor2 = isLightMode ? '#334155' : '#222';
    const hoverColor = isLightMode ? '#7c3aed' : '#00f3ff';

    return (
        <group ref={chipRef} rotation={[0.5, 0, 0]}>
            {/* Substrate */}
            <mesh position={[0, -0.2, 0]}>
                <boxGeometry args={[5, 0.2, 5]} />
                <meshStandardMaterial color={baseColor} roughness={0.8} />
            </mesh>

            {/* Die */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[3.5, 0.1, 3.5]} />
                <meshStandardMaterial color={dieColor} metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Pins */}
            {Array.from({ length: 40 }).map((_, i) => {
                const side = Math.floor(i / 10); // 0, 1, 2, 3
                const offset = (i % 10) * 0.5 - 2.25;
                let pos: [number, number, number] = [0, -0.2, 0];
                if (side === 0) pos = [offset, -0.2, 2.6];
                if (side === 1) pos = [offset, -0.2, -2.6];
                if (side === 2) pos = [2.6, -0.2, offset];
                if (side === 3) pos = [-2.6, -0.2, offset];

                return (
                    <mesh key={i} position={new THREE.Vector3(...pos)}>
                        <boxGeometry args={[0.1, 0.1, 0.4]} />
                        <meshStandardMaterial color={pinColor} metalness={1} roughness={0.3} />
                    </mesh>
                );
            })}

            {/* IP Blocks */}
            <IPBlock
                position={[-0.8, 0.2, -0.8]}
                size={[1.2, 0.2, 1.2]}
                color={blockColor1}
                label="AI Network Control"
                description="Traffic management & control logic for AI clusters."
                onClick={onBlockSelect}
                hoverColor={hoverColor}
            />
            <IPBlock
                position={[0.8, 0.2, -0.8]}
                size={[1.2, 0.2, 1.2]}
                color={blockColor1}
                label="CPU & Memory"
                description="Coherent mesh, L3 Cache & DDR controller verification."
                onClick={onBlockSelect}
                hoverColor={hoverColor}
            />
            <IPBlock
                position={[0, 0.2, 0.8]}
                size={[2.8, 0.15, 0.8]}
                color={blockColor2}
                label="SerDes & Ethernet"
                description="COMPHY bringups & High-Speed I/O verification."
                onClick={onBlockSelect}
                hoverColor={hoverColor}
            />

            {/* Interconnects (Visual only) */}
            <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3, 3]} />
                <meshBasicMaterial color={pinColor} wireframe opacity={0.1} transparent />
            </mesh>

            {/* Dynamic Pin Lights (Dark Mode Only) */}
            {!isLightMode && <ActivePinLights />}
        </group>
    );
};

/**
 * Main Scene Container.
 * Sets up the 3D environment:
 * - Canvas & Camera
 * - Lighting (Ambient + Dual Point Lights)
 * - Environment (Fog, Stars)
 * - Controls (Orbit, Floating animation)
 */
export default function SoCScene({ setTooltip, theme = 'default' }: { setTooltip: (t: string) => void, theme?: string }) {
    const isLightMode = theme === 'light';

    // Theme values - Matches CSS variable --color-obsidian (#f0f4f8)
    const fogColor = isLightMode ? '#f0f4f8' : '#050510';
    const ambientInt = isLightMode ? 0.8 : 0.5;
    const pointLightColor1 = isLightMode ? '#0ea5e9' : '#00f3ff';
    const pointLightColor2 = isLightMode ? '#6366f1' : '#b026ff';

    return (
        <div className="w-full h-full absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 5, 8], fov: 45 }}>
                <fog attach="fog" args={[fogColor, 5, 20]} />
                <ambientLight intensity={ambientInt} />
                <pointLight position={[10, 10, 10]} intensity={1} color={pointLightColor1} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} color={pointLightColor2} />

                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <group position={[0, 0.8, 0]}>
                        <ProcessorChip onBlockSelect={(l, d) => setTooltip(`${l}: ${d}`)} isLightMode={isLightMode} />
                    </group>
                </Float>

                {/* Only show stars in dark mode */}
                {!isLightMode && (
                    <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
                )}
                <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={0} />
            </Canvas>
        </div>
    );
}