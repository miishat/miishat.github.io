/**
 * @file index.tsx
 * @description Main entry point for the Portfolio Application.
 * Orchestrates the full-page layout, initializes the theme.
 * 
 * @author Mishat
 */
import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Layers, Activity, Dices, Network, ArrowRightLeft, Shield } from 'lucide-react';


// --- UI Components ---
import CustomCursor from './src/components/ui/CustomCursor';
import ScrollCue from './src/components/ui/ScrollCue';
import ChipLoader from './src/components/ui/ChipLoader';
import SectionHeader from './src/components/ui/SectionHeader';
import VimCommandPalette from './src/components/ui/VimCommandPalette';

// --- Layout Components ---
import Section from './src/components/layout/Section';
import VimGutter from './src/components/layout/VimGutter';

// --- Feature Components ---
import BootSequence from './src/components/features/BootSequence';
import ChipBootSequence from './src/components/features/ChipBootSequence';
import BreadboardBootSequence from './src/components/features/BreadboardBootSequence';
import MobileWarning from './src/components/features/MobileWarning';
import WaferCoverage from './src/components/features/WaferCoverage';
import ExecutionTrace from './src/components/features/ExecutionTrace';
import MarkedPackageHero from './src/components/features/MarkedPackageHero';
import SideProjectsSection from './src/components/features/SideProjectsSection';
import VerificationCoreSection from './src/components/features/VerificationCoreSection';
import CommandTerminal from './src/components/features/CommandTerminal';
import ClockProbeBackdrop from './src/components/features/ClockProbeBackdrop';
import RtlRainBackdrop from './src/components/features/RtlRainBackdrop';

// --- Lazy Loaded Components ---
const Terminal = React.lazy(() => import('./src/components/features/Terminal'));

// Lazy Load the heavy 3D Scene
const NocMorphHero = React.lazy(() => import('./src/components/features/NocMorphHero'));
const BreadboardHero = React.lazy(() => import('./src/components/features/BreadboardHero'));

/**
 * Main Application Component.
 * 
 * Responsibilities:
 * - Manages global state (tooltip, boot, theme)
 * - Implements Vim-style keyboard navigation (j, k, G, gg)
 * - Handles theme switching (silicon/light/default)
 * - Renders the main sections (Hero, Verification, Coverage, Trace, Terminal)
 */
const AppContent = () => {
    const [tooltip, setTooltip] = useState<string | null>(null);
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
    // Default and Light draw their hero and hand over to it; Silicon keeps the POST log
    const BootView = theme === 'default' ? ChipBootSequence : theme === 'light' ? BreadboardBootSequence : BootSequence;

    const finishBoot = useCallback(() => {
        try {
            sessionStorage.setItem('portfolio-booted', '1');
        } catch (e) {}
        setBootComplete(true);
        // Lets the already-mounted hero replay its intro as the boot screen lifts
        window.dispatchEvent(new Event('boot-done'));
    }, []);

    useEffect(() => {
        // Simple check for mobile width
        if (window.innerWidth < 768) {
            setShowMobileWarning(true);
        }
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

    // The page mounts under the boot screen, so keep it from scrolling until the boot ends
    useEffect(() => {
        if (bootComplete) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [bootComplete]);

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

    return (
        <>
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
                    <motion.div
                        className="fixed inset-0 z-[90]"
                        exit={{ opacity: 0, scale: 1.06, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <BootView onComplete={finishBoot} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mounted during the boot too, so the hero is loaded by the time the boot screen lifts */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="bg-obsidian text-white selection:bg-electric selection:text-white transition-colors duration-500 relative min-h-screen overflow-x-hidden"
            >


                {/* Default theme page background: clock tree, then a probed board once the hero splits */}
                {theme === 'default' && <ClockProbeBackdrop />}
                {theme === 'silicon' && <RtlRainBackdrop />}

                {/* Custom Hardware Probe Cursor */}
                <CustomCursor />

                {/* Vim Gutter (Left Side) */}
                <VimGutter />

                {/* Hero Section */}
                <Section as="header" className="h-screen overflow-hidden relative !pl-8 lg:!pl-8" id="top">
                    {theme === 'silicon' ? (
                        <MarkedPackageHero tooltip={tooltip} setTooltip={setTooltip} />
                    ) : theme === 'light' ? (
                        <React.Suspense fallback={<ChipLoader />}>
                            <BreadboardHero tooltip={tooltip} setTooltip={setTooltip} />
                        </React.Suspense>
                    ) : (
                        <React.Suspense fallback={<ChipLoader />}>
                            <NocMorphHero tooltip={tooltip} setTooltip={setTooltip} />
                        </React.Suspense>
                    )}

                    <ScrollCue />
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
                    <CommandTerminal theme={theme} onThemeChange={setTheme} />
                </Section>

                {/* Vim Command Palette */}
                <VimCommandPalette
                    isOpen={showCommandPalette}
                    onClose={() => setShowCommandPalette(false)}
                    onThemeChange={setTheme}
                />
            </motion.div>
        </>
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