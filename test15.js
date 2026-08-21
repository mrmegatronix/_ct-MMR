const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  const pageIndex = await browser.newPage();
  pageIndex.on('console', msg => console.log(`[INDEX] ${msg.type()}: ${msg.text()}`));
  pageIndex.on('pageerror', err => console.log(`[INDEX ERROR]`, err.stack || err.message));
  
  await pageIndex.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Poison the localStorage
  await pageIndex.evaluate(() => {
     localStorage.setItem('mmr_state_v5', JSON.stringify({ activeView: "draw" })); // no draw object!
     location.reload();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await pageIndex.evaluate(() => {
     return document.getElementById('view-draw').outerHTML;
  });
  console.log("Draw View HTML:\n", html);
  
  await browser.close();
})();
