/**
 * @file WaveformViewer.tsx
 * @description A complex "GTKWave-like" digital signal viewer.
 * Visualizes career history data as digital waveforms (CLK, BUS, STATE).
 * Supporting zooming (visual) and time cursor interactions.
 * @module Components/Features
 * @author Mishat
 */
import React, { useState, useRef } from 'react';
import { TRACE_DATA } from '../../data/traceData';

// Month names for formatting
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a decimal year to a readable month/year string.
 * @param decimalYear - Year as decimal (e.g., 2025.5 for June 2025)
 * @returns Formatted string (e.g., "June 2025")
 */
const formatDecimalYear = (decimalYear: number): string => {
    const year = Math.floor(decimalYear);
    const monthDecimal = (decimalYear - year) * 12;
    const monthIndex = Math.round(monthDecimal) - 1;
    const safeMonthIndex = Math.max(0, Math.min(11, monthIndex < 0 ? 0 : monthIndex));
    return `${MONTH_NAMES[safeMonthIndex]} ${year}`;
};

// Helper component for SignalRow
const SignalRow = ({ name, color, value, isBus = false }: { name: string, color: string, value: string, isBus?: boolean }) => (
    <div className="h-10 border-b border-gray-800 flex items-center px-4 justify-between text-[10px] md:text-xs hover:bg-gray-900 transition-colors shrink-0">
        <span className={`${color} font-mono`}>{name}</span>
        <span className={`text-gray-400 font-mono ${isBus ? 'bg-gray-800 px-1 rounded' : ''}`}>
            {isBus ? `= ${value}` : value}
        </span>
    </div>
);

// Pre-sort trace data to avoid sorting on every render
const SORTED_TRACE_DATA = [...TRACE_DATA].sort((a, b) => a.type === 'EDU' ? -1 : 1);

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
        clkStroke: isLight ? "#15803d" : "#00ff41",
        rst: "text-red-500",
        state: isLight ? "text-yellow-600" : "text-yellow-500",
        stateBorder: isLight ? "border-yellow-600/50" : "border-yellow-500/50",
        stateBg: isLight ? "bg-yellow-600/10" : "bg-yellow-500/10",
        stateText: isLight ? "text-yellow-600/80" : "text-yellow-500/50",

        company: isLight ? "text-blue-700" : "text-electric",
        companyBorder: isLight ? "border-blue-700/50" : "border-electric/50",
        companyBg: isLight ? "bg-blue-700/10" : "bg-electric/10",
        companyText: isLight ? "text-blue-700/80" : "text-electric/80",
        companySkew: isLight ? "bg-blue-700/5" : "bg-electric/5",

        school: isLight ? "text-sky-600" : "text-blue-400",
        schoolBorder: isLight ? "border-sky-600/50" : "border-blue-500/50",
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
        eduBg: isLight ? "bg-gray-800" : "bg-gray-700",

        gridText: isLight ? "text-gray-600" : "text-gray-400"
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
                    <span className="text-gray-400">Cursor: {formatDecimalYear(cursorTime)}</span>
                </div>
                <div className="flex gap-2">
                    <div className="px-2 py-0.5 bg-black rounded text-green-400 border border-green-900">ZOOM: 100%</div>
                </div>
            </div>

            <div className="flex h-[500px]">
                {/* Signals List (Sidebar) */}
                <div className="w-56 md:w-80 bg-black border-r border-gray-800 flex flex-col shrink-0 overflow-hidden">
                    <div className="h-10 border-b border-gray-800 flex items-center px-2 text-gray-500 bg-gray-900/50 shrink-0">Signals</div>
                    <SignalRow name="sys_clk" color={c.clk} value="1" />
                    <SignalRow name="rst_n" color={c.rst} value="1" />
                    <SignalRow name="state[3:0]" color={c.state} value={activeData.stateCode} />
                    <SignalRow name="company_bus" color={c.company} value={activeData.company.substring(0, 16) + (activeData.company.length > 16 ? "..." : "")} isBus />
                    <SignalRow name="school_bus" color={c.school} value={activeData.school.substring(0, 16) + (activeData.school.length > 16 ? "..." : "")} isBus />
                    <SignalRow name="degree" color={c.degree} value={activeData.degree.substring(0, 16) + (activeData.degree.length > 16 ? "..." : "")} isBus />
                    <SignalRow name="role_bus" color={c.role} value={activeData.title.substring(0, 16) + (activeData.title.length > 16 ? "..." : "")} isBus />

                    {/* Active Transaction Detail Panel */}
                    <div className="p-4 bg-gray-900/20 h-48 flex flex-col justify-start shrink-0">
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
                    {/* Grid Lines - positioned at exact year boundaries */}
                    <div className="absolute inset-0">
                        {Array.from({ length: duration }).map((_, i) => {
                            const year = startYear + i + 1;
                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 border-r border-white/5"
                                    style={{ left: getX(year) }}
                                >
                                    <span className={`absolute bottom-1 left-1 text-[10px] opacity-70 ${c.gridText}`}>
                                        {year}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Cursor Line */}
                    <div
                        className="absolute top-0 bottom-0 w-px bg-yellow-500 z-20 pointer-events-none group-hover:opacity-100 opacity-50"
                        style={{ left: getX(cursorTime) }}
                    >
                        <div className="absolute -top-4 -left-10 bg-yellow-500 text-black px-1 rounded text-[10px] whitespace-nowrap">
                            t = {formatDecimalYear(cursorTime)}
                        </div>
                    </div>

                    {/* Signals Rendering - Matches Sidebar Height h-10 */}
                    <div className="flex flex-col gap-0">
                        {/* Spacer to align with Sidebar "Signals" header */}
                        <div className="h-10 border-b border-white/5 w-full bg-gray-900/20" />

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
                            {SORTED_TRACE_DATA.map((d, i) => (
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

export default WaveformViewer;
