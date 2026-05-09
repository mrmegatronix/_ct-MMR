# TO COMPLETE LIST - Monster Meat Raffle (MMR)

## Slide Controls & Navigation
- [ ] Implement **Slide Controls Overlay**:
    - [ ] `index.html`: Hover-only bar with Pause/Play, Prev, Next.
    - [ ] `admin.html`: Integrated controls for manual overrides.
    - [ ] `remote.html`: Integrated controls for manual overrides.
- [ ] Adjust **Progress Bar**:
    - [ ] Increase height from 8px to 12px (make 5% - 50% taller for TV visibility).

## Voice & Audio
- [ ] Implement **Voice Toggle**:
    - [ ] Add On/Off switch to Admin and Remote panels.
- [ ] Fix **Voice Timing**:
    - [ ] Ensure announcement happens *after* the number is displayed/locked.

## Data & Caching
- [ ] Rely **ONLY on Google Sheets**:
    - [ ] Disable all local/localStorage caching for slide content.
    - [ ] Only hardcoded slide allowed is the `Countdown`.
- [ ] GSheet Schema Enhancements:
    - [ ] Add `BackgroundImage` column.
    - [ ] Add `OverlayImage` column.
    - [ ] Add `WinnerPhotos` column (for carousel).

## Display Fixes
- [ ] Fix **Avatar Slide**:
    - [ ] Resolve issues with Avatar image and Bubble Text not displaying.
- [ ] Fix **Text Layering**:
    - [ ] Ensure Title and Subtext are legible and properly layered.
- [ ] Implement **Winner Carousel**:
    - [ ] New slide type to quickly transition 5-10 photos of previous winners.

## Optimization & Documentation
- [ ] **Clean Up Code**: Remove unused logic, legacy React/Vite mentions, and optimize performance.
- [ ] **Auto Documentation**: Generate/Verify complete documentation.
- [ ] **Template for Duplication**:
    - [ ] Create a `config.js` or `TEMPLATE.md` to allow easy cloning.
    - [ ] Document how to change event name, colors, confetti, and dates.
