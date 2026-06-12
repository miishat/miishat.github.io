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
}

const Section = ({ children, className = "", id = "", as: Component = "section" }: SectionProps) => (
    <Component id={id} className={`min-h-[85vh] relative flex flex-col justify-center items-center p-8 pl-16 lg:pl-24 ${className}`}>
        {children}
    </Component>
);

export default Section;
