# Goal Description
Implement a complete end-of-draw workflow, including a congrats page, archiving, and resume prompt, while adjusting the T.B.C. slides display behavior.

## Proposed Changes

### T.B.C. Dynamic Slides
- **`index.html`**: Update the `isTBC` logic. If `isTBC` is true, do NOT push the advert slides to `advertSlides`. This will leave only the main countdown slide in the rotation, which correctly displays the T.B.C. counts in the pill box at the bottom.

### Finish & End Draw Workflow
- **`admin.html` & `remote.html`**: 
  - Rename the "Confirm Finished" button to "Finish & End Draw".
  - When clicked, instead of just setting `isConfirmedFinished`, it updates the state to trigger the `congrats` view on the display.
- **`index.html`**:
  - Add a new view `congrats`.
  - When `state.activeView === 'congrats'`, render a full-screen congratulations overlay.
  - Determine if the draw was manual (e.g. check if `drawnNumbers` contains manual entries or check the state). If manual, hide the list of winning numbers. If standard, show the list of winning numbers.

### Archiving vs Clearing
- **`admin.html` & `remote.html`**:
  - Update the `resetDraw` function. Instead of blindly clearing `state.draw`, append the current draw's details (ticket start/finish, drawn numbers, prizes, financials) to an `archive` array in the Firebase state (e.g. `state.archive.thursday`).
  - Then clear the active draw state so it resets to `0` (which triggers T.B.C. mode for the next draw).

### Resume / New Draw Dialog
- **`admin.html` & `remote.html`**:
  - When the page loads (or when switching to the Draw tab), check if `prizesLeft > 0` and `drawnNumbers.length > 0`.
  - If a draw is partially complete, show a modal: "A draw is currently in progress. Would you like to Continue the Draw, or Archive it and Start a New Draw?"
  - Handle the actions appropriately.
