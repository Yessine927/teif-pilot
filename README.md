# TEIF Pilot

This is the Electronic Invoicing Platform Pilot for TEIF, built on a Microkernel architecture using Electron, React, and Vite. 

For comprehensive documentation on the architecture, technical decisions, and application flow, please see the `docs/` folder:
- [Technology Stack](./docs/technology-stack.md)
- [Pilot Checklist](./docs/pilot-checklist.md) 
- [Full Application Flow](./docs/full-flow.md)

---

## Prerequisites

Before you can run the application, you need to have the following installed on your machine:

1. **[Node.js](https://nodejs.org/)** (v18 or higher recommended)
2. **[pnpm](https://pnpm.io/)** (Fast, disk space efficient package manager)

To install `pnpm` globally via npm (which comes with Node.js), run:
```bash
npm install -g pnpm
```

---

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yessine927/teif-pilot.git
   cd teif-pilot
   ```

2. **Install project dependencies:**
   Using `pnpm`, install all the required packages to run the application:
   ```bash
   pnpm install
   ```

---

## Running the Application

### Development Mode

To run the application in development mode with hot-reloading (sub-second refresh time):

```bash
pnpm run dev
```
*(This command starts the Electron app and opens the application window).*

### Production Build

To package the application into a distribution format (e.g., a Windows `.exe` installer):

```bash
pnpm run build
```
The compiled artifacts and installer will be available in the `dist/` directory.

---

## Project Structure

- `src/main/` - Node.js Main Process. Contains the Core EventBus, PluginManager, IPC Bridge, and all Plugins.
- `src/renderer/` - Chromium Renderer Process. Contains the React 18 UI components, dynamic forms, and `useIpc` hooks.
- `src/preload/` - Preload scripts that use `contextBridge` to expose specific IPC channels securely.
- `src/shared/` - Cross-stack types and event definitions.
- `docs/` - Comprehensive platform architecture and design documentation.
