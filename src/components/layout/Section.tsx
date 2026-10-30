/**
 * @file Section.tsx
 * @description Layout wrapper for a major page section.
 * Provides consistent spacing, ID navigation, and responsive padding.
 * @module Components/Layout
 * @author Mishat
 */
import React from 'react';

interface SectionProps {
    children?: React.ReactNode;
    className?: string;
    id?: string;
    as?: React.ElementType;
    /** Stretch to at least one screen tall and center the content. Off for in-flow content sections so gaps stay even. */
    fill?: boolean;
}

const Section = ({ children, className = "", id = "", as: Component = "section", fill = true }: SectionProps) => (
    <Component id={id} className={`${fill ? 'min-h-screen' : ''} relative flex flex-col justify-center items-center p-8 pl-16 lg:pl-24 ${className}`}>
        {children}
    </Component>
);

export default Section;
