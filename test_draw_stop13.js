const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('https://mrmegatronix.github.io/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
        
        console.log("Page loaded. Testing START_ROLL then checking STOP_ROLL with delay.");
        
        await page.evaluate(() => {
            if (typeof window.startLotteryRoll === 'function') {
                window.startLotteryRoll(100, { rollDuration: 1000, slotInterval: 50, digitBaseDelay: 200, digitStepDelay: 100 });
                console.log("startLotteryRoll called directly.");
            }
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        await page.evaluate(() => {
             if (typeof window.stopLotteryRoll === 'function') {
                // Tracking timeouts inside page context
                const origSetTimeout = window.setTimeout;
                window.setTimeout = function(cb, delay) {
                    return origSetTimeout(function() {
                        try {
                            cb();
                        } catch (err) {
                            console.error("Timeout Error:", err);
                        }
                    }, delay);
                };
                window.stopLotteryRoll("1234", 100, { rollDuration: 1000, slotInterval: 50, digitBaseDelay: 200, digitStepDelay: 100 });
                console.log("stopLotteryRoll called directly with string number.");
             }
        });
        
        await new Promise(r => setTimeout(r, 4000));
        
        const text = await page.evaluate(() => {
            const slots = document.querySelectorAll('.slot-digit');
            let res = [];
            slots.forEach(s => res.push(s.innerText + (s.classList.contains('rolling') ? ' (rolling)' : '')));
            return res.join(' | ');
        });
        console.log("Slot container text after stopLotteryRoll:", text);
        
        await browser.close();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
