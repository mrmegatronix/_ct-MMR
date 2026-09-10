const fs = require('fs');
let content = fs.readFileSync('admin.html', 'utf8');

// Inside syncDrawFormFromState, add generic sync
content = content.replace(/syncEl\('drawTime', state.nextDrawTime, false\);/, 
`const gen = (state.draw && state.draw.generic) || {};
            syncEl('cfg-gen-prizes', gen.cfgPrizes !== undefined ? gen.cfgPrizes : 10, false);
            syncEl('cfg-gen-title', gen.title || '', false);
            syncEl('cfg-gen-countdown', gen.showRemaining || 'yes', false);
            syncEl('drawTime', state.nextDrawTime, false);`);

fs.writeFileSync('admin.html', content);
