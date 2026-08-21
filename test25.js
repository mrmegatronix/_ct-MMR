const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'] 
  });
  
  // Open TV display, block BroadcastChannel to simulate physically different devices
  const pageIndex = await browser.newPage();
  await pageIndex.evaluateOnNewDocument(() => {
    window.BroadcastChannel = undefined; // Force it to rely purely on Firebase
  });
  pageIndex.on('console', msg => console.log(`[INDEX] ${msg.type()}: ${msg.text()}`));
  
  await pageIndex.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Open Remote, block BroadcastChannel to simulate physically different devices
  const pageRemote = await browser.newPage();
  await pageRemote.evaluateOnNewDocument(() => {
    window.BroadcastChannel = undefined; 
  });
  pageRemote.on('console', msg => console.log(`[REMOTE] ${msg.type()}: ${msg.text()}`));
  
  await pageRemote.goto('file:///run/media/zeus/6TB-1/__GITHUB NUC/_ct-MMR/remote.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking 'Draw Screen' on remote (no broadcast channel)...");
  await pageRemote.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button'));
     const b = btns.find(b => b.textContent.includes('🎯 Draw Screen'));
     if (b) {
         b.click();
     }
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  const activeView = await pageIndex.evaluate(() => {
     return document.querySelector('.view.active')?.id || 'NONE';
  });
  console.log("Active View on Index after Draw Screen click (over Firebase):", activeView);
  
  await browser.close();
})();
