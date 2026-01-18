/**
 * @file Section.tsx
 * @description Layout wrapper for a major page section.
 * Provides consistent spacing, ID navigation, and responsive padding.
 * @module Components/Layout
 * @author Mishat
 */
import React from 'react';

const Section = ({ children, className = "", id = "" }: { children?: React.ReactNode; className?: string; id?: string }) => (
    <section id={id} className={`min-h-screen relative flex flex-col justify-center items-center p-8 pl-16 lg:pl-24 ${className}`}>
        {children}
    </section>
);

export default Section;
