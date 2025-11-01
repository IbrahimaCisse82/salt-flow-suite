import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/utils/analytics';

/**
 * Hook to automatically track page views on route changes
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    analytics.trackPageView(location.pathname, document.title);

    // Track timing from navigation start
    if (performance && performance.timing) {
      const navigationStart = performance.timing.navigationStart;
      const loadTime = Date.now() - navigationStart;
      
      if (loadTime < 60000) { // Only track if less than 1 minute (valid session)
        analytics.trackTiming('Page Load', location.pathname, loadTime);
      }
    }
  }, [location]);
}
