const fs = require('fs');
if (!fs.existsSync('test-draw.html')) return;
let content = fs.readFileSync('test-draw.html', 'utf8');

// 1. Add data-type to slides
content = content.replace(/<div class="slide \${i === currentSlideIdx \? 'active' : ''}" style="\${bgStyle}" data-duration="\${slide.duration}">/g, 
'<div class="slide ${i === currentSlideIdx ? \'active\' : \'\'}" style="${bgStyle}" data-duration="${slide.duration}" data-type="${slide.type}">');

content = content.replace(/slideInterval = setInterval\(\(\) => \{/, 
`const currentSlide = document.querySelectorAll('.slide')[currentSlideIdx];
            if (currentSlide) {
                const type = currentSlide.getAttribute('data-type');
                if (type === 'countdown') {
                    const nzNow = getNZDate();
                    const target = state.nextDrawTime ? new Date(state.nextDrawTime) : null;
                    const diff = target ? target.getTime() - nzNow.getTime() : 0;
                    if (diff <= 15 * 60 * 1000 && diff > - (30 * 60 * 1000)) {
                        console.log('[Carousel] Locking onto countdown slide.');
                        clearInterval(progressInterval);
                        return; // Lock!
                    }
                }
            }

            slideInterval = setInterval(() => {`);

fs.writeFileSync('test-draw.html', content);
