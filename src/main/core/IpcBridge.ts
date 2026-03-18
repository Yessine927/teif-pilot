import { ipcMain, BrowserWindow } from 'electron';
import { EventBus } from './EventBus';
import { AppEvent } from '../../shared/types';
import { Events } from '../../shared/events';

/**
 * Connects the Main process EventBus to the Renderer process IPC mechanism.
 * 
 * Provides a single bridge:
 * - Listens for incoming events from the Renderer and publishes them to the EventBus.
 * - Subscribes to the EventBus to relay requested events back to the Renderer.
 */
export class IpcBridge {
  private window: BrowserWindow | null = null;


  /**
   * Links a renderer window to receive events.
   * @param window The Electron window containing the renderer process.
   */
  setWindow(window: BrowserWindow): void {
    this.window = window;
  }

  /**
   * Binds the IPC channels to the EventBus.
   * @param eventBus the central event bus of the system.
   */
  bind(eventBus: EventBus): void {
    // 1. From UI to Main Process Eventbus
    ipcMain.on('bus:publish', (_event, appEvent: AppEvent) => {
      console.log(`[IpcBridge] Forwarding ${appEvent.type} from Renderer to Main EventBus.`);
      eventBus.publish(appEvent);
    });

    // 2. From Main EventBus to UI
    const eventsToForward = [
      Events.UI_DESCRIPTOR_REGISTERED,
      Events.HELLO_WORLD_RESPONSE,
      Events.AUTH_LOGIN_RESPONSE,
      Events.AUTH_REGISTER_RESPONSE,
      // Add more events as they are implemented, to prevent unnecessary noise over IPC
    ];

    eventsToForward.forEach(eventType => {
      // Keep references to unsubscribes if this was a larger system where bridge rebinding was common
      eventBus.subscribe(eventType, (appEvent: AppEvent) => {
        if (this.window && !this.window.isDestroyed()) {
          console.log(`[IpcBridge] Relaying ${eventType} to Renderer.`);
          this.window.webContents.send('bus:event', appEvent);
        }
      });
    });
  }
}
