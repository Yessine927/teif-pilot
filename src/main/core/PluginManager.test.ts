import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginManager } from './PluginManager';
import { EventBus } from './EventBus';
import { PluginInterface } from '../../shared/types';

describe('PluginManager', () => {
  let bus: EventBus;
  let manager: PluginManager;

  beforeEach(() => {
    bus = new EventBus();
    manager = new PluginManager(bus);
  });

  it('should register a valid plugin', () => {
    const mockPlugin: PluginInterface = {
      id: 'test-plugin',
      name: 'Test',
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined)
    };

    manager.register(mockPlugin);
    // Should not throw
    expect(true).toBe(true);
  });

  it('should throw when registering a duplicate plugin', () => {
    const mockPlugin: PluginInterface = {
      id: 'test-plugin',
      name: 'Test',
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined)
    };

    manager.register(mockPlugin);
    expect(() => manager.register(mockPlugin)).toThrow();
  });

  it('should start all registered plugins', async () => {
    const mockPlugin: PluginInterface = {
      id: 'test-plugin',
      name: 'Test',
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined)
    };

    manager.register(mockPlugin);
    await manager.startAll();

    expect(mockPlugin.start).toHaveBeenCalledOnce();
  });

  it('should stop all registered plugins', async () => {
    const mockPlugin: PluginInterface = {
      id: 'test-plugin',
      name: 'Test',
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined)
    };

    manager.register(mockPlugin);
    await manager.startAll();
    await manager.stopAll();

    expect(mockPlugin.stop).toHaveBeenCalledOnce();
  });
});
