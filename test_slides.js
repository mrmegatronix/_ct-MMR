const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('https://mrmegatronix.github.io/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
        
        const slides = await page.evaluate(() => {
            const slideEls = document.querySelectorAll('.slide');
            return Array.from(slideEls).map(el => ({
                isActive: el.classList.contains('active'),
                html: el.outerHTML.substring(0, 150) + '...'
            }));
        });
        
        console.log(`Found ${slides.length} slides.`);
        console.log(JSON.stringify(slides, null, 2));

        const errors = await page.evaluate(() => {
            return window.errors || [];
        });
        console.log("Errors: ", errors);
        
        await browser.close();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
