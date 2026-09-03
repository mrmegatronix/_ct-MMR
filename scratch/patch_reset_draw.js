const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

// Replace resetDraw
html = html.replace(
    /function resetDraw\(\) \{[\s\S]*?updateTotalsSummary\(\);\s*broadcast\(\);\s*\}\s*\}\s*\}/,
    `function resetDraw() {
            if (confirm('Archive this draw and start fresh? (This sets prizes to 0 / T.B.C.)')) {
                // Archive current draw to firebase
                if (fbDbUrl) {
                    const activeEvtKey = state.draw.activeEvent || 'thursday';
                    const activeEvt = state.draw[activeEvtKey] || {};
                    const archiveData = {
                        timestamp: new Date().toISOString(),
                        event: activeEvtKey,
                        drawData: activeEvt
                    };
                    fetch(\`\${fbDbUrl}/mmr_archive_draws.json\`, {
                        method: 'POST',
                        body: JSON.stringify(archiveData)
                    }).catch(e => console.error("Archive error:", e));
                }
                
                // Now reset active event
                const evt = state.draw.activeEvent || 'thursday';
                if (state.draw[evt]) {
                    state.draw[evt].drawnNumbers = [];
                    state.draw[evt].currentNumber = '---';
                    state.draw[evt].currentPrize = null;
                    state.draw[evt].drawsFinishedTime = null;
                    state.draw[evt].isConfirmedFinished = false;
                    state.draw[evt].cfgPrizes100 = 0;
                    state.draw[evt].cfgPrizes50 = 0;
                    state.draw[evt].cfgPrizes25 = 0;
                    state.draw[evt].prizes100 = 0;
                    state.draw[evt].prizes50 = 0;
                    state.draw[evt].prizes25 = 0;
                    state.draw[evt].prizesLeft = 0;
                }
                
                // If it's generic, reset that too
                if (state.draw.generic) {
                    state.draw.generic.drawnNumbers = [];
                    state.draw.generic.cfgPrizes = 0;
                    state.draw.generic.prizesLeft = 0;
                    state.draw.generic.drawsFinishedTime = null;
                }
                
                // Clear the top level display state
                state.draw.drawnNumbers = [];
                state.draw.currentNumber = '---';
                state.draw.currentPrize = null;
                state.draw.drawsFinishedTime = null;
                
                document.getElementById('cfg-thu-prizes-100').value = 0;
                document.getElementById('cfg-thu-prizes-50').value = 0;
                document.getElementById('cfg-thu-prizes-25').value = 0;
                document.getElementById('cfg-sun-prizes-100').value = 0;
                document.getElementById('cfg-sun-prizes-50').value = 0;
                document.getElementById('cfg-sun-prizes-25').value = 0;
                document.getElementById('cfg-gen-prizes').value = 0;
                
                updateDrawState();
                state.activeView = 'slides'; // Go back to slides!
                broadcast();
                showGlobalStatus('Draw Archived & Reset to T.B.C.!', 'green');
            }
        }`
);

// Add listener in admin for 'reset_draw' command from remote
html = html.replace(
    /if \(data\.type === 'SLIDE_CMD'\) \{/,
    `if (data.type === 'CMD' && data.payload === 'reset_draw') {
                if (typeof resetDraw === 'function') resetDraw();
                return;
            }
            if (data.type === 'SLIDE_CMD') {`
);

fs.writeFileSync('admin.html', html);
