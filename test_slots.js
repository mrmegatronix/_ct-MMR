const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        
        await page.goto('file://' + __dirname + '/index.html');
        await page.waitForSelector('#view-draw');
        
        console.log("DOM loaded. Initiating roll...");
        
        // Start roll
        await page.evaluate(() => {
            if (typeof startLotteryRoll === 'function') {
                // Set window.MMR_CONFIG for testing
                window.MMR_CONFIG = { DEFAULT_TICKET_MAX: 999 };
                startLotteryRoll(25, { mode: 1, name: 'Normal', rollDuration: 1000, slotInterval: 50, digitBaseDelay: 200, digitStepDelay: 100 });
            }
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Stop roll
        const slotsData = await page.evaluate(() => {
            if (typeof stopLotteryRoll === 'function') {
                stopLotteryRoll(999, 25, { mode: 1, name: 'Normal', rollDuration: 1000, slotInterval: 50, digitBaseDelay: 200, digitStepDelay: 100 });
            }
            return {
                stripsFound: document.querySelectorAll('.slot-strip').length,
                slotsLocked: document.querySelectorAll('.slot-digit.locked').length
            };
        });
        
        console.log('Strips found after start:', slotsData.stripsFound);
        
        await new Promise(r => setTimeout(r, 3000));
        
        const endData = await page.evaluate(() => {
            return {
                bgClasses: document.getElementById('view-draw').className,
                titleColor: document.getElementById('draw-view-title').style.color,
                titleText: document.getElementById('draw-view-title').innerText,
                slotsLocked: document.querySelectorAll('.slot-digit.locked').length
            };
        });
        console.log('End Data:', endData);
        
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
