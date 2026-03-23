import { useCallback } from 'react';
import { prefetchRoute } from '@/App';

/**
 * Returns event handlers to prefetch a route's JS chunk on hover/focus.
 * Attach to navigation buttons/links for instant page loads.
 */
export const usePrefetchHandlers = (href: string) => {
  const onMouseEnter = useCallback(() => prefetchRoute(href), [href]);
  const onFocus = useCallback(() => prefetchRoute(href), [href]);
  return { onMouseEnter, onFocus };
};
