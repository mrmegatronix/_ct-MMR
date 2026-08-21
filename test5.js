const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const testPage = async (name, url) => {
      console.log(`\n--- Testing ${name} ---`);
      const page = await browser.newPage();
      page.on('console', msg => console.log(`[${name} Console] ${msg.type()}: ${msg.text()}`));
      page.on('pageerror', err => console.log(`[${name} Error]`, err.stack || err.message));
      
      // Inject script to catch stack trace of unhandled promise rejection or error
      await page.evaluateOnNewDocument(() => {
        window.addEventListener('error', e => console.error('Caught:', e.error ? e.error.stack : e));
        window.addEventListener('unhandledrejection', e => console.error('Unhandled Rejection:', e.reason ? e.reason.stack : e.reason));
      });
      
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.close();
  };
  await testPage('remote', 'file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/remote.html');
  await browser.close();
})();
