const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  const pageIndex = await browser.newPage();
  await pageIndex.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  await pageIndex.evaluate(() => {
     window.updateState({ activeView: 'draw' });
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const drawViewState = await pageIndex.evaluate(() => {
      const el = document.getElementById('view-draw');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
          display: computed.display,
          opacity: computed.opacity,
          visibility: computed.visibility,
          width: computed.width,
          height: computed.height,
          zIndex: computed.zIndex,
          classList: Array.from(el.classList),
          innerHTML_len: el.innerHTML.length
      }
  });
  console.log("Draw View State:", drawViewState);
  
  await browser.close();
})();
