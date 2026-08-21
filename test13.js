const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  const pageRemote = await browser.newPage();
  pageRemote.on('console', msg => console.log(`[REMOTE] ${msg.type()}: ${msg.text()}`));
  pageRemote.on('pageerror', err => console.log(`[REMOTE ERROR]`, err.stack || err.message));
  
  await pageRemote.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/remote.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking button...");
  await pageRemote.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button'));
     const b = btns.find(b => b.textContent.includes('🎯 Draw Screen'));
     if (b) {
         console.log("Found it!");
         b.click();
     }
  });
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
