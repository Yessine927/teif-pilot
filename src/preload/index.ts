import { contextBridge, ipcRenderer } from 'electron';
import { AppEvent } from '../shared/types';

// Custom APIs for renderer
const api = {
  /**
   * Publishes an event dynamically to the Main process EventBus.
   */
  publish: (event: AppEvent) => {
    ipcRenderer.send('bus:publish', event);
  },
  
  /**
   * Registers a listener for an incoming dynamic event relayed from the EventBus.
   */
  onEvent: (callback: (event: AppEvent) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, appEvent: AppEvent) => callback(appEvent);
    ipcRenderer.on('bus:event', handler);
    return () => {
      ipcRenderer.removeListener('bus:event', handler);
    };
  }
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api;
}

export type IpcApi = typeof api;
