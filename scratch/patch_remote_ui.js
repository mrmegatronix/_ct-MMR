const fs = require('fs');
let html = fs.readFileSync('remote.html', 'utf8');

// Give IDs to the rows
html = html.replace(/<!-- \$100 PRIZE -->\s*<div class="draw-control-row"/, '<!-- $100 PRIZE -->\n                <div id="row-prize-100" class="draw-control-row"');
html = html.replace(/<!-- \$50 PRIZE -->\s*<div class="draw-control-row"/, '<!-- $50 PRIZE -->\n                <div id="row-prize-50" class="draw-control-row"');
html = html.replace(/<!-- \$25 PRIZE -->\s*<div class="draw-control-row"/, '<!-- $25 PRIZE -->\n                <div id="row-prize-25" class="draw-control-row"');
html = html.replace(/<!-- BONUS PRIZE -->\s*<div class="draw-control-row"/, '<!-- BONUS PRIZE -->\n                <div id="row-prize-bonus" class="draw-control-row"');
html = html.replace(/<!-- VOUCHER -->\s*<div class="draw-control-row"/, '<!-- VOUCHER -->\n                <div id="row-prize-voucher" class="draw-control-row"');
html = html.replace(/<!-- Generic Number \(Gold\) -->\s*<div class="draw-control-row"/, '<!-- Generic Number (Gold) -->\n                <div id="row-prize-generic" class="draw-control-row"');

// Inject visibility toggle into updateViewButtons
html = html.replace(/function updateViewButtons\(\) \{/, 
`function updateViewButtons() {
            // Toggle visibility of draw controls based on type
            let activeEvtKey = state.draw.activeEvent || 'thursday';
            if (activeEvtKey === 'sunday' && (state.draw.sunday && state.draw.sunday.enabled === false)) {
                activeEvtKey = 'thursday';
            }
            const activeEvt = state.draw[activeEvtKey] || {};
            const type = activeEvt.type || 'full';
            
            const p100 = document.getElementById('row-prize-100');
            const p50 = document.getElementById('row-prize-50');
            const p25 = document.getElementById('row-prize-25');
            const pb = document.getElementById('row-prize-bonus');
            const pv = document.getElementById('row-prize-voucher');
            const pg = document.getElementById('row-prize-generic');
            
            if (p100 && p50 && p25 && pb && pv && pg) {
                if (type === 'full') {
                    p100.style.display = ''; p50.style.display = ''; p25.style.display = ''; pb.style.display = ''; pv.style.display = ''; pg.style.display = '';
                } else if (type === 'manual') {
                    p100.style.display = 'none'; p50.style.display = 'none'; p25.style.display = 'none'; pb.style.display = 'none'; pv.style.display = 'none'; pg.style.display = 'none';
                } else if (type === 'generic') {
                    p100.style.display = 'none'; p50.style.display = 'none'; p25.style.display = 'none'; pb.style.display = 'none'; pv.style.display = 'none'; pg.style.display = '';
                }
            }
`);

fs.writeFileSync('remote.html', html);
