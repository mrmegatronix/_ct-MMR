const fs = require('fs');
let content = fs.readFileSync('admin.html', 'utf8');

content = content.replace(/if \(!state.draw.generic\) \{\n\s*state.draw.generic = \{ drawnNumbers: \[\], prizesLeft: 10, cfgPrizes: 10, currentNumber: null \};\n\s*\}/, 
`if (!state.draw.generic) {
                state.draw.generic = { drawnNumbers: [], prizesLeft: 10, cfgPrizes: 10, currentNumber: null };
            }
            const genPrizesEl = document.getElementById('cfg-gen-prizes');
            if (genPrizesEl) state.draw.generic.cfgPrizes = parseInt(genPrizesEl.value) || 0;
            
            const genTitleEl = document.getElementById('cfg-gen-title');
            if (genTitleEl) state.draw.generic.title = genTitleEl.value;
            
            const genCountEl = document.getElementById('cfg-gen-countdown');
            if (genCountEl) state.draw.generic.showRemaining = genCountEl.value;
            `);

fs.writeFileSync('admin.html', content);
