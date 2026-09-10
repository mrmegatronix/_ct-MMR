const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Add data-type to slides
content = content.replace(/<div class="slide \${i === currentSlideIdx \? 'active' : ''}" style="\${bgStyle}" data-duration="\${slide.duration}">/g, 
'<div class="slide ${i === currentSlideIdx ? \'active\' : \'\'}" style="${bgStyle}" data-duration="${slide.duration}" data-type="${slide.type}">');

// 2. Modify startSlideTimer
content = content.replace(/const nextDur = customSlideDuration \|\| parseInt\(slides\[currentSlideIdx\].getAttribute\('data-duration'\)\) \|\| 30000;\s*startSlideTimer\(nextDur\);/, 
`const nextDur = customSlideDuration || parseInt(slides[currentSlideIdx].getAttribute('data-duration')) || 30000;
                const nextType = slides[currentSlideIdx].getAttribute('data-type');
                
                // If it's a countdown slide and draw hasn't happened yet (or just recently started), lock it
                if (nextType === 'countdown') {
                    const nzNow = getNZDate();
                    const target = state.nextDrawTime ? new Date(state.nextDrawTime) : null;
                    const diff = target ? target.getTime() - nzNow.getTime() : 0;
                    
                    // If we are within 2 hours before the draw, or it's draw time, lock the carousel
                    if (diff <= 2 * 60 * 60 * 1000 && diff > - (30 * 60 * 1000)) {
                        console.log('[Carousel] Locking onto countdown slide.');
                        return; // do not set interval, it locks here
                    }
                }
                
                startSlideTimer(nextDur);`);

fs.writeFileSync('index.html', content);
