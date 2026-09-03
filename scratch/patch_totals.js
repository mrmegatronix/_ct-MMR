const fs = require('fs');

function patch(file) {
    let html = fs.readFileSync(file, 'utf8');

    html = html.replace(
        /const thuVouchers = parseInt\(document.getElementById\('cfg-thu-vouchers-value'\).value\) \|\| 0;/,
        `const thuVouchers = parseInt(document.getElementById('cfg-thu-vouchers-value').value) || 0;
            const genPrizes = parseInt(document.getElementById('cfg-gen-prizes')?.value) || 0;`
    );

    html = html.replace(
        /const totalCount = thu100 \+ thu50 \+ thu25 \+ sun100 \+ sun50 \+ sun25 \+ \(parseInt\(document.getElementById\('cfg-sun-vouchers-count'\).value\) \|\| 0\) \+ \(parseInt\(document.getElementById\('cfg-thu-vouchers-count'\).value\) \|\| 0\);/,
        `const totalCount = thu100 + thu50 + thu25 + sun100 + sun50 + sun25 + (parseInt(document.getElementById('cfg-sun-vouchers-count').value) || 0) + (parseInt(document.getElementById('cfg-thu-vouchers-count').value) || 0) + genPrizes;`
    );

    fs.writeFileSync(file, html);
}

patch('admin.html');
