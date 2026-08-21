const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
        
        // Use file:// protocol to load the local file
        await page.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
        
        // Wait 3 seconds to let fetchAndApplySlides complete
        await new Promise(r => setTimeout(r, 3000));
        
        const info = await page.evaluate(() => {
            return {
                domSlides: document.querySelectorAll('.slide').length,
                isPaused: typeof window.isPaused !== 'undefined' ? window.isPaused : null,
            };
        });
        
        console.log(JSON.stringify(info, null, 2));

        await browser.close();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
