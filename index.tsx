/**
 * @file index.tsx
 * @description Main entry point for the Portfolio Application.
 * Orchestrates the full-page layout, initializes the theme, and manages the global signal visual system.
 * 
 * @author Mishat
 */
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Layers, Activity, ChevronDown, Dices, Network, ArrowRightLeft, Shield } from 'lucide-react';

// --- Context & Data ---
import { SignalContext, SignalType, TargetRegistry } from './src/context/SignalContext';

// --- UI Components ---
import CustomCursor from './src/components/ui/CustomCursor';
import CyberText from './src/components/ui/CyberText';
import MagneticWrapper from './src/components/ui/MagneticWrapper';
import ChipLoader from './src/components/ui/ChipLoader';
import SectionHeader from './src/components/ui/SectionHeader';
import VimCommandPalette from './src/components/ui/VimCommandPalette';
import ConstructionTape from './src/components/ui/ConstructionTape';

// --- Layout Components ---
import Section from './src/components/layout/Section';
import VimGutter from './src/components/layout/VimGutter';

// --- Feature Components ---
import BootSequence from './src/components/features/BootSequence';
import MobileWarning from './src/components/features/MobileWarning';
import MethodologyCard from './src/components/features/MethodologyCard';
import WaferCoverage from './src/components/features/WaferCoverage';
import ExecutionTrace from './src/components/features/ExecutionTrace';
import SignalPacket from './src/components/features/SignalPacket';
import SideProjectsSection from './src/components/features/SideProjectsSection';
import VerificationCoreSection from './src/components/features/VerificationCoreSection';

// --- Lazy Loaded Components ---
const Terminal = React.lazy(() => import('./src/components/features/Terminal'));

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
    // Boot plays once per tab session, and never for reduced-motion users
    const [bootComplete, setBootComplete] = useState(() => {
        try {
            if (sessionStorage.getItem('portfolio-booted') === '1') return true;
        } catch (e) {}
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    const [theme, setTheme] = useState<'default' | 'silicon' | 'light'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('portfolio-theme') as 'default' | 'silicon' | 'light') || 'default';
        }
        return 'default';
    });
    const [showMobileWarning, setShowMobileWarning] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);

    const finishBoot = useCallback(() => {
        try {
            sessionStorage.setItem('portfolio-booted', '1');
        } catch (e) {}
        setBootComplete(true);
    }, []);

    useEffect(() => {
        // Simple check for mobile width
        if (window.innerWidth < 768) {
            setShowMobileWarning(true);
        }
    }, []);

    // Registry refs
    const targets = useRef<TargetRegistry>({ skills: [], trace: [] });

    // Helper functions for Context
    const registerTarget = useCallback((type: 'skills' | 'trace', ref: React.RefObject<HTMLDivElement | null>) => {
        if (!targets.current[type].includes(ref)) {
            targets.current[type].push(ref);
        }
    }, []);

    const emitSignal = useCallback((rect: DOMRect, color: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        setSignals(prev => [...prev, { id, startX, startY, color }]);

        setTimeout(() => {
            setSignals(prev => prev.filter(s => s.id !== id));
        }, 2500);
    }, []);

    const hitTarget = useCallback((id: string) => {
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
    }, []);

    // Vim Navigation Logic
    useEffect(() => {
        let lastKeyTime = 0;
        let gCount = 0;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            const now = Date.now();

            switch (e.key) {
                case ':':
                    e.preventDefault();
                    setShowCommandPalette(true);
                    break;
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
        localStorage.setItem('portfolio-theme', theme);
        document.body.classList.remove('theme-silicon', 'theme-light');
        if (theme === 'silicon') {
            document.body.classList.add('theme-silicon');
        } else if (theme === 'light') {
            document.body.classList.add('theme-light');
        }
    }, [theme]);

    const signalContextValue = useMemo(() => ({
        registerTarget,
        emitSignal,
        hitTarget,
        activeHits
    }), [registerTarget, emitSignal, hitTarget, activeHits]);

    return (
        <SignalContext.Provider value={signalContextValue}>
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
                        <BootSequence onComplete={finishBoot} />
                    </motion.div>
                )}
                {bootComplete && theme === 'light' && (
                    <ConstructionTape key="construction-tape" />
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
                    <Section as="header" className="h-screen overflow-hidden relative !pl-8 lg:!pl-8" id="top">
                        <div
                            className="absolute inset-0 z-0"
                            style={{
                                maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
                            }}
                        >
                            <React.Suspense fallback={<ChipLoader />}>
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
                                    Tip: Use <span className="text-electric font-bold">j</span> / <span className="text-electric font-bold">k</span> to navigate, <span className="text-electric font-bold">gg</span> / <span className="text-electric font-bold">G</span> to jump, <span className="text-electric font-bold">:</span> for commands
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

                    <main>
                        {/* Verification Core: UVM testbench topology */}
                        <VerificationCoreSection />

                    {/* Skills Coverage Dashboard */}
                    <Section fill={false} className="relative overflow-hidden py-48" id="coverage">
                        <div className="max-w-6xl w-full z-10 relative">
                            <SectionHeader
                                icon={Layers}
                                title="Functional Coverage"
                                subtitle="covergroup cg_skills;"
                            />

                            <WaferCoverage />
                        </div>
                    </Section>

                    {/* Spare Cycles: side projects floorplan */}
                    <SideProjectsSection />

                    {/* Experience Timeline */}
                    <Section fill={false} className="relative py-48" id="trace">
                        <div className="max-w-5xl w-full z-10">
                            <ExecutionTrace />
                        </div>
                    </Section>
                    </main>

                    {/* Terminal / Footer */}
                    <Section as="footer" className="pb-20 bg-gradient-to-t from-black to-obsidian !pl-8 lg:!pl-8" id="terminal">
                        <div className="max-w-4xl w-full z-10 text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Run Simulation</h2>
                            <p className="text-gray-400 mb-8">Access my contact info, download my resume, change themes, and more.</p>
                            <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-electric font-mono text-sm">BOOTING_TERMINAL...</div>}>
                                <Terminal onThemeChange={setTheme} />
                            </React.Suspense>
                        </div>

                        <footer className="absolute bottom-8 md:bottom-12 text-gray-600 text-sm font-mono">
                            © {new Date().getFullYear()} Mishat. Designed inside the silicon.
                        </footer>
                    </Section>

                    {/* Vim Command Palette */}
                    <VimCommandPalette
                        isOpen={showCommandPalette}
                        onClose={() => setShowCommandPalette(false)}
                        onThemeChange={setTheme}
                    />
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