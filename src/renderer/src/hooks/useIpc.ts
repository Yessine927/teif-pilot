import { useEffect, useState, useCallback } from 'react';
import { AppEvent } from '../../../shared/types';

/**
 * A hook that provides a clean React-friendly interface over the IPC API.
 * Handles registering and unregistering global listeners cleanly.
 */
export function useIpc() {
  const [lastEvent, setLastEvent] = useState<AppEvent | null>(null);

  useEffect(() => {
    // Register global listener for incoming events from the Main process
    const removeListener = window.api.onEvent((event: AppEvent) => {
      setLastEvent(event);
    });

    return () => {
      // Unsubscribe on unmount
      removeListener();
    };
  }, []);

  /**
   * Dispatches an event to the global EventBus in the Main process.
   */
  const publish = useCallback((event: AppEvent) => {
    window.api.publish(event);
  }, []);

  return { lastEvent, publish };
}
