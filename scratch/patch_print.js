const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

// Replace print buttons HTML
html = html.replace(
    /<button class="btn btn-primary" onclick="printBlank\(\)" style="flex:1;">🖨️ Blank<\/button>[\s\S]*?<button class="btn btn-primary" onclick="printAllPages\(\)".*?>🖨️ ALL<\/button>/,
    `<button class="btn btn-primary" onclick="printFullDraw()" style="flex:1;">🖨️ Full Draw Print</button>
            <button class="btn btn-primary" onclick="printManualDraw()" style="flex:1; background-color: #6366f1; border-color: #4f46e5;">🖨️ Manual Draw Print</button>
            <button class="btn btn-primary" onclick="printGenericDraw()" style="flex:1; background-color: #f59e0b; border-color: #d97706;">🖨️ Generic Draw Print</button>
            <button class="btn btn-primary" onclick="printBlankDraw()" style="flex:1; background-color: #94a3b8; border-color: #64748b;">🖨️ Blank Draw Print</button>`
);

// Add the JS functions for printing
html = html.replace(
    /function printBlank\(\) \{[\s\S]*?function printAllPages\(\) \{/,
    `function printFullDraw() { printHTML(buildChecklistHTML('Full Draw')); }
        function printManualDraw() { printHTML(buildChecklistHTML('Manual Draw (Write Numbers Below)')); }
        function printGenericDraw() { printHTML(buildChecklistHTML('Generic Draw')); }
        function printBlankDraw() { printHTML(buildChecklistHTML('Blank Draw')); }
        
        function printAllPages() {`
);

// Modify buildChecklistHTML to accept title
html = html.replace(
    /function buildChecklistHTML\(\) \{/,
    `function buildChecklistHTML(titleOverride) {
            const listTitle = titleOverride ? \`Monster Meat Raffle — \${titleOverride} Checklist\` : \`Tonight's Meat Raffle Prize Checklist\`;`
);
html = html.replace(
    /<h1>Tonight's Meat Raffle Prize Checklist<\/h1>/,
    `<h1>\${listTitle}</h1>`
);

fs.writeFileSync('admin.html', html);
