const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(/if \(nextType === 'countdown'\) \{[\s\S]*?return; \/\/ do not set interval, it locks here\n\s*\}/, 
`if (nextType === 'countdown') {
                    const nzNow = getNZDate();
                    const target = state.nextDrawTime ? new Date(state.nextDrawTime) : null;
                    const diff = target ? target.getTime() - nzNow.getTime() : 0;
                    
                    if (diff <= 2 * 60 * 60 * 1000 && diff > - (30 * 60 * 1000)) {
                        console.log('[Carousel] Locking onto countdown slide.');
                        clearInterval(slideInterval);
                        clearInterval(progressInterval);
                        return;
                    }
                }`);

fs.writeFileSync('index.html', content);
