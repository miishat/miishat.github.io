/**
 * @file VimCommandPalette.tsx
 * @description Vim-style command palette that appears at the bottom of the screen
 * when the user presses ':'. Supports theme switching, navigation, and other commands.
 * 
 * @author Mishat
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VimCommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onThemeChange: (theme: 'default' | 'silicon' | 'light') => void;
}

/**
 * Command definitions with their handlers.
 */
type CommandHandler = (args: string[], callbacks: {
    onClose: () => void;
    onThemeChange: (theme: 'default' | 'silicon' | 'light') => void;
    setOutput: (msg: string) => void;
}) => void;

const COMMANDS: Record<string, CommandHandler> = {
    'help': (_, { setOutput }) => {
        setOutput('Commands: help, q, wq, theme [dark|light|silicon], colorscheme, top, $, contact, skills, resume');
    },
    'q': (_, { onClose }) => onClose(),
    'quit': (_, { onClose }) => onClose(),
    'wq': (_, { onClose }) => onClose(), // Easter egg - "write and quit"
    'x': (_, { onClose }) => onClose(),

    'theme': (args, { onThemeChange, setOutput }) => {
        const theme = args[0]?.toLowerCase();
        if (theme === 'silicon') {
            onThemeChange('silicon');
            setOutput('SWITCHING TO RTL VIEW...');
        } else if (theme === 'light') {
            onThemeChange('light');
            setOutput('CLEAN ROOM MODE ACTIVATED');
        } else if (theme === 'dark' || theme === 'default') {
            onThemeChange('default');
            setOutput('ABSTRACTION LAYER 0');
        } else {
            setOutput('Usage: theme [dark|light|silicon]');
        }
    },

    'colorscheme': (args, callbacks) => COMMANDS['theme'](args, callbacks),
    'colo': (args, callbacks) => COMMANDS['theme'](args, callbacks),

    'top': (_, { onClose }) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onClose();
    },
    '0': (_, { onClose }) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onClose();
    },
    '$': (_, { onClose }) => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        onClose();
    },
    'bottom': (_, { onClose }) => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        onClose();
    },

    'contact': (_, { onClose }) => {
        document.getElementById('terminal')?.scrollIntoView({ behavior: 'smooth' });
        onClose();
    },

    'skills': (_, { onClose }) => {
        document.getElementById('coverage')?.scrollIntoView({ behavior: 'smooth' });
        onClose();
    },

    'resume': (_, { setOutput }) => {
        const link = document.createElement('a');
        link.href = '/Mishat_Hassan_Resume.pdf';
        link.download = 'Mishat_Hassan_Resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setOutput('Downloading resume...');
    },

    'verification': (_, { onClose }) => {
        document.getElementById('verification')?.scrollIntoView({ behavior: 'smooth' });
        onClose();
    },

    'trace': (_, { onClose }) => {
        document.getElementById('trace')?.scrollIntoView({ behavior: 'smooth' });
        onClose();
    },
};

/**
 * VimCommandPalette Component.
 * Renders a vim-style command line at the bottom of the viewport.
 */
export default function VimCommandPalette({ isOpen, onClose, onThemeChange }: VimCommandPaletteProps) {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setInput('');
            setOutput(null);
        }
    }, [isOpen]);

    // Handle Escape to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = input.trim();
        if (!trimmed) {
            onClose();
            return;
        }

        const parts = trimmed.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        const handler = COMMANDS[cmd];
        if (handler) {
            handler(args, { onClose, onThemeChange, setOutput });
        } else {
            setOutput(`E492: Not a command: ${cmd}`);
        }

        setInput('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.1 }}
                    className="fixed bottom-0 left-0 right-0 z-[200] pointer-events-auto"
                >
                    <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700">
                        {/* Output line */}
                        {output && (
                            <div className="px-4 py-1 font-mono text-sm text-electric border-b border-gray-800">
                                {output}
                            </div>
                        )}

                        {/* Command input */}
                        <form onSubmit={handleSubmit} className="flex items-center">
                            <span className="pl-4 pr-1 py-2 font-mono text-white text-lg font-bold">:</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm py-2 pr-4"
                                placeholder=""
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
