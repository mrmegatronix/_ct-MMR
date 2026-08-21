const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[index] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[index ERROR]`, err.stack || err.message));
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', e => console.error('Caught:', e.error ? e.error.stack : e));
    window.addEventListener('unhandledrejection', e => console.error('Unhandled Rejection:', e.reason ? e.reason.stack : e.reason));
  });
  
  await page.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  
  // Wait a moment for init
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("--- TRIGGERING DRAW VIEW ---");
  await page.evaluate(() => {
     // simulate state update from remote
     window.updateState({ activeView: 'draw' });
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
