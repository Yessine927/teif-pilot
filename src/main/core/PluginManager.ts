import { PluginInterface } from '../../shared/types';
import { EventBus } from './EventBus';

/**
 * Manages the registration, initialization, and lifecycle of plugins.
 */
export class PluginManager {
  private plugins: Map<string, PluginInterface> = new Map();

  constructor(public readonly eventBus: EventBus) {}

  /**
   * Registers a plugin but does not run it.
   * @param plugin The plugin to register.
   */
  register(plugin: PluginInterface): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id ${plugin.id} is already registered.`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  /**
   * Starts all registered plugins.
   */
  async startAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.start();
        console.log(`[PluginManager] Started plugin: ${plugin.name} (${plugin.id})`);
      } catch (error) {
        console.error(`[PluginManager] Failed to start plugin: ${plugin.id}`, error);
      }
    }
  }

  /**
   * Stops all running plugins gracefully.
   */
  async stopAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.stop();
        console.log(`[PluginManager] Stopped plugin: ${plugin.name} (${plugin.id})`);
      } catch (error) {
        console.error(`[PluginManager] Failed to stop plugin: ${plugin.id}`, error);
      }
    }
  }
}
