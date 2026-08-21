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
  
  console.log("Clicking 'Draw 100' on remote...");
  await pageRemote.evaluate(() => {
     // Find the draw button for 100
     const btns = Array.from(document.querySelectorAll('button'));
     const b = btns.find(b => b.textContent.includes('100') && b.textContent.toLowerCase().includes('draw'));
     if (b) {
         console.log("Found draw button for 100!");
         b.click();
     } else {
         console.log("Draw 100 button not found!");
     }
  });
  
  await new Promise(r => setTimeout(r, 4000)); // wait for draw animation
  
  const activeView = await pageIndex.evaluate(() => {
     return document.querySelector('.view.active')?.id || 'NONE';
  });
  
  const drawScreenHtml = await pageIndex.evaluate(() => {
     return document.getElementById('view-draw').innerHTML;
  });
  
  console.log("Active View on Index:", activeView);
  console.log("Draw HTML:", drawScreenHtml);
  
  await browser.close();
})();
