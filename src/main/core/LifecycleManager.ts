import { EventBus } from './EventBus';
import { PluginManager } from './PluginManager';
import { AuthPlugin } from '../plugins/AuthPlugin';
import { HelloWorldPlugin } from '../plugins/HelloWorldPlugin';
import { Events } from '../../shared/events';
import { IpcBridge } from './IpcBridge';

/**
 * Manages the overall lifecycle of the app backend.
 * Responsible for instantiating the core, registering plugins, and starting the system.
 */
export class LifecycleManager {
  private eventBus: EventBus;
  private pluginManager: PluginManager;

  constructor(private ipcBridge: IpcBridge) {
    this.eventBus = new EventBus();
    this.pluginManager = new PluginManager(this.eventBus);
  }

  /**
   * Bootstraps the system, binds IPC, and loads plugins.
   */
  async bootstrap(): Promise<void> {
    console.log('[LifecycleManager] Bootstrapping system...');
    
    // Connect the EventBus to the IPC Bridge to forward relevant events to/from renderer
    this.ipcBridge.bind(this.eventBus);

    // Register plugins
    const authPlugin = new AuthPlugin(this.eventBus);
    this.pluginManager.register(authPlugin);

    const helloWorld = new HelloWorldPlugin(this.eventBus);
    this.pluginManager.register(helloWorld);

    // Further plugins (archiving, signature, pdf, etc.) will be registered here.
    
    // Start all plugins
    await this.pluginManager.startAll();

    // Signal that system is ready
    this.eventBus.publish({
      type: Events.SYSTEM_READY,
      payload: { status: 'ok' },
      timestamp: Date.now(),
      source: 'core'
    });

    console.log('[LifecycleManager] System bootstrapped successfully.');
  }

  /**
   * Closes everything down.
   */
  async shutdown(): Promise<void> {
    console.log('[LifecycleManager] Shutting down system...');
    await this.pluginManager.stopAll();
    console.log('[LifecycleManager] Shutdown complete.');
  }
}
