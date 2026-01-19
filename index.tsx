/**
 * @file index.tsx
 * @description Main entry point for the Portfolio Application.
 * Orchestrates the full-page layout, initializes the theme, and manages the global signal visual system.
 * 
 * @author Mishat
 */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Layers, Activity, ChevronDown, Dices, Network, ArrowRightLeft, Play, List, Shield } from 'lucide-react';

// --- Context & Data ---
import { SignalContext, SignalType, TargetRegistry } from './src/context/SignalContext';
import { TRACE_DATA } from './src/data/traceData';

// --- UI Components ---
import CustomCursor from './src/components/ui/CustomCursor';
import CyberText from './src/components/ui/CyberText';
import MagneticWrapper from './src/components/ui/MagneticWrapper';
import SectionHeader from './src/components/ui/SectionHeader';

// --- Layout Components ---
import Section from './src/components/layout/Section';
import VimGutter from './src/components/layout/VimGutter';

// --- Feature Components ---
import BootSequence from './src/components/features/BootSequence';
import MobileWarning from './src/components/features/MobileWarning';
import MethodologyCard from './src/components/features/MethodologyCard';
import SkillNode from './src/components/features/SkillNode';
import TimelineItem from './src/components/features/TimelineItem';
import WaveformViewer from './src/components/features/WaveformViewer';
import SignalPacket from './src/components/features/SignalPacket';

// --- Legacy / Moved Components ---
import Terminal from './src/components/features/Terminal';

// Lazy Load the heavy 3D Scene
const SoCScene = React.lazy(() => import('./src/components/features/SoCScene'));

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
    const [showMobileWarning, setShowMobileWarning] = useState(false);

    useEffect(() => {
        // Simple check for mobile width
        if (window.innerWidth < 768) {
            setShowMobileWarning(true);
        }
    }, []);

    // Registry refs
    const targets = useRef<TargetRegistry>({ skills: [], trace: [] });

    // Helper functions for Context
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
                {showMobileWarning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <MobileWarning onProceed={() => setShowMobileWarning(false)} />
                    </motion.div>
                )}
                {!bootComplete && !showMobileWarning && (
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
                            <React.Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-electric font-mono text-xs animate-pulse">INITIALIZING 3D KERNEL...</div>}>
                                <SoCScene setTooltip={setTooltip} theme={theme} />
                            </React.Suspense>
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

                                <p className={`font-light max-w-3xl mx-auto px-4 mt-2 whitespace-nowrap ${theme === 'silicon' ? 'text-gray-400 text-sm md:text-base tracking-widest' : 'text-gray-400 text-lg md:text-xl font-medium'}`}>
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
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 1 }}
                                    className="mt-8 text-[10px] text-gray-400 font-mono"
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
                                <div className="flex flex-wrap gap-4 mt-8">
                                    <div className="bg-gray-900/50 px-4 py-2 rounded border border-gray-800 text-xs font-mono text-gray-400">
                                        <span className="text-success">✔</span> AI Chips & SerDes
                                    </div>
                                    <div className="bg-gray-900/50 px-4 py-2 rounded border border-gray-800 text-xs font-mono text-gray-400">
                                        <span className="text-pcbgold">★</span> 100% Coverage
                                    </div>
                                    <div className="bg-gray-900/50 px-4 py-2 rounded border border-gray-800 text-xs font-mono text-gray-400">
                                        <span className="text-electric">⚡</span> Zero Bugs
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
                                    <SkillNode index={3} name="Ethernet / COMPHY" level={80} />
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

// --- Error Handling ---
import ErrorBoundary from './src/components/ui/ErrorBoundary';

const App = () => (
    <ErrorBoundary>
        <AppContent />
    </ErrorBoundary>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);