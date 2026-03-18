import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HelloWorldPlugin } from './HelloWorldPlugin';
import { EventBus } from '../core/EventBus';
import { Events } from '../../shared/events';
import { AppEvent } from '../../shared/types';

describe('HelloWorldPlugin', () => {
  let bus: EventBus;
  let plugin: HelloWorldPlugin;

  beforeEach(() => {
    bus = new EventBus();
    plugin = new HelloWorldPlugin(bus);
  });

  afterEach(async () => {
    await plugin.stop();
  });

  it('should broadcast its UI descriptor on start', () => {
    return new Promise<void>(async (resolve) => {
      bus.subscribe(Events.UI_DESCRIPTOR_REGISTERED, (event: AppEvent) => {
        expect(event.payload.descriptor.pluginId).toBe(plugin.id);
        resolve();
      });

      await plugin.start();
    });
  });

  it('should respond to HELLO_WORLD_REQUEST correctly', () => {
    return new Promise<void>(async (resolve) => {
      await plugin.start();

      bus.subscribe(Events.HELLO_WORLD_RESPONSE, (event: AppEvent) => {
        expect(event.payload.greeting).toBe('Hello, Salma! Welcome to TEIF Platform.');
        resolve();
      });

      // Send simulated request
      bus.publish({
        type: Events.HELLO_WORLD_REQUEST,
        payload: { name: 'Salma' },
        timestamp: Date.now()
      });
    });
  });
});
