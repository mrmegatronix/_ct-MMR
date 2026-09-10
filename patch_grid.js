const fs = require('fs');
let content = fs.readFileSync('admin.html', 'utf8');

// Replace all hardcoded 4 column grids with auto-fit
content = content.replace(/grid-template-columns: repeat\(4, 1fr\)/g, 'grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))');

// The generic draw config grid:
content = content.replace(/grid-template-columns: 100px 150px 100px/g, 'grid-template-columns: repeat(auto-fit, minmax(100px, 1fr))');

// Save
fs.writeFileSync('admin.html', content);
