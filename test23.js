const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'] 
  });
  
  const pageIndex = await browser.newPage();
  pageIndex.on('console', msg => console.log(`[INDEX] ${msg.type()}: ${msg.text()}`));
  
  await pageIndex.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  
  const pageRemote = await browser.newPage();
  
  await pageRemote.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/remote.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Clicking 'Draw 50' on remote...");
  await pageRemote.evaluate(() => {
     if (typeof runDraw === 'function') {
         runDraw(50);
     }
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  const drawScreenHtml = await pageIndex.evaluate(() => {
     return document.getElementById('view-draw')?.innerHTML || 'NONE';
  });
  console.log("Draw 50 HTML:", drawScreenHtml.substring(0, 500) + "...");
  
  await browser.close();
})();
