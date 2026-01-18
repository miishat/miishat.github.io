/**
 * @file ErrorBoundary.tsx
 * @description Global error handler component.
 * Catches runtime errors in the component tree and displays a "System Failure" UI.
 * @module Components/UI
 * @author Mishat
 */
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 font-mono p-4">
                    <h1 className="text-2xl font-bold mb-4">CRITICAL SYSTEM FAILURE</h1>
                    <div className="bg-gray-900 border border-red-900 p-4 rounded max-w-2xl w-full overflow-auto">
                        <p className="mb-2">Error Log:</p>
                        <pre className="text-sm whitespace-pre-wrap">{this.state.error?.message}</pre>
                        <pre className="text-xs text-gray-500 mt-4">{this.state.error?.stack}</pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-2 bg-red-900/20 border border-red-500 hover:bg-red-500 hover:text-black transition-colors"
                    >
                        REBOOT SYSTEM
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
