const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  const pageRemote = await browser.newPage();
  pageRemote.on('console', msg => console.log(`[REMOTE] ${msg.type()}: ${msg.text()}`));
  pageRemote.on('pageerror', err => console.log(`[REMOTE ERROR]`, err.stack || err.message));
  
  await pageRemote.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/remote.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const hasButton = await pageRemote.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button'));
     const b = btns.find(b => b.textContent.includes('Show Draw Screen'));
     if (b) {
         b.click();
         return true;
     }
     return false;
  });
  console.log("Clicked button?", hasButton);
  await new Promise(r => setTimeout(r, 1000));
  
  // Try drawing $100
  await pageRemote.evaluate(() => {
     if (typeof runDraw === 'function') {
         console.log("Running draw 100");
         runDraw(100);
     }
  });
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
