const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Revert the previous patch
content = content.replace(/if \(nextType === 'countdown'\) \{[\s\S]*?return;\n\s*\}\n\s*\}/, '');

// Apply new patch inside startSlideTimer
content = content.replace(/if \(isPaused \|\| isLocked\) return;\n\s*slideInterval = setInterval\(\(\) => \{/, 
`if (isPaused || isLocked) return;
            
            const currentSlide = document.querySelectorAll('.slide')[currentSlideIdx];
            if (currentSlide) {
                const type = currentSlide.getAttribute('data-type');
                if (type === 'countdown') {
                    const nzNow = getNZDate();
                    const target = state.nextDrawTime ? new Date(state.nextDrawTime) : null;
                    const diff = target ? target.getTime() - nzNow.getTime() : 0;
                    if (diff <= 2 * 60 * 60 * 1000 && diff > - (30 * 60 * 1000)) {
                        console.log('[Carousel] Locking onto countdown slide.');
                        clearInterval(progressInterval);
                        return; // Lock!
                    }
                }
            }

            slideInterval = setInterval(() => {`);

fs.writeFileSync('index.html', content);
