'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerUpdater - Automatically refreshes the page when a new service worker is activated.
 * This ensures users always have the latest version of the app after a deployment.
 */
export function ServiceWorkerUpdater() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        // When a new service worker takes control, refresh the page
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Prevent infinite refresh loops by checking if we just refreshed
            const lastRefresh = sessionStorage.getItem('sw-refresh-time');
            const now = Date.now();

            if (lastRefresh && now - parseInt(lastRefresh) < 5000) {
                // Refreshed less than 5 seconds ago, skip
                return;
            }

            sessionStorage.setItem('sw-refresh-time', now.toString());
            window.location.reload();
        });
    }, []);

    return null; // This component renders nothing
}
