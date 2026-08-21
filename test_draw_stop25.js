const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('https://mrmegatronix.github.io/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
        
        console.log("Page loaded.");
        
        // Let's test calling stopLotteryRoll directly WITHOUT calling startLotteryRoll first
        // It creates the HTML but wait, when you set container.innerHTML = html, the slots are NO LONGER the SAME DOM ELEMENTS!
        
        await page.evaluate(() => {
             if (typeof window.stopLotteryRoll === 'function') {
                window.stopLotteryRoll("1234", 100, { rollDuration: 1000, slotInterval: 50, digitBaseDelay: 200, digitStepDelay: 100 });
                console.log("stopLotteryRoll called directly.");
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
