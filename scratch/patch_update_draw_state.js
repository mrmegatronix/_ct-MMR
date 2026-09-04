const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

html = html.replace(
    /broadcast\(\);\s*\}\s*function syncDrawFormFromState\(\) \{/,
    `updateTotalsSummary();
            broadcast();
        }

        function syncDrawFormFromState() {`
);

fs.writeFileSync('admin.html', html);
