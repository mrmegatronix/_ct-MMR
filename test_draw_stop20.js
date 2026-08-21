const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('https://mrmegatronix.github.io/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
        
        console.log("Page loaded. Doing a full simulate START -> WAIT -> STOP -> WAIT test.");
        
        // Ensure state is clean before we start
        await page.evaluate(() => {
            if (window.rollInterval) clearInterval(window.rollInterval);
            if (window.lockTimeouts) window.lockTimeouts.forEach(t => clearTimeout(t));
        });
        
        await page.evaluate(() => {
            if (typeof window.startLotteryRoll === 'function') {
                window.startLotteryRoll(100, { rollDuration: 1000, slotInterval: 50, digitBaseDelay: 200, digitStepDelay: 100 });
                console.log("startLotteryRoll called directly.");
            }
        });
        
        // Wait 2 seconds of rolling
        await new Promise(r => setTimeout(r, 2000));
        
        // Call stop
        await page.evaluate(() => {
             if (typeof window.stopLotteryRoll === 'function') {
                window.stopLotteryRoll("1234", 100, { rollDuration: 1000, slotInterval: 50, digitBaseDelay: 200, digitStepDelay: 100 });
                console.log("stopLotteryRoll called directly.");
             }
        });
        
        // Wait 4 seconds for all locks to complete
        await new Promise(r => setTimeout(r, 4000));
        
        const text = await page.evaluate(() => {
            const slots = document.querySelectorAll('.slot-digit');
            let res = [];
            slots.forEach(s => res.push(s.innerText + (s.classList.contains('rolling') ? ' (rolling)' : '')));
            return res.join(' | ');
        });
        console.log("Slot container text after stopLotteryRoll:", text);
        
        // Verify rolling status
        const isRolling = await page.evaluate(() => window.slotsRolling);
        console.log("window.slotsRolling:", isRolling);
        
        await browser.close();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
