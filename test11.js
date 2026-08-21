const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  const pageIndex = await browser.newPage();
  pageIndex.on('console', msg => console.log(`[INDEX] ${msg.type()}: ${msg.text()}`));
  pageIndex.on('pageerror', err => console.log(`[INDEX ERROR]`, err.stack || err.message));
  
  await pageIndex.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Switch to draw view
  await pageIndex.evaluate(() => {
     window.updateState({ activeView: 'draw' });
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Simulate starting a roll
  await pageIndex.evaluate(() => {
     window.updateState({ draw: { isRolling: true, activeEvent: 'thursday' } });
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Simulate landing a draw
  await pageIndex.evaluate(() => {
     window.updateState({ 
         draw: { 
             isRolling: false, 
             activeEvent: 'thursday',
             thursday: {
                 drawnNumbers: [
                     { number: 123, prize: 100 }
                 ]
             }
         } 
     });
  });
  await new Promise(r => setTimeout(r, 1000));
  
  const stateStr = await pageIndex.evaluate(() => {
      const el = document.getElementById('lottery-number');
      return el ? el.innerText : "NULL";
  });
  console.log("Lottery Number:", stateStr.replace(/\n/g, ' '));
  
  await browser.close();
})();
