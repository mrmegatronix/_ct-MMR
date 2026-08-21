const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'] 
  });
  
  const pageIndex = await browser.newPage();
  pageIndex.on('console', msg => console.log(`[INDEX] ${msg.type()}: ${msg.text()}`));
  pageIndex.on('pageerror', err => console.log(`[INDEX ERROR]`, err.stack || err.message));
  
  await pageIndex.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  
  const pageRemote = await browser.newPage();
  pageRemote.on('console', msg => console.log(`[REMOTE] ${msg.type()}: ${msg.text()}`));
  pageRemote.on('pageerror', err => console.log(`[REMOTE ERROR]`, err.stack || err.message));
  
  await pageRemote.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/remote.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Clicking 'Draw Screen' on remote...");
  await pageRemote.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button'));
     const b = btns.find(b => b.textContent.includes('🎯 Draw Screen'));
     if (b) {
         console.log("Found button on remote!");
         b.click();
     } else {
         console.log("Button not found on remote.");
     }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const activeView = await pageIndex.evaluate(() => {
     return document.querySelector('.view.active')?.id || 'NONE';
  });
  console.log("Active View on Index:", activeView);
  
  await browser.close();
})();
