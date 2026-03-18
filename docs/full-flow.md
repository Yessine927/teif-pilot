# Full Application Flow - A to Z

> From the moment Electron starts to the moment Salma sees a response.
> A new developer should understand the entire communication pattern from this page alone.

---

## Architecture Overview

```mermaid
graph TB
    subgraph Main["Main Process - Node.js"]
        LM["LifecycleManager"]
        EB["EventBus"]
        PM["PluginManager"]
        IB["IpcBridge"]
        AP["AuthPlugin"]
        HW["HelloWorldPlugin"]

        LM --> EB
        LM --> PM
        LM --> IB
        PM --> AP
        PM --> HW
        AP --> EB
        HW --> EB
        IB --> EB
    end

    subgraph Preload["Preload Script - contextBridge"]
        PubAPI["window.api.publish"]
        OnAPI["window.api.onEvent"]
    end

    subgraph Renderer["Renderer - Chromium"]
        App["App.tsx"]
        Hook["useIpc hook"]
        LoginC["Login"]
        RegC["Register"]
        UIRC["UiRenderer"]

        App --> Hook
        App --> LoginC
        App --> RegC
        App --> UIRC
    end

    IB -->|"bus:event"| OnAPI
    PubAPI -->|"bus:publish"| IB
    OnAPI --> Hook
    Hook --> PubAPI
```

### Process Boundaries

| Boundary | Left side | Right side |
|---|---|---|
| IPC Bridge | Main Process: Node.js, EventBus, Plugins | Renderer Process: Chromium, React |
| Preload Script | Electron ipcRenderer API | React window.api interface |
| EventBus | Plugin-to-plugin communication | IpcBridge forwards selected events |

---

## Phase 1 - Startup

```mermaid
sequenceDiagram
    participant E as Electron
    participant LM as LifecycleManager
    participant EB as EventBus
    participant PM as PluginManager
    participant IB as IpcBridge
    participant BW as BrowserWindow

    E->>IB: new IpcBridge
    E->>LM: new LifecycleManager with bridge
    LM->>EB: new EventBus
    LM->>PM: new PluginManager with eventBus
    E->>BW: createWindow with preload script
    E->>IB: setWindow with mainWindow
    E->>LM: bootstrap
    LM->>IB: bind to eventBus
    LM->>PM: register AuthPlugin
    LM->>PM: register HelloWorldPlugin
    LM->>PM: startAll
    Note over PM: Each plugin subscribes to its events
    Note over PM: HelloWorldPlugin publishes its UI descriptor
    LM->>EB: publish system:ready
```

### What happens during bind

The IpcBridge sets up two directions of communication:

1. **Renderer to Main** — `ipcMain.on('bus:publish')` receives events from React and forwards them to the EventBus.
2. **Main to Renderer** — The bridge subscribes to a whitelist of events on the EventBus and sends them to the window via `webContents.send('bus:event')`.

### Whitelisted Events

| Event | Direction | Purpose |
|---|---|---|
| ui:descriptor:registered | Main to Renderer | Plugin declares its UI form |
| hello_world:response | Main to Renderer | Greeting result |
| auth:login:response | Main to Renderer | Login success or failure or locked |
| auth:register:response | Main to Renderer | Registration result |

All other events stay inside the Main Process.

---

## Phase 2 - UI Initialization

```mermaid
sequenceDiagram
    participant React as App.tsx
    participant Hook as useIpc
    participant Pre as Preload
    participant IB as IpcBridge
    participant EB as EventBus
    participant HW as HelloWorldPlugin

    React->>Hook: mount useIpc
    Hook->>Pre: window.api.onEvent with callback
    React->>Pre: publish ui:ready
    Pre->>IB: ipcRenderer.send bus:publish
    IB->>EB: eventBus.publish ui:ready
    EB->>HW: subscriber fires
    HW->>EB: publish ui:descriptor:registered
    EB->>IB: whitelisted event
    IB->>Pre: webContents.send bus:event
    Pre->>Hook: onEvent callback
    Hook->>React: setLastEvent with descriptor
    Note over React: UiRenderer builds the form from the JSON descriptor
```

---

## Phase 3 - Login Flow

```mermaid
sequenceDiagram
    participant S as Salma
    participant UI as Login Component
    participant Pre as Preload
    participant IB as IpcBridge
    participant EB as EventBus
    participant Auth as AuthPlugin
    participant DB as SQLite

    S->>UI: Enter username and password
    S->>UI: Click Sign In
    UI->>Pre: publish auth:login:request
    Pre->>IB: ipcRenderer.send bus:publish
    IB->>EB: eventBus.publish
    EB->>Auth: deliver to subscriber
    Auth->>DB: SELECT user WHERE username matches

    alt Account locked
        Auth->>EB: response locked true
    else Password valid
        Auth->>DB: reset failed attempts and create session
        Auth->>EB: response success true with sessionId
    else Password invalid
        Auth->>DB: increment failed attempts
        Auth->>EB: response success false
    end

    EB->>IB: whitelisted event
    IB->>Pre: webContents.send bus:event
    Pre->>UI: onEvent and setLastEvent

    alt Success
        UI->>S: Navigate to main screen
    else Failure or Locked
        UI->>S: Show error message
    end
```

---

## Phase 4 - Plugin Interaction

This shows how any plugin receives a command and returns a result.

```mermaid
sequenceDiagram
    participant S as Salma
    participant UIR as UiRenderer
    participant Pre as Preload
    participant IB as IpcBridge
    participant EB as EventBus
    participant HW as HelloWorldPlugin

    Note over UIR: Form built from JSON descriptor

    S->>UIR: Type Salma and click Greet Me
    UIR->>Pre: publish hello_world:request with name Salma
    Pre->>IB: ipcRenderer.send bus:publish
    IB->>EB: eventBus.publish
    EB->>HW: deliver to subscriber
    HW->>HW: Build greeting message
    HW->>EB: publish hello_world:response with greeting
    EB->>IB: whitelisted event
    IB->>Pre: webContents.send bus:event
    Pre->>UIR: onEvent updates pluginResponses
    UIR->>S: Display greeting on screen
```

---

## Phase 5 - Plugin Lifecycle

Every plugin follows the same four-step lifecycle:

```mermaid
stateDiagram-v2
    [*] --> Registered
    Registered --> Started
    Started --> Handling
    Handling --> Started
    Started --> Stopped
    Stopped --> [*]
```

| Step | What happens |
|---|---|
| Register | Plugin instance stored in PluginManager by id |
| Start | Plugin subscribes to event types on the EventBus. Optionally publishes a UI descriptor. |
| Handle | EventBus delivers matching event. Plugin reads payload, runs logic, publishes response. |
| Stop | Plugin calls all unsubscribe functions and releases resources like closing the database. |

### AuthPlugin Login Handling

```mermaid
graph TD
    A["Receive auth:login:request"] --> B["Query SQLite for user"]
    B --> C{"User found?"}
    C -->|No| D["Respond: invalid credentials"]
    C -->|Yes| E{"Account locked?"}
    E -->|Yes| F["Respond: account locked"]
    E -->|No| G["bcrypt compare password"]
    G --> H{"Match?"}
    H -->|Yes| I["Reset attempts, create session"]
    I --> J["Respond: success with sessionId"]
    H -->|No| K["Increment failed attempts"]
    K --> L{"Attempts >= 3?"}
    L -->|Yes| M["Lock account for 30 seconds"]
    M --> N["Respond: account locked"]
    L -->|No| O["Respond: invalid credentials"]
```

---

## Phase 6 - Shutdown

```mermaid
sequenceDiagram
    participant S as Salma
    participant BW as BrowserWindow
    participant LM as LifecycleManager
    participant PM as PluginManager
    participant Auth as AuthPlugin
    participant HW as HelloWorldPlugin

    S->>BW: Close the window
    BW->>LM: window-all-closed event
    LM->>PM: stopAll
    PM->>Auth: stop: unsubscribe and close DB
    PM->>HW: stop: unsubscribe
    LM->>LM: app.quit
```

---

## Complete Journey

```mermaid
graph TD
    A["Electron starts"] --> B["Create IpcBridge and LifecycleManager"]
    B --> C["Create BrowserWindow with Preload"]
    C --> D["IpcBridge.bind wires IPC to EventBus"]
    D --> E["Register and start all plugins"]
    E --> F["Plugins subscribe and publish UI descriptors"]
    F --> G["React mounts, useIpc hook registers listener"]
    G --> H["App publishes ui:ready"]
    H --> I["Plugins re-send descriptors via EventBus to IPC to Renderer"]
    I --> J["UiRenderer builds forms from JSON"]
    J --> K["Salma types and clicks"]
    K --> L["window.api.publish sends event to Main"]
    L --> M["Preload to IpcBridge to EventBus"]
    M --> N["EventBus delivers to matching plugin"]
    N --> O["Plugin executes business logic"]
    O --> P["Plugin publishes response"]
    P --> Q["IpcBridge relays to Renderer"]
    Q --> R["useIpc updates React state"]
    R --> S["Salma sees the result on screen"]
```

---

## Source File Reference

| File | Role | Phase |
|---|---|---|
| src/main/index.ts | Electron entry point, creates window, bootstraps | Startup |
| src/main/core/LifecycleManager.ts | Wires EventBus + PluginManager + IpcBridge | Startup, Shutdown |
| src/main/core/EventBus.ts | Pub/sub hub: subscribe and publish | All phases |
| src/main/core/PluginManager.ts | Registers, starts, and stops plugins | Startup, Shutdown |
| src/main/core/IpcBridge.ts | Connects EventBus to Renderer via ipcMain | IPC |
| src/preload/index.ts | Exposes window.api.publish and window.api.onEvent | IPC |
| src/renderer/src/App.tsx | React root: routing, descriptor state, events | UI Init, Interaction |
| src/renderer/src/hooks/useIpc.ts | React hook wrapping IPC listener and publisher | UI Init, Interaction |
| src/renderer/src/components/UiRenderer.tsx | Builds forms from JSON descriptors | Interaction |
| src/renderer/src/components/Login.tsx | Login screen | Login Flow |
| src/renderer/src/components/Register.tsx | Registration screen | Login Flow |
| src/main/plugins/AuthPlugin.ts | Authentication, sessions, lockout | Login Flow |
| src/main/plugins/HelloWorldPlugin.ts | Proof-of-concept greeting plugin | Interaction |
| src/shared/types.ts | AppEvent, PluginInterface, UiDescriptor | All phases |
| src/shared/events.ts | Event type constants | All phases |
