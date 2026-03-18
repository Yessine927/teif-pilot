import { PluginInterface, UiDescriptor } from '../../shared/types';
import { EventBus } from '../core/EventBus';
import { Events } from '../../shared/events';

/**
 * Proof-of-concept plugin demonstrating the microkernel architecture.
 * Features:
 * 1. Declares a dynamic UI and pushes its descriptor to the event bus.
 * 2. Listens for its specific event (`HELLO_WORLD_REQUEST`).
 * 3. Replies to the bus with a result (`HELLO_WORLD_RESPONSE`).
 * 
 * Never touches the filesystem directly, never knows that React exists.
 */
export class HelloWorldPlugin implements PluginInterface {
  id = 'plugin-hello-world';
  name = 'Hello World Plugin';

  private unsubcribers: (() => void)[] = [];

  constructor(private eventBus: EventBus) {}

  async start(): Promise<void> {
    // 1. Subscribe to queries specific to this plugin
    this.unsubcribers.push(this.eventBus.subscribe(Events.HELLO_WORLD_REQUEST, (event) => {
      const name = event.payload?.name || 'Anonymous';
      console.log(`[HelloWorldPlugin] Received request for name: ${name}`);

      // Produce the business logic (in this case: a greeting)
      const greeting = `Hello, ${name}! Welcome to TEIF Platform.`;

      // Reply using the bus
      this.eventBus.publish({
        type: Events.HELLO_WORLD_RESPONSE,
        payload: { greeting },
        timestamp: Date.now(),
        source: this.id
      });
    }));

    // 2. Announce our UI descriptor so the renderer knows we have graphical features
    const descriptor: UiDescriptor = {
      pluginId: this.id,
      title: 'Hello World Pilot',
      description: 'Used to prove end-to-end event-based IPC architecture.',
      fields: [
        {
          id: 'name',
          label: 'Your Name',
          type: 'text',
          required: true
        }
      ],
      actions: [
        {
          id: 'action-greet',
          label: 'Greet Me',
          eventType: Events.HELLO_WORLD_REQUEST
        }
      ]
    };

    const publishDescriptor = () => {
      this.eventBus.publish({
        type: Events.UI_DESCRIPTOR_REGISTERED,
        payload: { descriptor },
        timestamp: Date.now(),
        source: this.id
      });
    };

    setImmediate(publishDescriptor);

    // Announce when UI connects
    this.unsubcribers.push(this.eventBus.subscribe(Events.UI_READY, () => {
      publishDescriptor();
    }));
  }

  async stop(): Promise<void> {
    this.unsubcribers.forEach(unsub => unsub());
    this.unsubcribers = [];
  }
}
