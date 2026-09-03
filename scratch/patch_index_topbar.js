const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
    /const ptBar = document\.getElementById\('prizes-top-bar'\);\s*if \(ptBar\) \{[\s\S]*?ptBar\.innerHTML = html;\s*\}/,
    `const ptBar = document.getElementById('prizes-top-bar');
            if (ptBar) {
                let html = '';
                const drawType = activeDrawData.type || 'full';
                const isGenericDrawBtn = activeDrawData.currentPrize === 'generic';
                
                if (drawType === 'generic' || isGenericDrawBtn) {
                    const gen = (state.draw && state.draw.generic) || {};
                    if (gen.showRemaining === 'yes') {
                        const genLeft = gen.prizesLeft !== undefined ? gen.prizesLeft : (gen.cfgPrizes || 0);
                        html += \`<div class="prize-counter-pill" style="border-color: #f59e0b; box-shadow: 0 0 10px rgba(245,158,11,0.4); animation: popIn 0.4s ease-out, pillPulse 2s infinite ease-in-out;">
                                    <span style="color: #f59e0b;">Generic Prizes Left</span>
                                    <span class="val">\${genLeft}</span>
                                 </div>\`;
                    }
                } else if (drawType === 'full') {
                    if (p100Val > 0) {
                        html += \`<div class="prize-counter-pill" style="border-color: #ef4444; box-shadow: 0 0 10px rgba(239,68,68,0.4); animation: popIn 0.4s ease-out, pulseRed 2s infinite ease-in-out;">
                                    <span style="color: #ef4444;">$100 Prize</span>
                                    <span class="val">\${p100Val}</span>
                                 </div>\`;
                    }
                    if (p50Val > 0) {
                        html += \`<div class="prize-counter-pill" style="border-color: #3b82f6; box-shadow: 0 0 10px rgba(59,130,246,0.4); animation: popIn 0.4s ease-out, pulseBlue 2s infinite ease-in-out;">
                                    <span style="color: #3b82f6;">$50 Prize</span>
                                    <span class="val">\${p50Val}</span>
                                 </div>\`;
                    }
                    if (p25Val > 0) {
                        html += \`<div class="prize-counter-pill" style="border-color: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.4); animation: popIn 0.4s ease-out, pulseGreen 2s infinite ease-in-out;">
                                    <span style="color: #10b981;">$25 Prize</span>
                                    <span class="val">\${p25Val}</span>
                                 </div>\`;
                    }
                    if (totalRemaining > 0) {
                        const alertColor = totalRemaining <= 5 ? '#f43f5e' : '#ffffff';
                        html += \`<div class="prize-counter-pill" style="border-color: \${alertColor}; box-shadow: 0 0 15px \${alertColor}66; margin-left: 2rem;">
                                    <span style="color: \${alertColor};">Total Left</span>
                                    <span class="val" style="color: \${alertColor};">\${totalRemaining}</span>
                                 </div>\`;
                    } else {
                        html += \`<div class="prize-counter-pill" style="border-color: #ef4444; box-shadow: 0 0 15px rgba(239,68,68,0.6);">
                                    <span style="color: #ef4444;">ALL PRIZES DRAWN</span>
                                 </div>\`;
                    }
                }
                ptBar.innerHTML = html;
            }`
);

fs.writeFileSync('index.html', html);
