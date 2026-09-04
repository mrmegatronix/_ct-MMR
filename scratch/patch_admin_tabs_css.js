const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

if (!html.includes('.tab-bar')) {
    html = html.replace(
        /<\/style>/,
        `
        .tab-bar {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 0.5rem;
            overflow-x: auto;
        }
        .tab-btn {
            background: var(--surface);
            color: var(--text-muted);
            border: 1px solid var(--border);
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: bold;
            white-space: nowrap;
            transition: all 0.2s;
        }
        .tab-btn:hover { background: var(--border); color: var(--text); }
        .tab-btn.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
    </style>`
    );
    
    // Add Javascript for tab switching
    html = html.replace(
        /<\/head>/,
        `
    <script>
        function switchAdminTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            document.getElementById('btn-' + tabId).classList.add('active');
        }
    </script>
</head>`
    );

    fs.writeFileSync('admin.html', html);
}
