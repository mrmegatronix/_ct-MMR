const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// Patch syncDrawFormFromState
html = html.replace(
    /syncEl\('cfg-thu-manual', thu.manualDraw === true, true\);/,
    `syncEl('cfg-thu-type', thu.type || (thu.manualDraw ? 'manual' : 'full'), false);`
);
html = html.replace(
    /syncEl\('cfg-sun-manual', sun.manualDraw === true, true\);/,
    `syncEl('cfg-sun-type', sun.type || (sun.manualDraw ? 'manual' : 'full'), false);`
);
// Add sync for generic
html = html.replace(
    /syncEl\('cfg-sun-vouchers-value',.*?\);/,
    `$&
            const gen = (state.draw && state.draw.generic) || {};
            syncEl('cfg-gen-min', gen.min !== undefined ? gen.min : 1, false);
            syncEl('cfg-gen-max', gen.max !== undefined ? gen.max : 9999, false);
            syncEl('cfg-gen-prizes', gen.cfgPrizes !== undefined ? gen.cfgPrizes : 10, false);
            syncEl('cfg-gen-show-remaining', gen.showRemaining || 'yes', false);
    `
);

// Patch updateDrawState
html = html.replace(
    /thu\.manualDraw = document\.getElementById\('cfg-thu-manual'\)\.checked;/,
    `thu.type = document.getElementById('cfg-thu-type').value;
            thu.manualDraw = (thu.type === 'manual');`
);
html = html.replace(
    /sun\.manualDraw = document\.getElementById\('cfg-sun-manual'\)\.checked;/,
    `sun.type = document.getElementById('cfg-sun-type').value;
            sun.manualDraw = (sun.type === 'manual');
            
            if (!state.draw.generic) state.draw.generic = {};
            const gen = state.draw.generic;
            gen.min = parseInt(document.getElementById('cfg-gen-min').value) || 1;
            gen.max = parseInt(document.getElementById('cfg-gen-max').value) || 9999;
            gen.cfgPrizes = parseInt(document.getElementById('cfg-gen-prizes').value) || 10;
            gen.showRemaining = document.getElementById('cfg-gen-show-remaining').value;
            if (!gen.drawnNumbers) gen.drawnNumbers = [];
            gen.prizesLeft = Math.max(0, gen.cfgPrizes - gen.drawnNumbers.length);
            if (gen.prizesLeft === 0 && gen.drawnNumbers.length > 0) gen.drawsFinishedTime = gen.drawsFinishedTime || new Date().toISOString();
            else gen.drawsFinishedTime = null;
    `
);

fs.writeFileSync('admin.html', html);
