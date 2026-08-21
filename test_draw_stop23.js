const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('https://mrmegatronix.github.io/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
        
        console.log("Page loaded.");
        
        // Let's test just creating the HTML and rolling and stopping it manually
        
        await page.evaluate(() => {
            document.body.innerHTML = '<div class="slot-container"></div>';
        });
        
        // Define stopLotteryRoll
        await page.evaluate(() => {
            window.stopLotteryRoll = function(finalNumber, prizeType, speedParam) {
                const speed = speedParam || { rollDuration: 1000, slotInterval: 50, digitBaseDelay: 200, digitStepDelay: 100 };
                
                if (window.rollInterval) {
                    clearInterval(window.rollInterval);
                }
                if (window.lockTimeouts) {
                    window.lockTimeouts.forEach(t => clearTimeout(t));
                }
                window.lockTimeouts = [];
                
                const numStr = String(finalNumber).padStart(4, '0');
                const container = document.querySelector('.slot-container');
                if (container) {
                    let html = '';
                    for (let i = 0; i < numStr.length; i++) {
                        html += `<span class="slot-digit rolling">-</span>`;
                    }
                    container.innerHTML = html;
                }
                
                const slots = Array.from(document.querySelectorAll('.slot-digit'));
                if (slots.length === 0) {
                    if (window.rollInterval) clearInterval(window.rollInterval);
                    return;
                }
                
                window.rollInterval = setInterval(() => {
                    slots.forEach(slot => {
                        if (slot.classList.contains('rolling')) {
                            slot.innerText = Math.floor(Math.random() * 10);
                        }
                    });
                }, speed.slotInterval || 50);
                
                slots.forEach((slot, index) => {
                    const delay = (speed.digitBaseDelay || 800) + index * (speed.digitStepDelay || 600);
                    console.log(`Setting timeout for index ${index} with delay ${delay}`);
                    const t = setTimeout(() => {
                        console.log(`Timeout fired for index ${index}`);
                        slot.classList.remove('rolling');
                        slot.classList.add('locked');
                        slot.innerText = numStr[index];
                        
                        if (index === slots.length - 1) {
                            console.log("Final index reached, clearing interval");
                            if (window.rollInterval) clearInterval(window.rollInterval);
                        }
                    }, delay);
                    window.lockTimeouts.push(t);
                });
            };
        });
        
        await page.evaluate(() => {
            window.stopLotteryRoll("1234");
        });
        
        // Listen to console
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        
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
