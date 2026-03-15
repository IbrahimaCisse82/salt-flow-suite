import { useRef, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Auto-sign-out after a period of inactivity.
 * Uses refs to avoid re-registering event listeners on every render.
 */
export const useSessionTimeout = (session: Session | null, timeoutMs = 2 * 60 * 60 * 1000) => {
  const timerRef = useRef<NodeJS.Timeout>();

  const reset = useCallback(() => {
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

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach(e => document.addEventListener(e, reset));
    reset();

    return () => {
      events.forEach(e => document.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session, reset]);
};
