# MMR "Winners" Slide Instructions

The "Winners" slide type is designed to showcase previous raffle winners in a high-fidelity, cinematic carousel.

## 1. How to enable it
In your Google Sheet (GSHEETS_URL), set the **Type** column (Column C) to `winners` for the desired row.

## 2. Adding Photos
In the **Winner Photos** column (Column H), paste the URLs of the images you want to display, separated by commas.
- **Example**: `https://example.com/winner1.jpg, https://example.com/winner2.jpg`
- **Local Photos**: You can also use paths relative to the project root, such as `_winners/photo1.jpg`.

## 3. What it does
- **Automatic Carousel**: The module will automatically loop through all the photos provided in that row.
- **Styling**: Each photo is displayed with a premium gold border and a matching glow effect.
- **Animations**: Images feature a staggered entry animation for a professional look.
- **Overlay**: The slide's **Title** and **Subtitle** will still be displayed on top of the carousel, allowing you to add captions like "Last Week's Champions".

## 4. Configuration
You can adjust the **Duration** (Column D) to give people enough time to see all the photos. 20-30 seconds (20000-30000ms) is recommended for 3+ photos.
