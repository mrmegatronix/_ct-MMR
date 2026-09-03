# End-of-Draw & Draw Modes Workflow Implementation Plan

Based on your clarification, here is the updated plan for overhauling the draw configurations and the end-of-draw workflow.

## User Review Required
> [!IMPORTANT]
> Please review this comprehensive plan to ensure I have perfectly captured your workflow. 

## 1. Draw Types & Configuration (admin.html & remote.html)
- **Collapsible Configs:** The draw configuration blocks (Thursday, Sunday, Generic) will be made collapsible (accordion-style). If a draw is not enabled, its config block will be collapsed by default to save space.
- **Draw Type Selection:** Inside the Thursday and Sunday configuration blocks, I will add a **"Draw Type"** dropdown with three options:
  - `Full Draw`: The standard MMR flow (meat trays, vouchers, dynamic slides).
  - `Manual Draw`: Used when your 3rd-party system handles the drawing. Disables number rolling in this system; just runs the slides/countdown and allows triggering the Congrats page.
  - `Generic Draw`: Replaces the "Custom Draw". Uses the new Generic Draw Config.
- **Generic Draw Config:** Add a new "Generic Draw" configuration section with fields for:
  - Ticket Number Range (Start / Finish)
  - Toggle: "Show remaining prizes on display" (Yes/No)
  - Generic prize count/pool fields.

## 2. Print Sheets
- **Print Buttons:** Add four distinct print buttons to the admin UI (likely in the Archive/Print section):
  - **Full Draw Print:** Standard printout with all meat tray/voucher columns.
  - **Manual Draw Print:** A sheet optimized for the 3rd-party manual draw workflow (perhaps blank spaces to write the numbers).
  - **Generic Draw Print:** Printout utilizing the generic draw config and ranges.
  - **Blank Draw Print:** A completely blank template sheet for manual entry.

## 3. Display Updates (index.html)
- **Generic Draw (formerly Custom Draw):** The screen previously called "Custom Draw (Gold)" will be renamed to "Generic Draw". It will pull from the new Generic Draw config, and if the "Show remaining prizes" option is enabled, it will display the remaining prize count on this screen.
- **T.B.C. Dynamic Slides:** When prize counts are 0 or the draw type is Manual/Generic (meaning no meat trays), the standard meat tray/voucher dynamic slides will be completely hidden. Only the main countdown slide will show, displaying the "T.B.C." pill box if applicable.
- **Congrats Page Rendering:** 
  - Add a new full-screen `congrats` view.
  - When the "Finish & End Draw" button is pushed:
    - If `Full Draw`: Show Congrats page WITH the list of winning numbers.
    - If `Manual Draw` (or Generic): Show just the Congrats page WITHOUT winning numbers.

## 4. End-of-Draw & Archiving Workflow
- **Resume Draw Dialog:** When opening the Remote or Admin page, if a draw is partially complete (numbers drawn but not finished), a modal will ask: *"A draw is in progress. Do you want to Continue the Draw or Start a New Draw?"*
- **Finish & End Draw Button:** Replaces "Confirm Finished". Triggers the Congrats screen.
- **Archiving Logic:** Clicking "Reset Draw" (or choosing "Start a New Draw" in the prompt) will **archive** the current draw data to a permanent database array (rather than just deleting it), and reset the active state to prepare for next week.

## Open Questions for You:
1. For the **Print Sheets**, do you have a specific layout in mind for the "Blank Draw Print" and "Manual Draw Print"? Should they just be empty HTML tables that get sent to the printer?
2. When the draw is marked as **Generic Draw**, what exactly are we drawing? Is it just a single prize pool, or do you still have $100/$50/$25 tiers?
