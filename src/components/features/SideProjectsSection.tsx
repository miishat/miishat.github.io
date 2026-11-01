/**
 * @file SideProjectsSection.tsx
 * @description "Spare Cycles": side projects drawn as IP blocks on a chip floorplan.
 * Selecting a block zooms it across most of the die to show its details,
 * while the other blocks shrink into a column. Phones get a stacked list instead.
 * @module Components/Features
 * @author Mishat
 */
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FolderGit2, Github, ExternalLink, Minimize2 } from 'lucide-react';
import Section from '../layout/Section';
import SectionHeader from '../ui/SectionHeader';
import { KIND_LABEL, SIDE_PROJECTS, SideProject } from '../../data/projectsData';

/** Gold bond pads around the die edge. */
const BondPads = () => (
    <>
        {['top-0', 'bottom-0'].map(pos => (
            <div key={pos} className={`absolute left-10 right-10 flex justify-between ${pos}`}>
                {Array.from({ length: 26 }).map((_, i) => <div key={i} className="w-2 h-4 bg-pcbgold opacity-60 rounded-sm" />)}
            </div>
        ))}
        {['left-0', 'right-0'].map(pos => (
            <div key={pos} className={`absolute top-10 bottom-10 flex flex-col justify-between ${pos}`}>
                {Array.from({ length: 12 }).map((_, i) => <div key={i} className="w-4 h-2 bg-pcbgold opacity-60 rounded-sm" />)}
            </div>
        ))}
    </>
);

/** Text in the block accent: .project-ink reads --accent, and Light darkens it to an ink. */
const ink = (accent: string) => ({ '--accent': accent }) as React.CSSProperties;

/** Standard-cell stripe texture tinted with the block accent. */
const CellTexture = ({ accent, opacity }: { accent: string; opacity: number }) => (
    <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity, backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0 2px, transparent 2px 10px)` }}
    />
);

const ProjectLinks = ({ project, size }: { project: SideProject; size: number }) => (
    <div className="flex gap-3 text-xs font-mono">
        <a href={project.repo} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-gray-300 hover:text-electric">
            <Github size={size} /> source
        </a>
        {project.live && (
            <a href={project.live} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-gray-300 hover:text-electric">
                <ExternalLink size={size} /> live
            </a>
        )}
    </div>
);

/**
 * Desktop/tablet floorplan. Blocks sit at their `area` until one is zoomed;
 * then the zoomed block spans the left 4 columns and the rest stack in the right 2.
 */
const Floorplan = () => {
    const [zoom, setZoom] = useState<string | null>(null);
    const reduceMotion = useReducedMotion();
    const others = SIDE_PROJECTS.filter(p => p.id !== zoom);
    const zoomed = SIDE_PROJECTS.find(p => p.id === zoom);

    useEffect(() => {
        if (!zoom) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(null);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [zoom]);

    const placement = (p: SideProject) => {
        if (!zoom) return { gridColumn: p.area.col, gridRow: p.area.row };
        if (p.id === zoom) return { gridColumn: '1 / 5', gridRow: `1 / ${SIDE_PROJECTS.length}` };
        const slot = others.findIndex(o => o.id === p.id);
        return { gridColumn: '5 / 7', gridRow: `${slot + 1} / ${slot + 2}` };
    };

    const transition = reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 260, damping: 30 };

    return (
        <div className="relative p-6 mt-12 w-full hidden md:block">
            <BondPads />
            <div className="relative border-2 border-gray-700 backdrop-blur-sm rounded-md p-3 h-[520px] lg:h-auto lg:aspect-[16/8]">
                <div className="absolute -top-3 left-4 bg-obsidian px-2 font-mono text-[10px] text-gray-500">
                    DIE: MISHAT_SOC_V2 · {zoomed ? `ZOOM ${zoomed.code} · click or esc to exit` : 'click a block to zoom'}
                </div>
                <div
                    className="grid grid-cols-6 gap-3 h-full"
                    style={{ gridTemplateRows: zoom ? `repeat(${SIDE_PROJECTS.length - 1}, 1fr)` : 'repeat(3, 1fr)' }}
                >
                    {SIDE_PROJECTS.map(p => {
                        const isZoom = p.id === zoom;
                        const isMini = !!zoom && !isZoom;
                        return (
                            <motion.div
                                layout
                                transition={transition}
                                key={p.id}
                                style={{
                                    ...placement(p),
                                    borderColor: isZoom ? p.accent : undefined,
                                    boxShadow: isZoom ? `inset 0 0 60px -30px ${p.accent}` : undefined,
                                }}
                                className="relative border border-gray-800 hover:border-gray-600 rounded bg-gray-900/40 overflow-hidden transition-colors"
                            >
                                {/* Whole-block toggle; content sits above it and only links take pointer events */}
                                <button
                                    onClick={() => setZoom(isZoom ? null : p.id)}
                                    aria-expanded={isZoom}
                                    aria-label={isZoom ? `Collapse ${p.title}` : `Expand ${p.title}`}
                                    className="absolute inset-0 w-full h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric"
                                />
                                <CellTexture accent={p.accent} opacity={isZoom ? 0.04 : 0.07} />

                                <div className="relative p-4 pointer-events-none h-full">
                                    <motion.div layout="position" transition={transition}>
                                        <div className="project-ink font-mono text-[10px] tracking-widest" style={ink(p.accent)}>{p.code}</div>
                                        <h3 className={`font-display font-bold text-white leading-tight mt-1 ${isZoom ? 'text-3xl lg:text-4xl' : isMini ? 'text-sm' : 'text-lg'}`}>
                                            {p.title}
                                        </h3>
                                        {!isMini && <div className="font-mono text-[10px] text-gray-500 mt-2">{p.stack.join(' · ')}</div>}
                                    </motion.div>

                                    {isZoom && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={reduceMotion ? { duration: 0 } : { delay: 0.25 }}
                                            className="mt-6 grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-8"
                                        >
                                            <div>
                                                <p className="text-gray-400 mb-4 max-w-2xl">{p.summary}</p>
                                                <ul className="space-y-2 text-sm">
                                                    {p.highlights.map(h => (
                                                        <li key={h} className="flex gap-3 text-gray-300 leading-relaxed">
                                                            <span style={{ color: p.accent }}>▸</span>{h}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="font-mono flex flex-wrap items-end gap-x-6 gap-y-3 lg:block lg:space-y-3 lg:min-w-[140px]">
                                                {p.facts.map(f => (
                                                    <div key={f.label}>
                                                        <div className="text-[9px] text-gray-500 uppercase">{f.label}</div>
                                                        <div className="project-ink text-2xl font-bold" style={ink(p.accent)}>{f.value}</div>
                                                    </div>
                                                ))}
                                                <div className="pt-2 pointer-events-auto">
                                                    <ProjectLinks project={p} size={14} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {isZoom && <Minimize2 size={14} className="absolute top-3 right-3 text-gray-500 pointer-events-none" />}
                                {!zoom && <div className="absolute bottom-2 right-3 font-mono text-[10px] text-gray-500 pointer-events-none">{p.status}</div>}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/** Phone layout: the die is too small to read, so projects stack as cards. */
const ProjectList = () => (
    <div className="mt-10 w-full space-y-4 md:hidden">
        {SIDE_PROJECTS.map(p => (
            <article key={p.id} className="relative border border-gray-800 rounded-lg bg-gray-900/40 p-5 overflow-hidden" style={{ borderLeft: `3px solid ${p.accent}` }}>
                <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="project-ink" style={ink(p.accent)}>{p.code}</span>
                    <span className="text-gray-500">{KIND_LABEL[p.kind]} · {p.status}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">{p.summary}</p>
                <div className="font-mono text-[10px] text-gray-500 mb-4">{p.stack.join(' · ')}</div>
                <ProjectLinks project={p} size={14} />
            </article>
        ))}
    </div>
);

export default function SideProjectsSection() {
    return (
        <Section fill={false} className="relative overflow-x-clip py-48" id="projects">
            <div className="max-w-7xl w-full z-10 relative">
                <SectionHeader icon={FolderGit2} title="Spare Cycles" subtitle="fork side_projects(); join_none;" />
                <Floorplan />
                <ProjectList />
            </div>
        </Section>
    );
}
