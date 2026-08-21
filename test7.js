const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  const pageRemote = await browser.newPage();
  pageRemote.on('console', msg => console.log(`[REMOTE] ${msg.type()}: ${msg.text()}`));
  pageRemote.on('pageerror', err => console.log(`[REMOTE ERROR]`, err.stack || err.message));
  await pageRemote.evaluateOnNewDocument(() => {
    window.addEventListener('error', e => console.error('Caught:', e.error ? e.error.stack : e));
    window.addEventListener('unhandledrejection', e => console.error('Unhandled Rejection:', e.reason ? e.reason.stack : e.reason));
  });

  const pageIndex = await browser.newPage();
  pageIndex.on('console', msg => console.log(`[INDEX] ${msg.type()}: ${msg.text()}`));
  pageIndex.on('pageerror', err => console.log(`[INDEX ERROR]`, err.stack || err.message));
  await pageIndex.evaluateOnNewDocument(() => {
    window.addEventListener('error', e => console.error('Caught:', e.error ? e.error.stack : e));
    window.addEventListener('unhandledrejection', e => console.error('Unhandled Rejection:', e.reason ? e.reason.stack : e.reason));
  });
  
  await pageIndex.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  await pageRemote.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/remote.html', { waitUntil: 'networkidle2' });
  
  // Wait a moment for init
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("--- CLICKING TO DRAW VIEW IN REMOTE ---");
  try {
      await pageRemote.evaluate(() => {
          // Find the button that switches to draw view
          const buttons = Array.from(document.querySelectorAll('button'));
          const drawBtn = buttons.find(b => b.textContent.includes('Show Draw'));
          if (drawBtn) {
              console.log("Found draw button, clicking...");
              drawBtn.click();
          } else {
              console.log("Could not find draw button by text. Trying window.setView('draw')...");
              if (typeof window.setView === 'function') {
                  window.setView('draw');
              } else {
                  console.log("window.setView is undefined too.");
              }
          }
      });
  } catch(e) {
      console.log("Error interacting with remote:", e);
  }
  
  await new Promise(r => setTimeout(r, 3000));
  
  const indexActiveView = await pageIndex.evaluate(() => {
     let viewStr = "";
     document.querySelectorAll('.view').forEach(v => {
         if (v.classList.contains('active')) {
             viewStr += v.id + " ";
         }
     });
     return viewStr.trim();
  });
  console.log("--- INDEX ACTIVE VIEWS ---", indexActiveView || "(none)");
  
  await browser.close();
})();
