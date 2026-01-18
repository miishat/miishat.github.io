/**
 * @file index.tsx
 * @description Main entry point for the Portfolio Application.
 * Orchestrates the full-page layout, initializes the theme, and manages the global signal visual system.
 * 
 * @author Mishat
 */
import React, { useState, useRef, useEffect, createContext, useContext, useMemo, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, useScroll, useMotionValueEvent, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Cpu, Zap, Layers, Activity, ChevronDown, CheckCircle2, GitBranch, Terminal as TerminalIcon, Shield, FileCode, Dices, Network, ArrowRightLeft, Play, List, MousePointer2 } from 'lucide-react';
import SoCScene from './SoCScene.tsx';
import Terminal from './TerminalComponent.tsx';

// --- Signal System Context & Types ---

type SignalType = {
    id: string;
    startX: number;
    startY: number;
    color: string;
};

type TargetRegistry = {
    skills: React.RefObject<HTMLDivElement | null>[];
    trace: React.RefObject<HTMLDivElement | null>[];
};

/**
 * Context to manage the "Signal" visual effect system.
 * Allows components to register their position and emit/receive signal packets (particles).
 */
const SignalContext = createContext<{
    registerTarget: (type: 'skills' | 'trace', ref: React.RefObject<HTMLDivElement | null>) => void;
    emitSignal: (rect: DOMRect, color: string) => void;
    hitTarget: (id: string) => void;
    activeHits: Set<string>;
} | null>(null);

const useSignal = () => {
    const context = useContext(SignalContext);
    if (!context) throw new Error("useSignal must be used within SignalProvider");
    return context;
};

// --- Utilities ---

const toHex = (num: number) => num.toString(16).toUpperCase().padStart(4, '0');

// --- Data ---

const TRACE_DATA = [
    {
        id: 0,
        start: 2025.41, // May 2025
        end: 2026.0,   // Present
        title: "Senior Design Verification Engineer",
        company: "Marvell Technology",
        school: "",
        degree: "",
        description: "Leading advanced verification strategies for next-generation silicon. Specializing in AI Network Control and COMPHY (SerDes). Architecting reusable UVM components and overseeing full-chip regression sign-off.",
        type: "WORK",
        stateCode: "4'h3"
    },
    {
        id: 1,
        start: 2023.41, // June 2023
        end: 2025.41,   // May 2025
        title: "Design Verification Engineer",
        company: "Marvell Technology",
        school: "",
        degree: "",
        description: "Designed and implemented comprehensive testbenches for SoC blocks including Ethernet controllers. Achieved 100% code and functional coverage on critical IP. Collaborated with design teams to debug complex logic failures.",
        type: "WORK",
        stateCode: "4'h2"
    },
    {
        id: 2,
        start: 2022.66, // Sept 2022
        end: 2023.16,   // Mar 2023
        title: "Design Verification Engineer Intern",
        company: "Marvell Technology",
        school: "",
        degree: "",
        description: "Contributed to the validation of high-speed I/O subsystems. Developed Python scripts to automate regression analysis and improve simulation efficiency.",
        type: "INTERN",
        stateCode: "4'h1"
    },
    {
        id: 3,
        start: 2017.66, // Sept 2017
        end: 2023.25,    // April 2023
        title: "Engineering Student",
        company: "",
        school: "Memorial University of Newfoundland",
        degree: "B.Eng. Electrical Engineering",
        description: "Specialized in Digital Systems and Integrated Circuits. Capstone project focused on FPGA-based hardware acceleration.",
        type: "EDU",
        stateCode: "4'h0"
    }
];

// --- Visual Components ---

/**
 * Simulates a hardware bootup sequence with scrolling log text.
 * Blocks the main UI until the "boot" is complete.
 */
const BootSequence = ({ onComplete }: { onComplete: () => void }) => {
    const [lines, setLines] = useState<string[]>([]);

    const bootLog = [
        "BIOS_REV 4.09.23 // CHECKING PERIPHERALS...",
        "DETECTED: CPU [ARM Cortex-A78]",
        "DETECTED: GPU [Mali-G710]",
        "LOADING MEMORY MAP... 0xFFFF_FFFF OK",
        "INITIALIZING UVM PHASES...",
        " > build_phase... DONE",
        " > connect_phase... DONE",
        " > elaboration_phase... DONE",
        "STARTING SIMULATION...",
        "LOADING PORTFOLIO V2.0..."
    ];

    useEffect(() => {
        let delay = 0;
        bootLog.forEach((line, index) => {
            delay += Math.random() * 300 + 100;
            setTimeout(() => {
                setLines(prev => [...prev, line]);
                if (index === bootLog.length - 1) {
                    setTimeout(onComplete, 800);
                }
            }, delay);
        });
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-end pb-12 pl-12 font-mono text-sm md:text-base">
            {lines.map((line, i) => (
                <div key={i} className="text-electric mb-1">
                    <span className="text-gray-500 mr-4">[{toHex(i * 128)}]</span>
                    {line}
                </div>
            ))}
            <div className="text-electric animate-pulse mt-2">_</div>
        </div>
    );
};

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

/**
 * Standard section header with a magnetic icon and a "decoding" text effect on hover.
 */
const SectionHeader = ({ icon: Icon, title, subtitle, className = "mb-12" }: { icon: any, title: string, subtitle: string, className?: string }) => {
    // Decode effect on view
    const [displayTitle, setDisplayTitle] = useState(title);

    return (
        <div className={`flex items-start gap-6 relative z-10 group ${className}`}>
            <MagneticWrapper strength={0.3}>
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800 text-electric relative z-20 group-hover:border-electric transition-colors duration-500 shadow-[0_0_0_rgba(0,243,255,0)] group-hover:shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                    <Icon size={32} />
                </div>
            </MagneticWrapper>
            <div>
                <h2
                    className="text-4xl font-bold text-white mb-2 relative"
                    onMouseEnter={() => {
                        // Quick scramble effect
                        let iter = 0;
                        const interval = setInterval(() => {
                            setDisplayTitle(title.split("").map((l, i) => {
                                if (i < iter) return title[i];
                                return "ABCDEF0123456789"[Math.floor(Math.random() * 16)];
                            }).join(""));
                            if (iter >= title.length) clearInterval(interval);
                            iter += 0.35;
                        }, 30);
                    }}
                >
                    {displayTitle}
                </h2>
                <p className="text-gray-400 font-mono text-sm border-l-2 border-transparent pl-2 group-hover:border-electric transition-all duration-300">
                    {subtitle}
                </p>
            </div>
        </div>
    )
};

const Section = ({ children, className = "", id = "" }: { children?: React.ReactNode; className?: string; id?: string }) => (
    <section id={id} className={`min-h-screen relative flex flex-col justify-center items-center p-8 pl-16 lg:pl-24 ${className}`}>
        {children}
    </section>
);

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

// --- Updated Components participating in Signal System ---

/**
 * Represents a specific skill in the coverage dashboard.
 * Registers itself as a target for the Signal System.
 */
const SkillNode = ({ name, level, index }: { name: string; level: number; index: number }) => {
    const bins = 16;
    const filledBins = Math.floor((level / 100) * bins);
    const ref = useRef<HTMLDivElement>(null);
    const { registerTarget, activeHits } = useSignal();
    const id = `skill-${index}`;

    useEffect(() => {
        registerTarget('skills', ref);
    }, []);

    const isHit = activeHits.has(id);

    return (
        <div ref={ref} className="relative z-10 transition-transform duration-200" style={{ transform: isHit ? 'scale(1.05)' : 'scale(1)' }}>
            <div className={`flex flex-col gap-2 p-4 border transition-all duration-300 bg-obsidian/80 backdrop-blur-sm rounded-lg group relative overflow-hidden ${isHit ? 'border-electric shadow-[0_0_20px_rgba(0,243,255,0.3)]' : 'border-gray-800 hover:border-electric'}`}>
                <div className="absolute top-0 right-0 p-1">
                    <div className={`w-1 h-1 rounded-full transition-colors ${isHit ? 'bg-electric' : 'bg-gray-600 group-hover:bg-electric'}`} />
                </div>
                <div className="flex justify-between items-center mb-1">
                    <span className={`font-mono font-bold transition-colors ${isHit ? 'text-electric' : 'text-gray-200 group-hover:text-electric'}`}>{name}</span>
                    <span className="text-xs text-gray-500 font-mono">{level}% COV</span>
                </div>
                <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: bins }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`w-2 h-2 rounded-sm ${i < filledBins ? 'bg-success shadow-[0_0_5px_var(--color-success)]' : 'bg-gray-800'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

const TimelineItem = ({ year, title, company, description, degree, index }: { year: string, title: string, company: string, description: string, degree?: string, index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { registerTarget, activeHits } = useSignal();
    const id = `trace-${index}`;

    useEffect(() => {
        registerTarget('trace', ref);
    }, []);

    const isHit = activeHits.has(id);

    return (
        <div ref={ref} className={`relative pl-8 pb-12 border-l-2 transition-all duration-500 group ${isHit ? 'border-electric' : 'border-gray-800 hover:border-pcbgold'}`}>
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-obsidian border-2 transition-all ${isHit ? 'border-electric bg-electric scale-125 shadow-[0_0_10px_var(--color-electric)]' : 'border-gray-600 group-hover:border-electric group-hover:bg-electric'}`} />
            <div className="flex flex-col gap-1">
                <span className={`font-mono text-sm transition-colors ${isHit ? 'text-electric' : 'text-electric'}`}>{year}</span>
                <h3 className={`text-xl font-bold transition-colors ${isHit ? 'text-electric' : 'text-white'}`}>{title} <span className="text-gray-400">@ {company}</span></h3>
                {degree && <div className="text-pcbgold font-mono text-xs">{degree}</div>}
                <p className="text-gray-400 max-w-lg mt-2 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

// --- Waveform Viewer Component ---

/**
 * Interactive Waveform Viewer (simulating GTKWave).
 * Renders digital signals (CLK, RST, BUS) using SVG paths and div blocks.
 * Supports zooming (visual only) and time cursor navigation.
 */
const WaveformViewer = ({ theme }: { theme: 'default' | 'silicon' | 'light' }) => {
    const [cursorTime, setCursorTime] = useState<number>(2026.0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Config
    const startYear = 2017;
    const endYear = 2026;
    const duration = endYear - startYear;

    // Active Data based on cursor
    const activeData = TRACE_DATA.find(d => cursorTime >= d.start && cursorTime < d.end) || TRACE_DATA[0];

    // Theme Colors
    const isLight = theme === 'light';
    const c = {
        clk: isLight ? "text-green-700" : "text-green-500",
        clkStroke: isLight ? "#15803d" : "#00ff41", // green-700 vs neon green
        rst: "text-red-500",
        state: isLight ? "text-yellow-600" : "text-yellow-500",
        stateBorder: isLight ? "border-yellow-600/50" : "border-yellow-500/50",
        stateBg: isLight ? "bg-yellow-600/10" : "bg-yellow-500/10",
        stateText: isLight ? "text-yellow-600/80" : "text-yellow-500/50",

        company: isLight ? "text-blue-700" : "text-electric", // Electric is cyan, usually maps to blue-400/500 style in dark
        companyBorder: isLight ? "border-blue-700/50" : "border-electric/50",
        companyBg: isLight ? "bg-blue-700/10" : "bg-electric/10",
        companyText: isLight ? "text-blue-700/80" : "text-electric/80",
        companySkew: isLight ? "bg-blue-700/5" : "bg-electric/5",

        school: isLight ? "text-sky-600" : "text-blue-400",
        schoolBorder: isLight ? "border-sky-600/50" : "border-blue-500/50", // was blue-500 in original
        schoolBg: isLight ? "bg-sky-600/10" : "bg-blue-500/10",
        schoolText: isLight ? "text-sky-600/80" : "text-blue-400/80",
        schoolSkew: isLight ? "bg-sky-600/5" : "bg-blue-500/5",

        degree: isLight ? "text-orange-600" : "text-orange-400",
        degreeBorder: isLight ? "border-orange-600/50" : "border-orange-500/50",
        degreeBg: isLight ? "bg-orange-600/10" : "bg-orange-500/10",
        degreeText: isLight ? "text-orange-600/80" : "text-orange-400/80",
        degreeSkew: isLight ? "bg-orange-600/5" : "bg-orange-500/5",

        role: isLight ? "text-purple-700" : "text-purple-400",
        roleBorder: isLight ? "border-purple-700/50" : "border-purple-500/50",
        roleBg: isLight ? "bg-purple-700/10" : "bg-purple-500/10",
        roleText: isLight ? "text-purple-700/80" : "text-purple-400/80",

        eduRole: isLight ? "text-gray-600" : "text-gray-300",
        eduBorder: isLight ? "border-gray-500/50" : "border-gray-600/30",
        eduBg: isLight ? "bg-gray-800" : "bg-gray-700"
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const pct = Math.max(0, Math.min(1, x / width));
        setCursorTime(startYear + pct * duration);
    };

    const getX = (year: number) => {
        return `${((year - startYear) / duration) * 100}%`;
    };

    // Generate Clock Pulses
    const clockCycles = 50;
    const clockPath = `M 0 10 ` + Array.from({ length: clockCycles }).map((_, i) => {
        const x1 = (i / clockCycles) * 100;
        const x2 = ((i + 0.5) / clockCycles) * 100;
        const x3 = ((i + 1) / clockCycles) * 100;
        return `L ${x1} 0 L ${x2} 0 L ${x2} 24 L ${x3} 24`;
    }).join(" ");

    return (
        <div className="w-full bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col font-mono text-xs select-none shadow-2xl">
            {/* Toolbar */}
            <div className="bg-gray-800 p-2 flex justify-between items-center border-b border-gray-700">
                <div className="flex gap-4">
                    <span className="text-electric font-bold">GTKWave v3.3.104</span>
                    <span className="text-gray-400">Cursor: {cursorTime.toFixed(2)} YR</span>
                </div>
                <div className="flex gap-2">
                    <div className="px-2 py-0.5 bg-black rounded text-green-400 border border-green-900">ZOOM: 100%</div>
                </div>
            </div>

            <div className="flex h-[500px]">
                {/* Signals List (Sidebar) */}
                <div className="w-56 md:w-80 bg-black border-r border-gray-800 flex flex-col shrink-0">
                    <div className="h-10 border-b border-gray-800 flex items-center px-2 text-gray-500 bg-gray-900/50">Signals</div>
                    <SignalRow name="sys_clk" color={c.clk} value="1" />
                    <SignalRow name="rst_n" color={c.rst} value="1" />
                    <SignalRow name="state[3:0]" color={c.state} value={activeData.stateCode} />
                    <SignalRow name="company_bus" color={c.company} value={activeData.company.substring(0, 16) + (activeData.company.length > 16 ? "..." : "")} isBus />
                    <SignalRow name="school_bus" color={c.school} value={activeData.school.substring(0, 16) + (activeData.school.length > 16 ? "..." : "")} isBus />
                    <SignalRow name="degree" color={c.degree} value={activeData.degree.substring(0, 16) + (activeData.degree.length > 16 ? "..." : "")} isBus />
                    <SignalRow name="role_bus" color={c.role} value={activeData.title.substring(0, 16) + (activeData.title.length > 16 ? "..." : "")} isBus />

                    {/* Active Transaction Detail Panel (in sidebar for mobile, or distinct area) */}
                    {/* Active Transaction Detail Panel */}
                    <div className="p-4 bg-gray-900/20 h-48 flex flex-col justify-start">
                        <div className="text-gray-500 mb-1 text-[10px] uppercase tracking-wider">Transaction Detail</div>
                        <div className={`${c.role} font-bold mb-0.5 truncate`}>{activeData.title}</div>
                        <div className={`${c.company} mb-0.5 truncate`}>{activeData.company}</div>
                        <div className={`${c.school} mb-0.5 truncate`}>{activeData.school}</div>
                        <div className={`${c.degree} truncate`}>{activeData.degree}</div>
                    </div>
                </div>

                {/* Waveform Canvas */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-obsidian relative overflow-hidden cursor-crosshair group"
                    onMouseMove={handleMouseMove}
                >
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex-1 border-r border-white/5 h-full relative">
                                <span className="absolute bottom-1 right-1 text-gray-700 text-[10px] opacity-70">{startYear + i + 1}</span>
                            </div>
                        ))}
                    </div>

                    {/* Cursor Line */}
                    <div
                        className="absolute top-0 bottom-0 w-px bg-yellow-500 z-20 pointer-events-none group-hover:opacity-100 opacity-50"
                        style={{ left: getX(cursorTime) }}
                    >
                        <div className="absolute -top-4 -left-8 bg-yellow-500 text-black px-1 rounded text-[10px] whitespace-nowrap">
                            t = {cursorTime.toFixed(2)}
                        </div>
                    </div>

                    {/* Signals Rendering - Matches Sidebar Height h-10 */}
                    <div className="pt-10 flex flex-col gap-0">
                        {/* CLK */}
                        <div className="h-10 relative border-b border-white/5 w-full">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 24">
                                <path d={clockPath} fill="none" stroke={c.clkStroke} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                            </svg>
                        </div>
                        {/* RST */}
                        <div className="h-10 relative border-b border-white/5 w-full flex items-center">
                            <div className="w-full h-px bg-red-500" />
                        </div>
                        {/* STATE */}
                        <div className="h-10 relative border-b border-white/5 w-full">
                            {TRACE_DATA.map((d, i) => (
                                <div
                                    key={i}
                                    className={`absolute h-6 top-2 border flex items-center justify-center overflow-hidden ${c.stateBorder} ${c.stateBg}`}
                                    style={{
                                        left: getX(d.start),
                                        width: `${((d.end - d.start) / duration) * 100}%`
                                    }}
                                >
                                    <span className={`${c.stateText} text-[10px]`}>{d.stateCode}</span>
                                </div>
                            ))}
                        </div>
                        {/* COMPANY BUS */}
                        <div className="h-10 relative border-b border-white/5 w-full">
                            {TRACE_DATA.map((d, i) => d.company ? (
                                <div
                                    key={i}
                                    className={`absolute h-6 top-2 border flex items-center justify-center overflow-hidden px-1 ${c.companyBorder} ${c.companyBg}`}
                                    style={{
                                        left: getX(d.start),
                                        width: `${((d.end - d.start) / duration) * 100}%`
                                    }}
                                >
                                    <div className={`absolute inset-0 skew-x-12 ${c.companySkew}`} />
                                    <span className={`${c.companyText} z-10 truncate`}>{d.company}</span>
                                </div>
                            ) : null)}
                        </div>
                        {/* SCHOOL BUS */}
                        <div className="h-10 relative border-b border-white/5 w-full">
                            {TRACE_DATA.map((d, i) => d.school ? (
                                <div
                                    key={i}
                                    className={`absolute h-6 top-2 border flex items-center justify-center overflow-hidden px-1 ${c.schoolBorder} ${c.schoolBg}`}
                                    style={{
                                        left: getX(d.start),
                                        width: `${((d.end - d.start) / duration) * 100}%`
                                    }}
                                >
                                    <div className={`absolute inset-0 skew-x-12 ${c.schoolSkew}`} />
                                    <span className={`${c.schoolText} z-10 truncate`}>{d.school}</span>
                                </div>
                            ) : null)}
                        </div>
                        {/* DEGREE BUS */}
                        <div className="h-10 relative border-b border-white/5 w-full">
                            {TRACE_DATA.map((d, i) => d.degree ? (
                                <div
                                    key={i}
                                    className={`absolute h-6 top-2 border flex items-center justify-center overflow-hidden px-1 ${c.degreeBorder} ${c.degreeBg}`}
                                    style={{
                                        left: getX(d.start),
                                        width: `${((d.end - d.start) / duration) * 100}%`
                                    }}
                                >
                                    <div className={`absolute inset-0 skew-x-12 ${c.degreeSkew}`} />
                                    <span className={`${c.degreeText} z-10 truncate`}>{d.degree}</span>
                                </div>
                            ) : null)}
                        </div>
                        {/* ROLE BUS */}
                        <div className="h-10 relative border-b border-white/5 w-full">
                            {/* Render Work/Intern items last to be on top */}
                            {TRACE_DATA.slice().sort((a, b) => a.type === 'EDU' ? -1 : 1).map((d, i) => (
                                <div
                                    key={i}
                                    className={`absolute h-6 top-2 border bg-opacity-10 flex items-center justify-center overflow-hidden px-1 ${d.type === 'EDU' ? `${c.eduBorder} ${c.eduBg} z-0` : `${c.roleBorder} ${c.roleBg} z-10`}`}
                                    style={{
                                        left: getX(d.start),
                                        width: `${((d.end - d.start) / duration) * 100}%`
                                    }}
                                >
                                    <span className={`${d.type === 'EDU' ? c.eduRole : c.roleText} z-10 truncate`}>{d.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

const SignalRow = ({ name, color, value, isBus = false }: { name: string, color: string, value: string, isBus?: boolean }) => (
    <div className="h-10 border-b border-gray-800 flex items-center px-4 justify-between text-[10px] md:text-xs hover:bg-gray-900 transition-colors">
        <span className={`${color} font-mono`}>{name}</span>
        <span className={`text-gray-400 font-mono ${isBus ? 'bg-gray-800 px-1 rounded' : ''}`}>
            {isBus ? `= ${value}` : value}
        </span>
    </div>
);


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

// --- Signal Overlay & Provider ---

interface SignalPacketProps {
    signal: SignalType;
    targets: TargetRegistry;
    onHit: (id: string) => void;
}

const SignalPacket: React.FC<SignalPacketProps> = ({ signal, targets, onHit }) => {
    // Select random targets
    const skillTarget = useMemo(() => targets.skills[Math.floor(Math.random() * targets.skills.length)], []);
    const traceTarget = useMemo(() => targets.trace[Math.floor(Math.random() * targets.trace.length)], []);

    // Calculate positions relative to the entire document
    const getPos = (ref: React.RefObject<HTMLDivElement | null> | undefined) => {
        if (!ref || !ref.current) return { x: 0, y: 0 };
        const rect = ref.current.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + rect.height / 2 + window.scrollY
        };
    };

    const start = { x: signal.startX + window.scrollX, y: signal.startY + window.scrollY };
    const mid = getPos(skillTarget);
    const end = getPos(traceTarget);

    // If targets aren't mounted/found, just shoot down
    const safeMid = mid.y === 0 ? { x: start.x, y: start.y + 800 } : mid;
    const safeEnd = end.y === 0 ? { x: safeMid.x, y: safeMid.y + 800 } : end;

    // Trigger hits when animation reaches stages
    useEffect(() => {
        const t1 = setTimeout(() => {
            // Find index to create ID for hit
            if (skillTarget) {
                const idx = targets.skills.indexOf(skillTarget);
                if (idx !== -1) onHit(`skill-${idx}`);
            }
        }, 1000); // 1s to reach mid

        const t2 = setTimeout(() => {
            if (traceTarget) {
                const idx = targets.trace.indexOf(traceTarget);
                if (idx !== -1) onHit(`trace-${idx}`);
            }
        }, 2000); // 2s to reach end

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        <motion.div
            initial={{ left: start.x, top: start.y, opacity: 1, scale: 1 }}
            animate={{
                left: [start.x, safeMid.x, safeEnd.x],
                top: [start.y, safeMid.y, safeEnd.y],
                opacity: [1, 1, 0],
                scale: [1, 1, 0]
            }}
            transition={{
                duration: 2.5,
                times: [0, 0.4, 1], // 40% time to get to skills, rest to trace
                ease: "easeInOut"
            }}
            style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: signal.color,
                boxShadow: `0 0 15px ${signal.color}, 0 0 30px ${signal.color}`,
                zIndex: 100,
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)'
            }}
        />
    );
};

/**
 * Main Application Component.
 * 
 * Responsibilities:
 * - Manages global state (tooltip, signals, hits)
 * - Implements Vim-style keyboard navigation (j, k, G, gg)
 * - Handles theme switching (silicon/light/default)
 * - Renders the main sections (Hero, Verification, Coverage, Trace, Terminal)
 */
const AppContent = () => {
    const [tooltip, setTooltip] = useState<string | null>(null);
    const [signals, setSignals] = useState<SignalType[]>([]);
    const [activeHits, setActiveHits] = useState<Set<string>>(new Set());
    const [bootComplete, setBootComplete] = useState(false);
    const [viewMode, setViewMode] = useState<'log' | 'wave'>('log');
    const [theme, setTheme] = useState<'default' | 'silicon' | 'light'>('default');

    // Registry refs
    const targets = useRef<TargetRegistry>({ skills: [], trace: [] });

    const registerTarget = (type: 'skills' | 'trace', ref: React.RefObject<HTMLDivElement | null>) => {
        if (!targets.current[type].includes(ref)) {
            targets.current[type].push(ref);
        }
    };

    const emitSignal = (rect: DOMRect, color: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        setSignals(prev => [...prev, { id, startX, startY, color }]);

        setTimeout(() => {
            setSignals(prev => prev.filter(s => s.id !== id));
        }, 2500);
    };

    const hitTarget = (id: string) => {
        setActiveHits(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
        setTimeout(() => {
            setActiveHits(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }, 500);
    };

    // Vim Navigation Logic
    useEffect(() => {
        let lastKeyTime = 0;
        let gCount = 0;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            const now = Date.now();

            switch (e.key) {
                case 'j':
                    window.scrollBy({ top: 300, behavior: 'smooth' });
                    break;
                case 'k':
                    window.scrollBy({ top: -300, behavior: 'smooth' });
                    break;
                case 'G':
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    break;
                case 'g':
                    if (now - lastKeyTime < 500) {
                        gCount++;
                    } else {
                        gCount = 1;
                    }
                    lastKeyTime = now;
                    if (gCount === 2) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        gCount = 0;
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Force scroll to top management
    useEffect(() => {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
    }, []);

    useLayoutEffect(() => {
        if (bootComplete) {
            window.scrollTo(0, 0);
            // Safety timeout for lower-end devices or slow frames
            setTimeout(() => window.scrollTo(0, 0), 10);
        }
    }, [bootComplete]);

    // Theme Effect
    useEffect(() => {
        document.body.classList.remove('theme-silicon', 'theme-light');
        if (theme === 'silicon') {
            document.body.classList.add('theme-silicon');
        } else if (theme === 'light') {
            document.body.classList.add('theme-light');
        }
    }, [theme]);

    return (
        <SignalContext.Provider value={{ registerTarget, emitSignal, hitTarget, activeHits }}>
            <AnimatePresence>
                {!bootComplete && (
                    <motion.div exit={{ opacity: 0 }} transition={{ duration: 1 }}>
                        <BootSequence onComplete={() => setBootComplete(true)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {bootComplete && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="bg-obsidian text-white selection:bg-electric selection:text-white transition-colors duration-500 relative min-h-screen overflow-x-hidden"
                >

                    {/* Custom Hardware Probe Cursor */}
                    <CustomCursor />

                    {/* Signal Overlay */}
                    {signals.map(s => (
                        <SignalPacket key={s.id} signal={s} targets={targets.current} onHit={hitTarget} />
                    ))}

                    {/* Vim Gutter (Left Side) */}
                    <VimGutter />

                    {/* Hero Section */}
                    <Section className="h-screen overflow-hidden relative !pl-8 lg:!pl-8" id="top">
                        <div
                            className="absolute inset-0 z-0"
                            style={{
                                maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
                            }}
                        >
                            <SoCScene setTooltip={setTooltip} theme={theme} />
                        </div>

                        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center -translate-y-28">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1 }}
                                className="text-center"
                            >
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <Cpu className="text-electric w-6 h-6 animate-pulse" />
                                    <span className="font-mono text-electric tracking-widest text-sm">SYSTEM_ON_CHIP :: VERIFICATION</span>
                                </div>

                                <CyberText text="MISHAT" />

                                <p className={`font-light max-w-3xl mx-auto px-4 mt-2 whitespace-nowrap ${theme === 'silicon' ? 'text-gray-300 text-sm md:text-base tracking-widest' : 'text-gray-600 text-lg md:text-xl font-medium'}`}>
                                    Senior Design Verification Engineer <span className="text-pcbgold font-bold">@ Marvell Technology</span>
                                </p>

                                <div className="h-12 mt-8 flex justify-center items-center">
                                    {tooltip ? (
                                        <motion.div
                                            key={tooltip}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-black/80 backdrop-blur-md border border-electric/50 px-6 py-2 rounded-full font-mono text-sm text-electric shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                                        >
                                            {tooltip}
                                        </motion.div>
                                    ) : (
                                        <span className="text-gray-700 text-xs font-mono animate-pulse">Initialize hover sequence on SoC...</span>
                                    )}
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    transition={{ delay: 2 }}
                                    className="mt-8 text-[10px] text-gray-700 font-mono"
                                >
                                    Tip: Use <span className="text-electric font-bold">j</span> / <span className="text-electric font-bold">k</span> to navigate, <span className="text-electric font-bold">gg</span> / <span className="text-electric font-bold">G</span> to jump
                                </motion.div>

                            </motion.div>
                        </div>

                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute bottom-10 z-20 pointer-events-auto cursor-pointer"
                            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                        >
                            <MagneticWrapper>
                                <ChevronDown className="text-gray-500 hover:text-white transition-colors w-8 h-8" />
                            </MagneticWrapper>
                        </motion.div>
                    </Section>

                    {/* Verification Logic Section */}
                    <Section className="relative overflow-hidden py-32" id="verification">

                        <div className="grid lg:grid-cols-12 gap-12 max-w-7xl w-full items-start z-10 relative">

                            <div className="lg:col-span-5 relative">
                                <SectionHeader
                                    icon={Activity}
                                    title="Verification Core"
                                    subtitle="module portfolio_top;"
                                />

                                <p className="text-gray-300 text-lg leading-relaxed mb-6 border-l-2 border-electric pl-6">
                                    <span className="text-electric font-mono text-sm block mb-2">// PHILOSOPHY</span>
                                    Just as a heartbeat sustains life, rigorous verification sustains silicon. I architect
                                    <span className="text-pcbgold font-bold"> UVM-based environments </span>
                                    that stress-test SoCs beyond their limits, ensuring functional perfection before tape-out.
                                </p>
                                <div className="flex gap-4 mt-8">
                                    <div className="bg-gray-900/50 px-4 py-2 rounded border border-gray-800 text-xs font-mono text-gray-400">
                                        <span className="text-success">✔</span> AI Chips & SerDes
                                    </div>
                                    <div className="bg-gray-900/50 px-4 py-2 rounded border border-gray-800 text-xs font-mono text-gray-400">
                                        <span className="text-pcbgold">★</span> 100% Coverage
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-7 mt-20 lg:mt-0">
                                <div className="grid md:grid-cols-2 gap-4 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-electric/5 to-purple-500/5 rounded-3xl blur-2xl -z-10" />

                                    <MethodologyCard
                                        title="Constrained Random"
                                        desc="Maximizing functional coverage via UVM-driven randomized stimulus generation."
                                        icon={Dices}
                                        color="bg-electric"
                                        colorHex="#00f3ff"
                                        delay={0.1}
                                    />
                                    <MethodologyCard
                                        title="Formal Verification"
                                        desc="Mathematical proofs for safety-critical logic using JasperGold (ABV)."
                                        icon={Shield}
                                        color="bg-pcbgold"
                                        colorHex="#d4af37"
                                        delay={0.2}
                                    />
                                    <MethodologyCard
                                        title="High-Speed Protocols"
                                        desc="Expertise in Ethernet, COMPHY (SerDes), and complex high-bandwidth interfaces."
                                        icon={Network}
                                        color="bg-success"
                                        colorHex="#00ff41"
                                        delay={0.3}
                                    />
                                    <MethodologyCard
                                        title="AI Network Control"
                                        desc="Validating AI chip interconnects and traffic management logic."
                                        icon={ArrowRightLeft}
                                        color="bg-neonpurple"
                                        colorHex="#b026ff"
                                        delay={0.4}
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Skills Coverage Dashboard */}
                    <Section className="relative overflow-hidden py-32" id="coverage">
                        <div className="max-w-6xl w-full z-10 relative">
                            <SectionHeader
                                icon={Layers}
                                title="Functional Coverage"
                                subtitle="covergroup cg_skills;"
                            />

                            <div className="relative p-8 border border-gray-800 bg-gray-900/30 rounded-2xl backdrop-blur-sm shadow-2xl mt-8">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-obsidian px-4 text-gray-500 font-mono text-xs border border-gray-800 rounded-full">
                                    IP_BLOCK_SKILLS_MAP
                                </div>

                                <div className="absolute -left-1 top-10 w-1 h-8 bg-gray-700 rounded-r" />
                                <div className="absolute -left-1 top-24 w-1 h-8 bg-gray-700 rounded-r" />
                                <div className="absolute -right-1 top-10 w-1 h-8 bg-gray-700 rounded-l" />
                                <div className="absolute -right-1 top-24 w-1 h-8 bg-gray-700 rounded-l" />

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <SkillNode index={0} name="SystemVerilog" level={95} />
                                    <SkillNode index={1} name="UVM Framework" level={90} />
                                    <SkillNode index={2} name="Python / Scripting" level={85} />
                                    <SkillNode index={3} name="Ethernet / PCIe" level={80} />
                                    <SkillNode index={4} name="Verdi / DVE" level={88} />
                                    <SkillNode index={5} name="Formal (JasperGold)" level={75} />
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Experience Timeline */}
                    <Section className="relative py-32" id="trace">
                        <div className="max-w-5xl w-full z-10">
                            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-12 gap-4">
                                <SectionHeader
                                    icon={Zap}
                                    title="Execution Trace"
                                    subtitle='$monitor("Career Log: %t", $time);'
                                    className="mb-0"
                                />

                                <button
                                    onClick={() => setViewMode(prev => prev === 'log' ? 'wave' : 'log')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all text-sm font-mono group"
                                >
                                    {viewMode === 'log' ? (
                                        <>
                                            <Play size={16} className="text-electric group-hover:fill-electric" />
                                            <span className="text-gray-300 group-hover:text-white">View Waveform</span>
                                        </>
                                    ) : (
                                        <>
                                            <List size={16} className="text-gray-400" />
                                            <span className="text-gray-300 group-hover:text-white">View Log</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {viewMode === 'log' ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="ml-4 md:ml-12 mt-8"
                                >
                                    {TRACE_DATA.map((item, i) => (
                                        <TimelineItem
                                            key={item.id}
                                            index={i}
                                            year={item.start === 2025.41 ? "May 2025 - Present" : (item.id === 1 ? "June 2023 - May 2025" : (item.id === 2 ? "Sept 2022 - Mar 2023" : "Sept 2017 - April 2023"))}
                                            title={item.title}
                                            company={item.company || item.school}
                                            degree={item.degree}
                                            description={item.description}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <WaveformViewer theme={theme} />
                                </motion.div>
                            )}
                        </div>
                    </Section>

                    {/* Terminal / Footer */}
                    <Section className="pb-20 bg-gradient-to-t from-black to-obsidian !pl-8 lg:!pl-8" id="terminal">
                        <div className="max-w-4xl w-full z-10 text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Run Simulation</h2>
                            <p className="text-gray-400 mb-8">Access my contact info, download my resume, change themes, and more.</p>
                            <Terminal onThemeChange={setTheme} />
                        </div>

                        <footer className="absolute bottom-8 md:bottom-12 text-gray-600 text-sm font-mono">
                            © {new Date().getFullYear()} Mishat. Designed inside the silicon.
                        </footer>
                    </Section>
                </motion.div>
            )}
        </SignalContext.Provider>
    );
};

const App = () => <AppContent />;

const root = createRoot(document.getElementById('root')!);
root.render(<App />);