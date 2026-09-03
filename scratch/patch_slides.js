const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace the slide generation logic
html = html.replace(
    /const advertSlides = \[\];[\s\S]*?(?=\s*const finalSlides = \[...visibleSlides, ...advertSlides\];)/,
    `const advertSlides = [];
            
            // Only show advert slides if it's a full draw AND not TBC
            const drawType = activeEvt.type || 'full';
            if (drawType === 'full' && !isTBC) {
                if (t100 > 0) {
                    advertSlides.push({
                        title: \`\${t100Str} x $100\`,
                        subtitle: "🥩 Premium Assorted Meat Trays to be won!! 🥩",
                        type: "advert",
                        advertType: "p100",
                        duration: 30000
                    });
                }
                if (t50 > 0) {
                    advertSlides.push({
                        title: \`\${t50Str} x $50 TRAYS\`,
                        subtitle: "🍗 Premium Assorted Meat Trays to be won!! 🍗",
                        type: "advert",
                        advertType: "p50",
                        duration: 30000
                    });
                }
                if (t25 > 0) {
                    advertSlides.push({
                        title: \`\${t25Str} x $25 TRAYS\`,
                        subtitle: "🥓 Premium Assorted Meat Trays to be won!! 🥓",
                        type: "advert",
                        advertType: "p25",
                        duration: 30000
                    });
                }
                if (vCount > 0) {
                    advertSlides.push({
                        title: \`\${vCountStr} x VOUCHERS\`,
                        subtitle: "🎫 Vouchers to be won!! 🎫",
                        type: "advert",
                        advertType: "vouchers",
                        duration: 30000
                    });
                }
                if (totalPrizes > 0) {
                    advertSlides.push({
                        title: \`A MASSIVE \${totalPoolStr}\`,
                        subtitle: \`in \${poolWording} \${totalPrizesStr} prizes!\`,
                        type: "advert",
                        advertType: "pool",
                        duration: 30000
                    });
                }
            }
`
);

fs.writeFileSync('index.html', html);
