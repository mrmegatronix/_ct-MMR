const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('https://mrmegatronix.github.io/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
        
        console.log("Page loaded. Modifying STOP_ROLL temporarily to test a fix...");
        
        await page.evaluate(() => {
            const originalStop = window.stopLotteryRoll;
            window.stopLotteryRoll = function(finalNumber, prizeType, speedParam) {
                console.log("stopLotteryRoll intercept called.");
                // Ensure numStr length matches the slots we render
                const speed = speedParam || getDrawSpeedConfig();
                clearInterval(rollInterval);
                lockTimeouts.forEach(t => clearTimeout(t));
                lockTimeouts = [];
                
                const numStr = String(finalNumber).padStart(4, '0');
                const container = document.querySelector('.slot-container');
                if (container) {
                    let html = '';
                    for (let i = 0; i < numStr.length; i++) {
                        html += `<span class="slot-digit rolling">-</span>`;
                    }
                    container.innerHTML = html;
                }
                
                // IMPORTANT FIX: Convert NodeList to Array to safely map over it,
                // and clear ALL intervals just in case
                const slots = Array.from(document.querySelectorAll('.slot-digit'));
                
                // If there are no slots, clear and exit
                if (slots.length === 0) {
                    clearInterval(rollInterval);
                    return;
                }

                rollInterval = setInterval(() => {
                    slots.forEach(slot => {
                        if (slot.classList.contains('rolling')) {
                            slot.innerText = Math.floor(Math.random() * 10);
                        }
                    });
                }, speed.slotInterval || 50);
                
                slots.forEach((slot, index) => {
                    const delay = (speed.digitBaseDelay || 800) + index * (speed.digitStepDelay || 600);
                    const t = setTimeout(() => {
                        slot.classList.remove('rolling');
                        slot.classList.add('locked');
                        slot.innerText = numStr[index];
                        
                        // We check index against slots.length to clear the main interval
                        if (index === slots.length - 1) {
                            clearInterval(rollInterval);
                            slotsRolling = false;
                            rollingPrize = null;
                            console.log("Animation completely finished.");
                        }
                    }, delay);
                    lockTimeouts.push(t);
                });
            };
        });

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
