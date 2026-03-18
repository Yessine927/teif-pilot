import { AppEvent } from '../../shared/types';

type EventCallback = (event: AppEvent) => void;

/**
 * Central Event Bus for the Microkernel architecture.
 * Facilitates pub/sub communication between plugins without direct coupling.
 */
export class EventBus {
  private subscribers: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribes to a specific event type.
   * @param eventType Event type to listen for.
   * @param callback Function to call when event is published.
   * @returns Unsubscribe function.
   */
  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);

    return () => {
      this.subscribers.get(eventType)?.delete(callback);
    };
  }

  /**
   * Publishes an event to all subscribers of its type.
   * @param event The full event object.
   */
  publish(event: AppEvent): void {
    const subs = this.subscribers.get(event.type);
    if (subs) {
      // Execute asynchronously to avoid blocking the publisher
      subs.forEach(callback => setImmediate(() => callback(event)));
    }
  }
}
