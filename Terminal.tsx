/**
 * @file Terminal.tsx
 * @description Interactive fake terminal emulator.
 * Provides a CLI interface for users to explore skills, contact info, and "run" simulations.
 * Supports commands, history navigation, and theme toggling.
 * 
 * @author Mishat
 */
import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minus } from 'lucide-react';

/**
 * Props for the Terminal component.
 */
interface TerminalProps {
    /** Callback when the close button (red dot) is clicked */
    onClose?: () => void;
    /** Callback to switch the global application theme */
    onThemeChange?: (theme: 'default' | 'silicon' | 'light') => void;
}

/**
 * Raw text content for the resume.
 * This string is converted to a Blob and downloaded when the 'resume' command is run.
 */
const RESUME_CONTENT = `MISHAT HASSAN
168 Gosling Crescent, Ottawa, ON, K2W 0K7 | mishath@mun.ca | 709-763-6828

RELEVANT EXPERIENCES

Senior Design Verification Engineer – Marvell Technology
Ottawa, ON, Canada | June 2023 – Present
• Worked extensively on Ethernet IP and SoC verification, including VIP integrations, PHY bringups, and MACsec verification.
• Built scalable, reusable UVM testbenches for block-level and SoC-level verification.
• Implemented functional coverage models and assertions (SVA) to ensure verification completeness and improve quality.
• Owned the end-to-end regression verification process, from automation and execution to failure analysis and debugging.
• Collaborated with design teams to review design specifications and define thorough test plans.
• Maintained and upgraded existing verification infrastructure.

Verification Engineer Intern – Marvell Technology
Ottawa, ON, Canada | September 2022 – March 2023
• Developed Python, Perl, C, and C++ test applications, scripts, and automation tools.
• Executed regression and unit tests, ensuring code coverage and proper test assertions.
• Designed and implemented SystemVerilog UVM testbenches.

Electrical Engineering Co-op – Newfoundland and Labrador Hydro
St. John’s, NL, Canada | January 2022 – May 2022
• Used Bluebeam to design and modify electrical circuits.
• Created templates for SJB, Panels, DFR, and Relays.
• Developed a VBA + Excel-based lookup tool for schematic retrieval.

EDUCATION

Memorial University of Newfoundland (2017–2023)
Bachelor of Engineering Co-op Program, Electrical Engineering
St. John’s, Newfoundland, Canada

TECHNICAL SKILLS
• Scripting and Automation: Python, Bash
• Verification and Simulation Tools: SystemVerilog, UVM, SVA, VCS
• Debugging Tools: DVE, Verdi
• Other Tools: Git, NeoVim, Jira, Confluence

RELEVANT PROJECTS
• 8-bit Computer on Breadboard (Personal)
• Clocking-related VHDL Projects on FPGA (Course Work)
• ALU and FIFO Design and Verification (Course Work)
• UART Implementation on FPGA (Personal + Course Work)
`;

/**
 * Static command responses.
 * Maps command strings to their output messages.
 */
const COMMANDS: Record<string, string> = {
    'help': 'Available commands: help, whoami, skills, contact, clear, run_test, resume, theme [silicon|light|dark]',
    'whoami': 'Mishat | Senior Design Verification Engineer @ Marvell Technology. Obsessed with zero bugs.',
    'skills': 'SystemVerilog, UVM, Python, Formal Verification, Verdi, DVE, C++',
    'contact': 'Email: mishath@mun.ca | LinkedIn: in/mishathassan',
    'run_test': 'Starting UVM Sequence...\nRunning test_soc_boot...\nWait for interrupt...\nTEST PASSED (Coverage: 100%)',
};

/**
 * Terminal Component.
 * Emulates a basic shell environment.
 * 
 * Features:
 * - Command history (visual only, not arrow key nav yet)
 * - Auto-scroll to bottom on new output
 * - Custom commands: help, whoami, skills, contact, run_test, resume, theme
 */
export default function Terminal({ onClose, onThemeChange }: TerminalProps) {
    const [history, setHistory] = useState<Array<{ type: 'input' | 'output'; content: string }>>([
        { type: 'output', content: 'MishatOS v2.0.0 [Senior Build]' },
        { type: 'output', content: 'Type "help" for instructions.' }
    ]);
    const [input, setInput] = useState('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    /**
     * Handles command submission.
     * Parses input, executes logic (or looks up static response), and updates history.
     */
    const handleCommand = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const rawCmd = input.trim();
        const args = rawCmd.split(/\s+/);
        const cmd = args[0].toLowerCase();
        const arg1 = args[1]?.toLowerCase();

        if (cmd === 'clear') {
            setHistory([]);
            setInput('');
            return;
        }

        if (cmd === 'theme') {
            if (arg1 === 'silicon') {
                if (onThemeChange) onThemeChange('silicon');
                setHistory(prev => [
                    ...prev,
                    { type: 'input', content: input },
                    { type: 'output', content: 'SWITCHING TO RTL VIEW... GATE LEVEL PRIMITIVES EXPOSED.' }
                ]);
            } else if (arg1 === 'dark') {
                if (onThemeChange) onThemeChange('default');
                setHistory(prev => [
                    ...prev,
                    { type: 'input', content: input },
                    { type: 'output', content: 'REVERTING TO ABSTRACTION LAYER 0.' }
                ]);
            } else if (arg1 === 'light') {
                if (onThemeChange) onThemeChange('light');
                setHistory(prev => [
                    ...prev,
                    { type: 'input', content: input },
                    { type: 'output', content: 'ACTIVATING CLEAN ROOM PROTOCOLS... ILLUMINATION: 100%' }
                ]);
            } else {
                setHistory(prev => [
                    ...prev,
                    { type: 'input', content: input },
                    { type: 'output', content: 'Usage: theme [silicon | light | dark]' }
                ]);
            }
            setInput('');
            return;
        }

        if (cmd === 'resume') {
            const blob = new Blob([RESUME_CONTENT], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Mishat_Hassan_Resume.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setHistory(prev => [
                ...prev,
                { type: 'input', content: input },
                { type: 'output', content: 'Initiating download sequence for Mishat_Hassan_Resume.txt...' }
            ]);
            setInput('');
            return;
        }

        const output = COMMANDS[cmd] || `bash: ${cmd}: command not found`;

        setHistory(prev => [
            ...prev,
            { type: 'input', content: input },
            { type: 'output', content: output }
        ]);
        setInput('');
    };

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [history]);

    return (
        <div className="w-full max-w-2xl mx-auto bg-obsidian/95 border border-gray-800 rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm font-mono text-sm">
            {/* Header */}
            <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-2 text-gray-400">
                    <TerminalIcon size={14} />
                    <span>mishat@silicon-valley:~</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 hover:bg-yellow-500 cursor-pointer flex items-center justify-center">
                        <Minus size={8} className="text-yellow-500" />
                    </div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 hover:bg-green-500 cursor-pointer flex items-center justify-center">
                        <Maximize2 size={8} className="text-green-500" />
                    </div>
                    <div className="w-3 h-3 rounded-full bg-red-500/20 hover:bg-red-500 cursor-pointer flex items-center justify-center" onClick={onClose}>
                        <X size={8} className="text-red-500" />
                    </div>
                </div>
            </div>

            {/* Body */}
            <div
                ref={scrollContainerRef}
                className="p-4 h-64 overflow-y-auto"
                onClick={() => document.getElementById('terminal-input')?.focus()}
            >
                {history.map((line, i) => (
                    <div key={i} className={`mb-1 ${line.type === 'input' ? 'text-gray-400' : 'text-electric'}`}>
                        {line.type === 'input' ? (
                            <span><span className="text-green-500">$</span> {line.content}</span>
                        ) : (
                            <span className="whitespace-pre-wrap">{line.content}</span>
                        )}
                    </div>
                ))}
                <form onSubmit={handleCommand} className="flex items-center gap-2 mt-2">
                    <span className="text-green-500">$</span>
                    <input
                        id="terminal-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-600"
                        autoComplete="off"
                    />
                </form>
            </div>
        </div>
    );
}