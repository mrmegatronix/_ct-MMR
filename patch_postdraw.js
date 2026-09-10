const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(/if \(!activeDrawData\.manualDraw\) \{\n\s*steps\.push\('winning-numbers'\);\n\s*\}/, 
`const drawnNums = getActiveDrawnNumbers(state.draw);
                    if (!activeDrawData.manualDraw && drawnNums && drawnNums.length > 0) {
                        steps.push('winning-numbers');
                    }`);

fs.writeFileSync('index.html', content);
