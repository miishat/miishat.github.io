/**
 * @file MobileWarning.tsx
 * @description Modal warning for users on small screens.
 * Advises users to switch to a larger device for the best experience.
 * @module Components/Features
 * @author Mishat
 */
import React from 'react';
import { Activity } from 'lucide-react';
const MobileWarning = ({ onProceed }: { onProceed: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col justify-center items-center p-8 text-center font-mono">
            <div className="border border-red-500/50 bg-red-900/10 p-8 rounded-lg max-w-md shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                <div className="text-red-500 text-6xl mb-6 flex justify-center">
                    <Activity size={64} className="animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-red-500 mb-4">INCOMPATIBLE DEVICE</h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                    This verification environment is optimized for Desktop and Tablet browsers.
                    <br /><br />
                    Mobile viewports may experience signal degradation and layout fragmentation.
                </p>
                <button
                    onClick={onProceed}
                    className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 rounded transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] uppercase text-sm tracking-widest"
                >
                    Proceed With Caution
                </button>
            </div>
        </div>
    );
};

export default MobileWarning;
