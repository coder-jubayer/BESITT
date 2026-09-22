import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Silently re-runs `load` on an interval while the screen is focused / app is active.
 */
export function useAutoRefresh(load: () => void | Promise<void>, intervalMs = 10000) {
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let cancelled = false;

    const tick = () => {
      if (!cancelled) void loadRef.current();
    };

    const timer = setInterval(tick, intervalMs);

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') tick();
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      cancelled = true;
      clearInterval(timer);
      sub.remove();
    };
  }, [intervalMs]);
}
