const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'] 
  });
  
  // Open TV display
  const pageIndex = await browser.newPage();
  pageIndex.on('console', msg => console.log(`[INDEX] ${msg.type()}: ${msg.text()}`));
  
  await pageIndex.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Open Remote
  const pageRemote = await browser.newPage();
  pageRemote.on('console', msg => console.log(`[REMOTE] ${msg.type()}: ${msg.text()}`));
  
  await pageRemote.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/remote.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking 'Draw Screen' on remote...");
  await pageRemote.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button'));
     const b = btns.find(b => b.textContent.includes('🎯 Draw Screen'));
     if (b) {
         b.click();
     }
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  const drawViewDisplayStyle = await pageIndex.evaluate(() => {
     const el = document.getElementById('view-draw');
     return window.getComputedStyle(el).display;
  });
  const drawViewOpacity = await pageIndex.evaluate(() => {
     const el = document.getElementById('view-draw');
     return window.getComputedStyle(el).opacity;
  });
  const drawViewPointerEvents = await pageIndex.evaluate(() => {
     const el = document.getElementById('view-draw');
     return window.getComputedStyle(el).pointerEvents;
  });
  console.log(`Draw View Computed CSS - Display: ${drawViewDisplayStyle}, Opacity: ${drawViewOpacity}, PointerEvents: ${drawViewPointerEvents}`);
  
  const hasActiveClass = await pageIndex.evaluate(() => {
     const el = document.getElementById('view-draw');
     return el.classList.contains('active');
  });
  console.log(`Draw View has 'active' class: ${hasActiveClass}`);
  
  await browser.close();
})();
