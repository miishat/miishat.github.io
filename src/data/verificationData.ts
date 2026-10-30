/**
 * @file verificationData.ts
 * @description Static data for the Verification Core section: the philosophy,
 * headline highlights, and the four methodologies shown as UVM agents.
 * @author Mishat
 */
import { Dices, Shield, Network, ArrowRightLeft, LucideIcon } from 'lucide-react';

export const PHILOSOPHY_LEAD = 'Just as a heartbeat sustains life, rigorous verification sustains silicon.';
export const PHILOSOPHY_BODY = 'I architect UVM-based environments that stress-test SoCs beyond their limits, ensuring functional perfection before tape-out.';

export const HIGHLIGHTS = [
    { label: 'AI Chips & SerDes', mark: '✔', color: 'var(--color-success)' },
    { label: '100% Coverage', mark: '★', color: 'var(--color-pcbgold)' },
    { label: 'Zero Bugs', mark: '⚡', color: 'var(--color-electric)' },
];

export interface Methodology {
    id: string;
    /** Short code used for agent names, e.g. `crv` -> crv_agent */
    short: string;
    title: string;
    desc: string;
    icon: LucideIcon;
    accent: string;
}

export const METHODOLOGIES: Methodology[] = [
    {
        id: 'crv',
        short: 'crv',
        title: 'Constrained Random',
        desc: 'Maximizing functional coverage via UVM-driven randomized stimulus generation.',
        icon: Dices,
        accent: 'var(--color-electric)',
    },
    {
        id: 'formal',
        short: 'fv',
        title: 'Formal Verification',
        desc: 'Mathematical proofs for safety-critical logic using JasperGold (ABV).',
        icon: Shield,
        accent: 'var(--color-pcbgold)',
    },
    {
        id: 'serdes',
        short: 'hsio',
        title: 'High-Speed Protocols',
        desc: 'Expertise in Ethernet, COMPHY (SerDes), and complex high-bandwidth interfaces.',
        icon: Network,
        accent: 'var(--color-success)',
    },
    {
        id: 'ainet',
        short: 'ainc',
        title: 'AI Network Control',
        desc: 'Validating AI chip interconnects and traffic management logic.',
        icon: ArrowRightLeft,
        accent: 'var(--color-neonpurple)',
    },
];
