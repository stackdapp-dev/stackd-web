'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
    /** Called when the splash animation completes */
    onComplete: () => void;
}

/**
 * SplashScreen - Initial loading screen with animated stacking lines
 *
 * Shows a black screen with orange stacking lines animation that plays once,
 * then fades out to reveal the referral gate or login screen.
 * The animation occupies 25% of the viewport width/height and is positioned
 * slightly above center.
 */
const SplashScreen = ({ onComplete }: SplashScreenProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Total animation time:
        // - 4 lines with delays: 0.3s, 0.6s, 0.9s, 1.2s
        // - Each animation duration: 0.6s
        // - Last line completes at: 1.2s + 0.6s = 1.8s
        // - Add small buffer for smoothness: 0.4s
        // Total: ~2.2s before starting fade
        const animationTimer = setTimeout(() => {
            setIsVisible(false);
        }, 2200);

        // Call onComplete after fade animation completes (0.5s fade)
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 2700);

        return () => {
            clearTimeout(animationTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    data-testid="splash-screen"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black"
                    style={{ minHeight: '100svh' }}
                >
                    {/* Animation Container - 25% of viewport, positioned slightly above center */}
                    <div
                        data-testid="splash-animation-container"
                        className="relative flex items-center justify-center"
                        style={{
                            width: '25vw',
                            height: '25vh',
                            minWidth: '150px',
                            minHeight: '100px',
                            marginBottom: '10vh' // Position above center
                        }}
                    >
                        <div className="relative w-full h-full">
                            {/* Line 1 (bottom - drops first - LEFT aligned) */}
                            <motion.div
                                data-testid="splash-stacking-line"
                                initial={{ y: -150, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    duration: 0.6,
                                    delay: 0.3,
                                    ease: 'easeOut',
                                }}
                                className="absolute bottom-0 left-0 h-2.5 bg-[#ffa02d] rounded-full shadow-lg shadow-[#ffa02d]/50"
                                style={{ width: '70%' }}
                            />

                            {/* Line 2 (3rd from bottom - drops second - RIGHT aligned) */}
                            <motion.div
                                data-testid="splash-stacking-line"
                                initial={{ y: -150, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    duration: 0.6,
                                    delay: 0.6,
                                    ease: 'easeOut',
                                }}
                                className="absolute bottom-[22%] right-0 h-2.5 bg-[#ffa02d] rounded-full shadow-lg shadow-[#ffa02d]/50"
                                style={{ width: '70%' }}
                            />

                            {/* Line 3 (2nd from bottom - drops third - LEFT aligned) */}
                            <motion.div
                                data-testid="splash-stacking-line"
                                initial={{ y: -150, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    duration: 0.6,
                                    delay: 0.9,
                                    ease: 'easeOut',
                                }}
                                className="absolute bottom-[44%] left-0 h-2.5 bg-[#ffa02d] rounded-full shadow-lg shadow-[#ffa02d]/50"
                                style={{ width: '70%' }}
                            />

                            {/* Line 4 (top - drops last - RIGHT aligned) */}
                            <motion.div
                                data-testid="splash-stacking-line"
                                initial={{ y: -150, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    duration: 0.6,
                                    delay: 1.2,
                                    ease: 'easeOut',
                                }}
                                className="absolute bottom-[66%] right-0 h-2.5 bg-[#ffa02d] rounded-full shadow-lg shadow-[#ffa02d]/50"
                                style={{ width: '70%' }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
