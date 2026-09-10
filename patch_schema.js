const fs = require('fs');
let content = fs.readFileSync('admin.html', 'utf8');

const migrationLogic = `
            if (state && state.draw) {
                // If legacy properties exist directly on state.draw, migrate them
                if (state.draw.cfgPrizes100 !== undefined && !state.draw.thursday) {
                    state.draw.thursday = { ...state.draw };
                    delete state.draw.thursday.thursday;
                    delete state.draw.thursday.sunday;
                    delete state.draw.thursday.generic;
                }
            }
`;

content = content.replace(/function updateUI\(\) \{/, 
\`function updateUI() {
\${migrationLogic}\`);

fs.writeFileSync('admin.html', content);
