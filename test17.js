const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  const pageIndex = await browser.newPage();
  pageIndex.on('console', msg => console.log(`[INDEX] ${msg.type()}: ${msg.text()}`));
  pageIndex.on('pageerror', err => console.log(`[INDEX ERROR]`, err.stack || err.message));
  
  await pageIndex.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  await pageIndex.evaluate(() => {
     // Poison localStorage with no draw object
     localStorage.setItem('mmr_state_v5', JSON.stringify({ activeView: "slides" }));
     
     // Now manually trigger a remote broadcast just like clicking the button on remote.html
     window.updateState({ activeView: 'draw' });
  });
  await new Promise(r => setTimeout(r, 1000));
  
  const html = await pageIndex.evaluate(() => {
     return document.querySelector('.view.active')?.id || 'NONE';
  });
  console.log("Active View:", html);
  
  await browser.close();
})();
