# Auto-generated Prompt Log - MMR System

This file logs prompt instructions and project state to ensure reproducibility.

## Prompts & Actions

### Action: Major Project Simplification
- **Request**: User requested to completely simplify the project to pure HTML suitable for TV display, with `index.html` (Main Display) and `remote.html` (Remote Control). They asked to remove all unused code (React, Vite, Firebase). They requested slides, draw animations, and congrats screens.
- **Result**:
  - Deleted the entire React/Vite setup (`src`, `package.json`, etc.).
  - Created `index.html` as the main TV display, featuring a looped slideshow, lottery animation view, and congrats view, driven by CSS animations and BroadcastChannel.
  - Created `remote.html` to control the display, edit slides, configure ticket ranges, exclusions, and trigger draws.
  - Setup auto-sync to GitHub by committing changes.

### Current Project State
The project is now a standalone, zero-dependency HTML application.
- `index.html`: Open on the TV/Display.
- `remote.html`: Open on the controlling device (must be same browser/machine for BroadcastChannel, or just use the dual screen).
- Synchronization happens instantly via `BroadcastChannel('mmr_sync')` and `localStorage`.
