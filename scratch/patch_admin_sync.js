const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

html = html.replace(
    /syncEl\('cfg-gen-show-remaining', gen.showRemaining \|\| 'yes', false\);/,
    `syncEl('cfg-gen-show-remaining', gen.showRemaining || 'yes', false);
            
            toggleConfigVisibility('thu-config-body', thu.enabled !== false);
            toggleConfigVisibility('sun-config-body', sun.enabled === true);`
);

fs.writeFileSync('admin.html', html);
