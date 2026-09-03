const fs = require('fs');

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // JS references
    content = content.replace(/'custom'/g, "'generic'");
    content = content.replace(/"custom"/g, '"generic"');
    
    // CSS classes
    content = content.replace(/prize-custom/g, 'prize-generic');
    
    // UI Text
    content = content.replace(/Custom Draw/g, "Generic Draw");
    content = content.replace(/Custom Number/gi, "Generic Number");
    content = content.replace(/Redraw Custom/g, "Redraw Generic");
    
    // Function names
    content = content.replace(/openCustomDrawPage/g, 'openGenericDrawPage');
    content = content.replace(/isDrawCustom/g, 'isDrawGeneric');
    content = content.replace(/btn-draw-custom/g, 'btn-draw-generic');
    content = content.replace(/btnDrawCustom/g, 'btnDrawGeneric');

    fs.writeFileSync(file, content);
}

['admin.html', 'remote.html', 'index.html'].forEach(patchFile);
