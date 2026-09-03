const fs = require('fs');

function patch(file) {
    let html = fs.readFileSync(file, 'utf8');

    if (!html.includes('@media (max-width: 768px)')) {
        html = html.replace(
            /<\/style>/,
            `
        @media (max-width: 768px) {
            body { padding: 1rem; }
            .card { padding: 1rem; }
            div[style*="display: grid"] {
                grid-template-columns: 1fr !important;
                gap: 0.5rem !important;
            }
            .header {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
        }
    </style>`
        );
        fs.writeFileSync(file, html);
    }
}

patch('admin.html');
patch('remote.html');
