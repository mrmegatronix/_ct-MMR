const fs = require('fs');

function patch(file) {
    let html = fs.readFileSync(file, 'utf8');
    
    html = html.replace(/function finishAndEndDraw\(day\) \{[\s\S]*?showGlobalStatus.*?;\s*\}/,
        `function finishAndEndDraw(day) {
            if (confirm(\`Are you sure you want to Finish & End the \${day} draw? This will trigger the Congrats screen.\`)) {
                let drawType = 'full';
                if (day === 'thursday') {
                    state.draw.thursday.isConfirmedFinished = true;
                    state.draw.thursday.drawsFinishedTime = state.draw.thursday.drawsFinishedTime || new Date().toISOString();
                    drawType = state.draw.thursday.type || 'full';
                } else if (day === 'sunday') {
                    state.draw.sunday.isConfirmedFinished = true;
                    state.draw.sunday.drawsFinishedTime = state.draw.sunday.drawsFinishedTime || new Date().toISOString();
                    drawType = state.draw.sunday.type || 'full';
                }
                
                // If it's a full draw, show winning-numbers, otherwise show congrats
                if (drawType === 'manual' || drawType === 'generic') {
                    state.activeView = 'congrats';
                } else {
                    state.activeView = 'winning-numbers';
                }
                
                updateState(state);
                showGlobalStatus(\`\${day.toUpperCase()} Draw Finished! Congrats screen active.\`, 'blue');
            }
        }`);
        
    fs.writeFileSync(file, html);
}

patch('admin.html');
patch('remote.html');
