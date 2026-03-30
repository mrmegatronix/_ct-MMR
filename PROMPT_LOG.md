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
- Synchronization happens instantly via `BroadcastChannel('mmr_sync')` and `localStorage`.

### Action: Refine Display Logic and Slides
- **Request**: Update countdown to target Thursday 7PM, add "Monster Meat Raffle weekly on Thursdays" title to slides, add continuous background confetti (with logo) behind slides, and set default next draw amount to $1225 with 62 prizes.
- **Result**:
  - Implemented `getNextThursday7PM()` in both `index.html` and `remote.html` to auto-calculate the next Thursday at 19:00 local time.
  - Added a `.slides-fixed-title` overlay on the slides view.
### Action: NZ Timezone Logic for Countdown
- **Request**: The countdown clock should correctly target Thursdays at 7PM New Zealand Local Time, rather than relying on the device's local clock timezone.
- **Result**:
  - Implemented an `Intl.DateTimeFormat(..., {timeZone: 'Pacific/Auckland'})` based parsing system in both `index.html` and `remote.html`.
  - The script extracts the active runtime numbers for year/month/day/hour directly in NZ format, dynamically calculating the difference between the "live NZ time" and "next Thursday 7PM NZ time."
  - Updated the countdown clock display logic to appropriately render days (`d`) and hours (`h`) if the target time is further away.
