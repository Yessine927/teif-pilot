export const Events = {
  // Lifecycle
  SYSTEM_READY: 'system:ready',

  // UI Registration
  UI_READY: 'ui:ready',
  UI_DESCRIPTOR_REGISTERED: 'ui:descriptor:registered',

  // Hello World Plugin
  HELLO_WORLD_REQUEST: 'hello_world:request',
  HELLO_WORLD_RESPONSE: 'hello_world:response',

  // Auth Plugin
  AUTH_LOGIN_REQUEST: 'auth:login:request',
  AUTH_LOGIN_RESPONSE: 'auth:login:response',
  AUTH_REGISTER_REQUEST: 'auth:register:request',
  AUTH_REGISTER_RESPONSE: 'auth:register:response',
} as const;
