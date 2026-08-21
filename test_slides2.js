const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('https://mrmegatronix.github.io/_ct-MMR/index.html', { waitUntil: 'networkidle2' });
        
        // Wait 3 seconds to let fetchAndApplySlides complete
        await new Promise(r => setTimeout(r, 3000));
        
        const info = await page.evaluate(() => {
            const getActiveDrawData = (drawState) => {
                if (!drawState) return {};
                let evtName = drawState.activeEvent || 'thursday';
                if (evtName === 'sunday' && drawState.sunday && drawState.sunday.enabled === false) {
                    evtName = 'thursday';
                }
                return drawState[evtName] || drawState.thursday || drawState;
            };

            const cfg = typeof window.MMR_CONFIG !== 'undefined' ? window.MMR_CONFIG : null;
            return {
                stateStr: typeof window.state !== 'undefined' ? JSON.stringify(window.state).substring(0, 500) : 'no state',
                activeView: window.state ? window.state.activeView : 'null',
                slidesLen: window.state && window.state.slides ? window.state.slides.length : 0,
                slidesData: window.state && window.state.slides ? window.state.slides : [],
                cfgUrl: cfg ? cfg.GSHEETS_URL : null,
                domSlides: document.querySelectorAll('.slide').length,
                isPaused: typeof window.isPaused !== 'undefined' ? window.isPaused : null,
                activeEvtData: window.state && window.state.draw ? getActiveDrawData(window.state.draw) : null
            };
        });
        
        console.log(JSON.stringify(info, null, 2));
        
        await browser.close();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
