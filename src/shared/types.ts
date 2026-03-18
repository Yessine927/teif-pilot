export type EventPayload = Record<string, any>;

/**
 * Standard shape of an event that passes through the Event Bus.
 */
export interface AppEvent<T = EventPayload> {
  type: string;
  payload: T;
  source?: string; // Information on which plugin sent it
  timestamp: number;
}

/**
 * Descriptor used by a plugin to declare a UI to the front-end.
 * It's generic enough to be dynamically rendered by the App Shell.
 */
export interface UiAction {
  id: string;
  label: string;
  eventType: string; // The event to fire when this action is triggered
}

export interface UiField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date';
  required?: boolean;
}

export interface UiDescriptor {
  pluginId: string;
  title: string;
  description: string;
  fields: UiField[];
  actions: UiAction[];
}

export interface PluginInterface {
  id: string;
  name: string;
  /** Starts the plugin, registering necessary event subscriptions. */
  start: () => Promise<void>;
  /** Safely stops the plugin, cleaning up resources. */
  stop: () => Promise<void>;
}
