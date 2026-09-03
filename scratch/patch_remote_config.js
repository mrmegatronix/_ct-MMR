const fs = require('fs');

let html = fs.readFileSync('remote.html', 'utf8');

// 1. CSS for collapsibles
if (!html.includes('.collapsible-config')) {
    html = html.replace('</style>', `
        .collapsible-config {
            cursor: pointer;
            user-select: none;
        }
        .collapsible-config::after {
            content: '\\25BC';
            float: right;
            transition: transform 0.2s;
        }
        .collapsible-config.collapsed::after {
            transform: rotate(-90deg);
        }
        .config-body {
            transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
            max-height: 2000px;
            opacity: 1;
            overflow: hidden;
        }
        .config-body.collapsed {
            max-height: 0;
            opacity: 0;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            border-top: none !important;
        }
    </style>`);
}

// 2. Thursday Config HTML
html = html.replace(
    /<h3 style="margin-top: 0; color: #3b82f6; display: flex; justify-content: space-between;">[\s\S]*?<\/h3>/,
    `<h3 class="collapsible-config" onclick="toggleConfig(this, 'thu-config-body')" style="margin-top: 0; color: #3b82f6; display: flex; justify-content: space-between; align-items: center;">
                Thursday Draw
                <div onclick="event.stopPropagation()">
                    <label style="display:inline; margin-right: 5px;">Enable</label>
                    <input type="checkbox" id="cfg-thu-enabled" style="width: auto;" onchange="updateThursdayConfig(); toggleConfigVisibility('thu-config-body', this.checked)">
                    <label style="display:inline; margin-left: 5px; margin-right: 5px;">Type:</label>
                    <select id="cfg-thu-type" onchange="updateThursdayConfig()" style="padding: 2px 5px; border-radius: 4px; background: var(--bg); color: var(--text); border: 1px solid var(--border);">
                        <option value="full">Full Draw</option>
                        <option value="manual">Manual Draw</option>
                        <option value="generic">Generic Draw</option>
                    </select>
                </div>
            </h3>`
);
html = html.replace(
    /(<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0\.5rem;">)([\s\S]*?)(<button class="btn" id="btn-confirm-thu" onclick="confirmThursday\(\)".*?<\/button>)/,
    `<div id="thu-config-body" class="config-body">$1$2<button class="btn" onclick="finishAndEndDraw('thursday')" style="background-color: #3b82f6; color: white; border: none; width: 100%;">Finish & End Draw</button></div>`
);


// 3. Sunday Config HTML
html = html.replace(
    /<h3 style="margin-top: 0; color: #ef4444; display: flex; justify-content: space-between;">[\s\S]*?<\/h3>/,
    `<h3 class="collapsible-config collapsed" onclick="toggleConfig(this, 'sun-config-body')" style="margin-top: 0; color: #ef4444; display: flex; justify-content: space-between; align-items: center;">
                Sunday Draw
                <div onclick="event.stopPropagation()">
                    <label style="display:inline; margin-right: 5px;">Enable</label>
                    <input type="checkbox" id="cfg-sun-enabled" style="width: auto;" onchange="updateSundayConfig(); toggleConfigVisibility('sun-config-body', this.checked)">
                    <label style="display:inline; margin-left: 5px; margin-right: 5px;">Type:</label>
                    <select id="cfg-sun-type" onchange="updateSundayConfig()" style="padding: 2px 5px; border-radius: 4px; background: var(--bg); color: var(--text); border: 1px solid var(--border);">
                        <option value="full">Full Draw</option>
                        <option value="manual">Manual Draw</option>
                        <option value="generic">Generic Draw</option>
                    </select>
                </div>
            </h3>`
);
html = html.replace(
    /(<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0\.5rem;">)([\s\S]*?)(<button class="btn" id="btn-confirm-sun" onclick="confirmSunday\(\)".*?<\/button>)/,
    `<div id="sun-config-body" class="config-body collapsed">$1$2<button class="btn" onclick="finishAndEndDraw('sunday')" style="background-color: #ef4444; color: white; border: none; width: 100%;">Finish & End Draw</button></div>`
);


// 4. Generic Config HTML (add after Sunday)
html = html.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*<!-- Financials Tab -->/,
    `</div>
                    </div>
                </div>
                <!-- Generic Draw Config -->
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                    <h3 class="collapsible-config collapsed" onclick="toggleConfig(this, 'gen-config-body')" style="margin-top: 0; color: #f59e0b; display: flex; justify-content: space-between; align-items: center;">
                        Generic Draw Config
                    </h3>
                    <div id="gen-config-body" class="config-body collapsed">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.5rem;">
                            <div class="form-group">
                                <label>Min Ticket</label>
                                <input type="number" id="cfg-gen-min" value="0" onchange="updateGenericConfig()">
                            </div>
                            <div class="form-group">
                                <label>Max Ticket</label>
                                <input type="number" id="cfg-gen-max" max="9999" value="9999" onchange="updateGenericConfig()">
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.5rem;">
                            <div class="form-group">
                                <label>Number of Prizes</label>
                                <input type="number" id="cfg-gen-prizes" value="10" onchange="updateGenericConfig()">
                            </div>
                            <div class="form-group">
                                <label>Show Remaining on Display?</label>
                                <select id="cfg-gen-show-remaining" onchange="updateGenericConfig()" style="width: 100%; padding: 0.8rem; border-radius: 0.5rem; background: var(--bg); color: var(--text); border: 1px solid var(--border);">
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                        </div>
                        <button class="btn" onclick="updateGenericConfig()" style="background-color: #b45309; color: white; border: none; width: 100%; margin-bottom: 0.5rem;">💾 Update Generic Config</button>
                    </div>
                </div>
            </div>
            <!-- Financials Tab -->`
);

// 5. Replace manualDraw setting in syncState and updateThursdayConfig/updateSundayConfig
html = html.replace(
    /document\.getElementById\('cfg-thu-manual'\)\.checked = !!thu\.manualDraw;/,
    `document.getElementById('cfg-thu-type').value = thu.type || (thu.manualDraw ? 'manual' : 'full');`
);
html = html.replace(
    /document\.getElementById\('cfg-sun-manual'\)\.checked = !!sun\.manualDraw;/,
    `document.getElementById('cfg-sun-type').value = sun.type || (sun.manualDraw ? 'manual' : 'full');
            const gen = (state.draw && state.draw.generic) || {};
            if (document.activeElement !== document.getElementById('cfg-gen-min')) document.getElementById('cfg-gen-min').value = gen.min !== undefined ? gen.min : 1;
            if (document.activeElement !== document.getElementById('cfg-gen-max')) document.getElementById('cfg-gen-max').value = gen.max !== undefined ? gen.max : 9999;
            if (document.activeElement !== document.getElementById('cfg-gen-prizes')) document.getElementById('cfg-gen-prizes').value = gen.cfgPrizes !== undefined ? gen.cfgPrizes : 10;
            if (document.activeElement !== document.getElementById('cfg-gen-show-remaining')) document.getElementById('cfg-gen-show-remaining').value = gen.showRemaining || 'yes';`
);

html = html.replace(
    /thu\.manualDraw = document\.getElementById\('cfg-thu-manual'\)\.checked;/,
    `thu.type = document.getElementById('cfg-thu-type').value;
            thu.manualDraw = (thu.type === 'manual');`
);
html = html.replace(
    /sun\.manualDraw = document\.getElementById\('cfg-sun-manual'\)\.checked;/,
    `sun.type = document.getElementById('cfg-sun-type').value;
            sun.manualDraw = (sun.type === 'manual');`
);

// 6. Add the new functions
if (!html.includes('function toggleConfig(')) {
    html = html.replace('</script>', `
        function toggleConfig(headerEl, bodyId) {
            headerEl.classList.toggle('collapsed');
            document.getElementById(bodyId).classList.toggle('collapsed');
        }
        function toggleConfigVisibility(bodyId, isEnabled) {
            const body = document.getElementById(bodyId);
            const header = body.previousElementSibling;
            if (isEnabled) {
                body.classList.remove('collapsed');
                header.classList.remove('collapsed');
            } else {
                body.classList.add('collapsed');
                header.classList.add('collapsed');
            }
        }
        function finishAndEndDraw(day) {
            if (confirm(\`Are you sure you want to Finish & End the \${day} draw? This will trigger the Congrats screen.\`)) {
                if (day === 'thursday') {
                    state.draw.thursday.isConfirmedFinished = true;
                    state.draw.thursday.drawsFinishedTime = state.draw.thursday.drawsFinishedTime || new Date().toISOString();
                } else if (day === 'sunday') {
                    state.draw.sunday.isConfirmedFinished = true;
                    state.draw.sunday.drawsFinishedTime = state.draw.sunday.drawsFinishedTime || new Date().toISOString();
                }
                state.activeView = 'congrats';
                updateState(state);
                showGlobalStatus(\`\${day.toUpperCase()} Draw Finished! Congrats screen active.\`, 'blue');
            }
        }
        function updateGenericConfig() {
            if (!state.draw) state.draw = {};
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
            updateState(state);
            showGlobalStatus('Generic Config Updated & Synced!', 'orange');
        }
    </script>`);
}

fs.writeFileSync('remote.html', html);
