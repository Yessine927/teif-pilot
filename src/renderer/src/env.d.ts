/// <reference types="vite/client" />
import { IpcApi } from "../../preload/index";

declare global {
  interface Window {
    api: IpcApi;
  }
}
