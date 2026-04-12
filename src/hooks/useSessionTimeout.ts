import { useRef, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

/**
 * Auto-sign-out after inactivity.
 * Throttles reset to avoid excessive timer operations.
 */
export const useSessionTimeout = (session: Session | null, timeoutMs = 2 * 60 * 60 * 1000) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastResetRef = useRef(0);

  const reset = useCallback(() => {
    // Throttle resets to at most once per 10s
    const now = Date.now();
    if (now - lastResetRef.current < 10_000) return;
    lastResetRef.current = now;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (session) {
      timerRef.current = setTimeout(async () => {
        logger.info('Session timeout due to inactivity');
        await supabase.auth.signOut();
      }, timeoutMs);
    }
  }, [session, timeoutMs]);

  useEffect(() => {
    if (!session) return;

    const handler = () => reset();
    ACTIVITY_EVENTS.forEach(e => document.addEventListener(e, handler, { passive: true }));
    reset();

    return () => {
      ACTIVITY_EVENTS.forEach(e => document.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session, reset]);
};
