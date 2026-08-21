const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('https://mrmegatronix.github.io/_ct-MMR/index.html?v=' + Date.now(), { waitUntil: 'networkidle2' });
        
        // Wait 3 seconds to let fetchAndApplySlides complete
        await new Promise(r => setTimeout(r, 3000));
        
        const info = await page.evaluate(() => {
            return {
                domSlides: document.querySelectorAll('.slide').length,
            };
        });
        
        console.log(JSON.stringify(info, null, 2));

        await browser.close();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
