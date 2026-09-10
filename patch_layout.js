const fs = require('fs');
let content = fs.readFileSync('admin.html', 'utf8');

// Always wrap btn-groups
content = content.replace(/\.btn-group \{\s*display: flex;\s*gap: 0.5rem;\s*margin-bottom: 1rem;\s*\}/, 
`.btn-group { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }`);

content = content.replace(/button, \.btn \{ white-space: nowrap; overflow: hidden; text-overflow: ellipsis; \}/,
`button, .btn { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }`);

fs.writeFileSync('admin.html', content);
