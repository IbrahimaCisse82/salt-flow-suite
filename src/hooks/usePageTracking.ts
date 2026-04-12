import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/utils/analytics';

/**
 * Hook to automatically track page views on route changes.
 * Uses modern Performance API (performance.timing is deprecated).
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView(location.pathname, document.title);

    // Use modern Navigation Timing API (Level 2)
    const entries = performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      const nav = entries[0] as PerformanceNavigationTiming;
      const loadTime = Math.round(nav.loadEventEnd - nav.startTime);
      if (loadTime > 0 && loadTime < 60000) {
        analytics.trackTiming('Page Load', location.pathname, loadTime);
      }
    }
  }, [location.pathname]);
}
