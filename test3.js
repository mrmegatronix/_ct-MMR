const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const testPage = async (name, url) => {
      console.log(`\n--- Testing ${name} ---`);
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      page.on('console', msg => console.log(`[${name} Console] ${msg.type()}: ${msg.text()}`));
      page.on('pageerror', err => console.log(`[${name} Error]`, err.stack || err.message));
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.screenshot({ path: `/tmp/puppeteer-test/${name}.png` });
      await page.close();
  };
  await testPage('index', 'file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html');
  await testPage('admin', 'file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/admin.html');
  await testPage('remote', 'file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/remote.html');
  await browser.close();
})();
