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
                const origStop = window.stopLotteryRoll;
                window.stopLotteryRoll = function(finalNumber, prizeType, speedParam) {
                    const speed = speedParam || getDrawSpeedConfig();
                    
                    if (window.rollInterval) clearInterval(window.rollInterval);
                    if (window.lockTimeouts) window.lockTimeouts.forEach(t => clearTimeout(t));
                    window.lockTimeouts = [];
                    
                    const numStr = String(finalNumber).padStart(4, '0');
                    const slots = Array.from(document.querySelectorAll('.slot-digit'));
                    if (slots.length === 0) return;
                    
                    slots.forEach((slot, index) => {
                        const delay = (speed.digitBaseDelay || 800) + index * (speed.digitStepDelay || 600);
                        const t = setTimeout(() => {
                            slot.classList.remove('rolling');
                            slot.classList.add('locked');
                            slot.innerText = numStr[index];
                        }, delay);
                        window.lockTimeouts.push(t);
                    });
                };

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
