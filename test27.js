const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'] 
  });
  
  // Open TV display
  const pageIndex = await browser.newPage();
  pageIndex.on('console', msg => console.log(`[INDEX] ${msg.type()}: ${msg.text()}`));
  
  await pageIndex.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Open Remote
  const pageRemote = await browser.newPage();
  pageRemote.on('console', msg => console.log(`[REMOTE] ${msg.type()}: ${msg.text()}`));
  
  await pageRemote.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/remote.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking 'Draw Screen' on remote...");
  await pageRemote.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button'));
     const b = btns.find(b => b.textContent.includes('🎯 Draw Screen'));
     if (b) {
         b.click();
     }
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  await pageIndex.screenshot({path: 'draw_screen_screenshot.png'});
  console.log("Screenshot saved as draw_screen_screenshot.png");
  
  await browser.close();
})();
