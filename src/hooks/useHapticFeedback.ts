"use client";

/**
 * Hook for native-like haptic feedback on user interactions.
 * Uses the Vibration API where supported (primarily Android).
 * iOS WebKit does not support vibration, but this provides
 * a graceful no-op fallback.
 */
export function useHapticFeedback() {
    const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;

    /** Light tap - button presses, list item taps */
    const light = () => {
        if (canVibrate) navigator.vibrate(10);
    };

    /** Medium tap - toggle switches, checkbox changes */
    const medium = () => {
        if (canVibrate) navigator.vibrate(25);
    };

    /** Heavy tap - errors, warnings, destructive actions */
    const heavy = () => {
        if (canVibrate) navigator.vibrate(50);
    };

    /** Success pattern - form submissions, completed actions */
    const success = () => {
        if (canVibrate) navigator.vibrate([10, 50, 20]);
    };

    /** Error pattern - validation errors, failed actions */
    const error = () => {
        if (canVibrate) navigator.vibrate([50, 30, 50]);
    };

    return { light, medium, heavy, success, error, canVibrate };
}
