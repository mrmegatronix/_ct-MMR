const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('https://mrmegatronix.github.io/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
        
        console.log("Page loaded. Testing START_ROLL then checking STOP_ROLL.");
        
        await page.evaluate(() => {
            if (typeof window.startLotteryRoll === 'function') {
                window.startLotteryRoll(100, { rollDuration: 3000, slotInterval: 50, digitBaseDelay: 800, digitStepDelay: 600 });
                console.log("startLotteryRoll called directly.");
            } else {
                console.error("startLotteryRoll not found!");
            }
        });
        
        await new Promise(r => setTimeout(r, 4000));
        
        // At this point failsafe or normal stop should not have happened if we didn't call stopLotteryRoll
        
        await page.evaluate(() => {
             if (typeof window.stopLotteryRoll === 'function') {
                window.stopLotteryRoll(1234, 100, { rollDuration: 3000, slotInterval: 50, digitBaseDelay: 800, digitStepDelay: 600 });
                console.log("stopLotteryRoll called directly.");
             }
        });
        
        await new Promise(r => setTimeout(r, 4000));
        
        const text = await page.evaluate(() => document.querySelector('.slot-container').innerText);
        console.log("Slot container text after stopLotteryRoll:", text);
        
        await browser.close();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
