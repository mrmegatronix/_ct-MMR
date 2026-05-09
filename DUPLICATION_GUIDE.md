# Monster Meat Raffle (MMR) - System Documentation & Duplication Guide

This guide explains how the MMR system works and how to easily duplicate or rebrand it for other events (e.g., Bingo Nights, Trivia, different Raffles).

## 1. Fast Rebranding (config.js)
The entire project is driven by `config.js`. To change the event name, colors, or schedule, you only need to edit this one file:

```javascript
window.MMR_CONFIG = {
    EVENT_NAME: "Monster Meat Raffle", // Change to "Your New Event"
    COLORS: {
        primary: '#ef4444',            // Change hex color code here
    },
    TARGET_DAY: 4,                     // 0=Sun, 1=Mon, etc.
    TARGET_HOUR: 19,                   // 7 PM
    // ... URLs and paths ...
};
```

## 2. Google Sheets Setup (The Backend)
The system pulls all slide content from a Google Sheet published as a CSV.

### Column Schema (Ordered):
1.  **Title**: The main heading.
2.  **Subtitle**: The sub-heading or description.
3.  **Type**: `normal`, `countdown`, `avatar`, or `winners`.
4.  **Duration**: How long to show the slide (in milliseconds, e.g., `30000` for 30s).
5.  **BackgroundImage**: Full-screen background image URL or local path.
6.  **OverlayImage**: Centered image on top of background.
7.  **BubbleText**: Speech bubble text (used specifically for `avatar` slides).
8.  **WinnerPhotos**: Comma-separated list of URLs (used specifically for `winners` slides).

## 3. Advanced Features
### Slide Controls
- **Display Overlay**: Hover your mouse over the main display screen to show manual navigation controls (`Prev`, `Pause`, `Next`).
- **Remote Sync**: The Admin and Remote pages have dedicated control panels that sync instantly with the TV display via Firebase.

### Voice Announcement
- The system automatically announces the winning ticket number.
- **Toggle**: Use the toggle in the Admin/Remote header to turn voice on or off.
- **Timing**: The voice waits for the visual rolling animation to finish before speaking.

### Cross-Device Sync (Firebase)
To use the remote control from your phone on a different network:
1.  Create a free Firebase project.
2.  Paste your **Realtime Database URL** into the Admin panel configuration.
3.  All devices using that same URL will stay in perfect sync.

## 4. Troubleshooting
- **Not updating?** Ensure your Google Sheet is set to "Publish to web" -> "Entire Document" -> "Comma-separated values (.csv)".
- **Images not showing?** Check that the URLs are public and start with `https://`.
- **TV Cutoffs?** The progress bar has been thickened for better visibility on all screens.
