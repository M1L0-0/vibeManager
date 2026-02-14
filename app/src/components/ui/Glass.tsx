import { cn } from "@/lib/utils";
import React from "react";

/**
 * Shared Glassmorphism primitives to reduce CSS duplication
 */

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export function GlassPanel({ children, className, ...props }: GlassProps) {
    return (
        <div
            className={cn(
                "bg-gray-900/90 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-2xl",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isActive?: boolean;
    activeVariant?: 'purple' | 'blue' | 'green' | 'cyan' | 'red';
}

export function GlassButton({ children, className, isActive, activeVariant = 'purple', ...props }: GlassButtonProps) {
    const variants = {
        purple: "bg-purple-600 text-white shadow-lg shadow-purple-500/50 hover:bg-purple-500",
        blue: "bg-blue-600 text-white shadow-lg shadow-blue-500/50 hover:bg-blue-500",
        green: "bg-green-600 text-white shadow-lg shadow-green-500/50 hover:bg-green-500",
        cyan: "bg-cyan-600 text-white shadow-lg shadow-cyan-500/50 hover:bg-cyan-500",
        red: "bg-red-600 text-white shadow-lg shadow-red-500/50 hover:bg-red-500",
    };

    return (
        <button
            className={cn(
                "flex items-center justify-center rounded-lg transition-all duration-200",
                isActive
                    ? variants[activeVariant]
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
