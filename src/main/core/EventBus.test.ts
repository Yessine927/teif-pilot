import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './EventBus';

describe('EventBus', () => {
  it('should allow publishing and subscribing to an event', () => {
    return new Promise<void>((resolve) => {
      const bus = new EventBus();
      const payload = { test: true };

      bus.subscribe('test:event', (event) => {
        expect(event.payload).toEqual(payload);
        resolve();
      });

      bus.publish({
        type: 'test:event',
        payload,
        timestamp: Date.now()
      });
    });
  });

  it('should allow unsubscribing', async () => {
    const bus = new EventBus();
    const mockCallback = vi.fn();

    const unsubscribe = bus.subscribe('test:event', mockCallback);
    unsubscribe();

    bus.publish({
      type: 'test:event',
      payload: {},
      timestamp: Date.now()
    });

    // We wait briefly since Events in EventBus are dispatched using setImmediate
    await new Promise(r => setImmediate(r));
    expect(mockCallback).not.toHaveBeenCalled();
  });
});
