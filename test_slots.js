const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        
        await page.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
        
        // Expose a function to trigger startLotteryRoll
        await page.evaluate(() => {
            if (typeof startLotteryRoll === 'function') {
                startLotteryRoll('100');
            } else {
                console.log('startLotteryRoll not found');
            }
        });
        
        await new Promise(r => setTimeout(r, 1000)); // Let it spin
        
        const slotsRollingInfo = await page.evaluate(() => {
            const container = document.querySelector('.slot-container');
            if (!container) return null;
            return {
                htmlLength: container.innerHTML.length,
                stripsFound: document.querySelectorAll('.slot-strip').length,
                firstStripTransform: document.querySelector('.slot-strip') ? document.querySelector('.slot-strip').style.transform : null
            };
        });
        
        console.log('Slots Info:', JSON.stringify(slotsRollingInfo, null, 2));

        // Stop roll (using a valid 3-digit number since DEFAULT_TICKET_MAX is 999)
        await page.evaluate(() => {
            if (typeof stopLotteryRoll === 'function') {
                stopLotteryRoll('123', '100');
            }
        });
        
        await new Promise(r => setTimeout(r, 4000)); // Let it lock (delay can be up to 3000ms + transition 1500ms)
        
        const slotsLockedInfo = await page.evaluate(() => {
            return {
                firstStripTransformFinal: document.querySelector('.slot-strip') ? document.querySelector('.slot-strip').style.transform : null,
                slotsLocked: document.querySelectorAll('.slot-digit.locked').length
            };
        });
        
        console.log('Slots Locked Info:', JSON.stringify(slotsLockedInfo, null, 2));

        await browser.close();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
