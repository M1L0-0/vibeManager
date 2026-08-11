/**
 * Tutorial Overlay - Step-by-step onboarding for the VibeManager Portfolio
 */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check } from 'lucide-react';

const TUTORIAL_STEPS = [
    {
        title: "Welcome to VibeManager",
        content: "You're looking at a live, interactive cellular automata engine. Currently loaded is 'The Masterpiece', a self-sustaining rhythmic circuit demonstrating our custom physics core.",
        target: "center", // Just float in the center
    },
    {
        title: "The Physics Engine",
        content: "Watch the Wave Cells (blue) and Stem Cells (purple). Notice how particles form outward arcs but never infinitely bounce back? Our new vector-culling deduplication engine intercepts visual pendulums in real-time.",
        target: "center",
    },
    {
        title: "Create Life",
        content: "Select 'Genesis' mode from the bottom toolbar, choose a Pixel Cell, and click anywhere to spawn it. Pixel Cells persist state when hit by waves.",
        target: "bottom", // Near toolbar
    },
    {
        title: "Tweak the Genomes",
        content: "Switch to the 'Inspect' tool and click any Stem Cell. Notice that they only flash transient pulses and do not toggle permanently overhead? This is the strict structural relayer architecture at work.",
        target: "bottom",
    },
    {
        title: "Save & Export",
        content: "Love what you built? Click the 'Incubator' folder icon in the toolbar. You can load this Masterpiece again later, or export your grids to JSON. Happy experimenting!",
        target: "center",
    }
];

export function TutorialOverlay() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Only show once per session ideally, but for portfolio, maybe once per local storage
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('vibeManagerTutorialCompleted_v13');
        if (!hasSeenTutorial) {
            // Small delay so the page loads gracefully before popping up
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('vibeManagerTutorialCompleted_v13', 'true');
    };

    if (!isVisible) return null;

    const step = TUTORIAL_STEPS[currentStep];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center p-6"
                >
                    {/* Semi-transparent backdrop for focus */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`pointer-events-auto relative w-full max-w-sm bg-gray-900/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 text-white ${step.target === 'bottom' ? 'translate-y-48' : ''
                            }`}
                        style={{
                            /* Simple positioning hack using CSS transforms based on target.
                               Instead of absolute coordinates, we just push it down if it's 'bottom'
                             */
                        }}
                    >
                        <button
                            onClick={handleComplete}
                            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                            title="Skip Tutorial"
                        >
                            <X size={16} />
                        </button>

                        <div className="text-xs font-mono text-purple-400 mb-2">
                            STEP {currentStep + 1} OF {TUTORIAL_STEPS.length}
                        </div>

                        <h2 className="text-xl font-bold mb-3 tracking-tight">
                            {step.title}
                        </h2>

                        <p className="text-gray-300 text-sm leading-relaxed mb-6">
                            {step.content}
                        </p>

                        <div className="flex justify-between items-center">
                            <div className="flex gap-1.5">
                                {TUTORIAL_STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentStep ? 'bg-purple-500 scale-125' : 'bg-white/20'
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
                            >
                                {currentStep === TUTORIAL_STEPS.length - 1 ? (
                                    <>Get Started <Check size={16} /></>
                                ) : (
                                    <>Next <ChevronRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
