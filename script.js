        document.write('<script src="config.js?v=' + Date.now() + '"><\/script>');
    </script>
    <script>
        // ── Security Helpers ─────────────────────────────────────────────
        function sanitize(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        }
        function safeUrl(url) {
            if (!url) return '';
            const u = String(url).trim();
            // Allow relative paths (e.g. 'avatar.png') and http(s)
            return /^(https?:\/\/|\/|\.)/i.test(u) ? u : u; // Be more permissive for local assets
        }

        function getNZDate() {
            const tz = (window.MMR_CONFIG && window.MMR_CONFIG.TIMEZONE) || 'Pacific/Auckland';
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric',
                hourCycle: 'h23'
            }).formatToParts(new Date());
            const v = {};
            parts.forEach(p => v[p.type] = p.value);
            return new Date(v.year, v.month - 1, v.day, v.hour, v.minute, v.second);
        }

        function getNextThursday7PM() {
            const nzDate = getNZDate();
            const targetDay = (window.MMR_CONFIG && window.MMR_CONFIG.TARGET_DAY) ?? 4;
            const targetHour = (window.MMR_CONFIG && window.MMR_CONFIG.TARGET_HOUR) ?? 19;
            
            let daysUntilTarget = (targetDay + 7 - nzDate.getDay()) % 7;
            if (daysUntilTarget === 0 && nzDate.getHours() >= targetHour) {
                daysUntilTarget = 7;
            }
            nzDate.setDate(nzDate.getDate() + daysUntilTarget);
            
            const yr = nzDate.getFullYear();
            const mo = String(nzDate.getMonth() + 1).padStart(2, '0');
            const da = String(nzDate.getDate()).padStart(2, '0');
            const hr = String(targetHour).padStart(2, '0');
            return `${yr}-${mo}-${da}T${hr}:00`;
        }

        // State
        let slotsRolling = false;
        let rollingPrize = null;
        let congratsStartTime = null;
        let currentSlideIdx = 0;
        let isPaused = false;
        let isLocked = false;
        let customSlideDuration = null;
        function getActiveDrawData(drawState) {
            if (!drawState) return {};
            let evtName = drawState.activeEvent || 'thursday';
            if (evtName === 'sunday' && drawState.sunday && drawState.sunday.enabled === false) {
                evtName = 'thursday';
            }
            const evt = drawState[evtName] || drawState.thursday || drawState;
            if (evt.currentPrize === 'generic' && drawState.generic) {
                return { ...drawState.generic, currentPrize: 'generic', type: 'generic' };
            }
            return evt;
        }

        let state = {
            activeView: 'slides',
            lastSlideCmdTs: Date.now(),
            nextDrawTime: getNextThursday7PM(),
            slides: [
                { type: "countdown", title: "Time Until Draw", duration: 30000 }
            ],
            draw: {
                activeEvent: 'thursday',
                thursday: {
                    cfgPrizes100: 10,
                    cfgPrizes50: 16,
                    cfgPrizes25: 40,
                    prizes100: 10,
                    prizes50: 16,
                    prizes25: 40,
                    drawnNumbers: [],
                    prizesLeft: 66
                },
                isRolling: false,
                currentNumber: '---',
                drawnNumbers: [],
                prizesLeft: 66
            }
        };

        // DOM Elements
        const views = {
            slides: document.getElementById('view-slides'),
            draw: document.getElementById('view-draw'),
            congrats: document.getElementById('view-congrats'),
            'winning-numbers': document.getElementById('view-winning-numbers'),
            'congrats-video': document.getElementById('view-congrats-video')
        };
        const slidesWrapper = document.getElementById('slides-wrapper');
        const progressBar = document.getElementById('progress-bar');
        const lottoNumberEl = document.getElementById('lottery-number');
        const drawnListEl = document.getElementById('drawn-list');
        const prizesCountEl = document.getElementById('prizes-count');
        const confettiContainer = document.getElementById('confetti-container');

        // Broadcast Channel setup
        const bc = new BroadcastChannel('mmr_sync');
        bc.onmessage = (event) => {
            const data = event.data;
            if (data.type === 'STATE_UPDATE') {
                const cleanPayload = { ...data.payload };
                delete cleanPayload.slides;
                updateState(cleanPayload);
            }
            if (data.type === 'START_ROLL') {
                if (data.payload && data.payload.ts) lastFbCmdTs = Math.max(lastFbCmdTs, data.payload.ts);
                startLotteryRoll(data.payload ? data.payload.prize : null, data.payload ? data.payload.speed : null);
            }
            if (data.type === 'STOP_ROLL') {
                if (data.payload && data.payload.ts) lastFbCmdTs = Math.max(lastFbCmdTs, data.payload.ts);
                stopLotteryRoll(data.payload ? data.payload.number : null, data.payload ? data.payload.prize : null, data.payload ? data.payload.speed : null);
            }
            if (data.type === 'CONFETTI') {
                triggerConfetti();
            }
            if (data.type === 'VOICE_TOGGLE') {
                localStorage.setItem('mmr_voice_on', data.payload.voiceOn);
            }
            if (data.type === 'SLIDE_CMD') {
                handleSlideCmd(data.payload.cmd);
            }
            if (data.type === 'FORCE_SYNC') {
                fetchAndApplySlides();
            }
            if (data.type === 'DEMO_MODE') {
                showDemoBanner(data.payload);
            }
        };

        function showDemoBanner(show) {
            let banner = document.getElementById('demo-banner');
            if (show) {
                if (!banner) {
                    banner = document.createElement('div');
                    banner.id = 'demo-banner';
                    banner.style.position = 'fixed';
                    banner.style.top = '0';
                    banner.style.width = '100%';
                    banner.style.background = 'repeating-linear-gradient(45deg, #ef4444, #ef4444 20px, #f59e0b 20px, #f59e0b 40px)';
                    banner.style.color = 'white';
                    banner.style.fontWeight = 'bold';
                    banner.style.textAlign = 'center';
                    banner.style.padding = '10px';
                    banner.style.zIndex = '999999';
                    banner.style.fontSize = '1.5rem';
                    banner.innerText = 'DEMO MODE - NOT A REAL DRAW';
                    document.body.appendChild(banner);
                }
                banner.style.display = 'block';
            } else if (banner) {
                banner.style.display = 'none';
            }
        }

        function handleSlideCmd(cmd) {
            if (cmd === 'next') nextSlide(true);
            if (cmd === 'prev') prevSlide(true);
            if (cmd === 'toggle') toggleSlidePlay(true);
        }

        function nextSlide(fromRemote) {
            const slides = document.querySelectorAll('.slide');
            if (slides.length === 0) return;
            slides[currentSlideIdx].classList.remove('active');
            currentSlideIdx = (currentSlideIdx + 1) % slides.length;
            slides[currentSlideIdx].classList.add('active');
            playActiveCarousel();
            const nextDur = parseInt(slides[currentSlideIdx].getAttribute('data-duration')) || 30000;
            startSlideTimer(nextDur);
            if (!fromRemote) {
                bc.postMessage({ type: 'SLIDE_CMD', payload: { cmd: 'next' } });
                writeFirebase({ slideCmd: { cmd: 'next', ts: Date.now() } });
            }
        }

        function prevSlide(fromRemote) {
            const slides = document.querySelectorAll('.slide');
            if (slides.length === 0) return;
            slides[currentSlideIdx].classList.remove('active');
            currentSlideIdx = (currentSlideIdx - 1 + slides.length) % slides.length;
            slides[currentSlideIdx].classList.add('active');
            playActiveCarousel();
            const nextDur = parseInt(slides[currentSlideIdx].getAttribute('data-duration')) || 30000;
            startSlideTimer(nextDur);
            if (!fromRemote) {
                bc.postMessage({ type: 'SLIDE_CMD', payload: { cmd: 'prev' } });
                writeFirebase({ slideCmd: { cmd: 'prev', ts: Date.now() } });
            }
        }

        function toggleSlidePlay(fromRemote) {
            isPaused = !isPaused;
            const btn = document.getElementById('play-pause-btn');
            if (btn) {
                btn.innerText = isPaused ? '▶' : '⏸';
            }
            const slides = document.querySelectorAll('.slide');
            if (slides.length === 0) return;
            const nextDur = parseInt(slides[currentSlideIdx].getAttribute('data-duration')) || 30000;
            startSlideTimer(nextDur);
            if (!fromRemote) {
                bc.postMessage({ type: 'SLIDE_CMD', payload: { cmd: 'toggle' } });
                writeFirebase({ slideCmd: { cmd: 'toggle', ts: Date.now() } });
            }
        }

        let winnersInterval = null;
        function playActiveCarousel() {
            clearInterval(winnersInterval);
            const activeSlide = document.querySelector('.slide.active');
            if (!activeSlide) return;
            
            const carousel = activeSlide.querySelector('.winners-carousel');
            if (!carousel) return;
            
            const imgs = carousel.querySelectorAll('img');
            if (imgs.length <= 1) {
                if (imgs.length === 1) imgs[0].classList.add('active');
                return;
            }
            
            let activeIdx = 0;
            imgs.forEach((img, i) => {
                if (i === 0) img.classList.add('active');
                else img.classList.remove('active');
            });
            
            const slideDur = parseInt(activeSlide.getAttribute('data-duration')) || 30000;
            const rotateInterval = Math.max(2500, Math.min(5000, slideDur / imgs.length));
            
            winnersInterval = setInterval(() => {
                imgs[activeIdx].classList.remove('active');
                activeIdx = (activeIdx + 1) % imgs.length;
                imgs[activeIdx].classList.add('active');
            }, rotateInterval);
        }

        let lastRenderedSlidesJson = '';
        let lastActiveView = '';
        let postDrawLoopInterval = null;

        function updateState(newState) {
            if (newState && newState !== state) {
                const { draw, ...rest } = newState;
                if (draw) {
                    state.draw = { ...(state.draw || {}), ...draw };
                }
                state = { ...state, ...rest };
                
                // CRITICAL FIX: Rescue corrupted localStorage where state.draw was deleted
                if (!state.draw) {
                    state.draw = { thursday: {}, sunday: {} };
                }
            }

            // Check total configured prizes
            const activeEvtData = getActiveDrawData(state.draw);
            const cfgPrizes100 = activeEvtData.cfgPrizes100 !== undefined ? activeEvtData.cfgPrizes100 : (activeEvtData.prizes100 ?? 10);
            const cfgPrizes50 = activeEvtData.cfgPrizes50 !== undefined ? activeEvtData.cfgPrizes50 : (activeEvtData.prizes50 ?? 16);
            const cfgPrizes25 = activeEvtData.cfgPrizes25 !== undefined ? activeEvtData.cfgPrizes25 : (activeEvtData.prizes25 ?? 40);
            const hasPrizes = (cfgPrizes100 + cfgPrizes50 + cfgPrizes25) > 0;

            // Intercept and auto-correct activeView if outside congrats window (only when prizes > 0)
            if (hasPrizes && (state.activeView === 'congrats' || state.activeView === 'congrats-video')) {
                const nzDate = getNZDate();
                const day = nzDate.getDay();
                const hour = nzDate.getHours();
                const targetDay = (window.MMR_CONFIG && window.MMR_CONFIG.TARGET_DAY) ?? 4;
                
                let shouldTurnOff = false;
                if (day === targetDay && hour >= 22) {
                    shouldTurnOff = true;
                } else if (day !== targetDay) {
                    shouldTurnOff = true;
                } else if (day === targetDay && hour < 18) {
                    shouldTurnOff = true;
                }
                
                if (shouldTurnOff) {
                    console.log('[MMR] Auto-corrected activeView from congrats to slides.');
                    state.activeView = 'slides';
                    isPaused = false;
                    const btn = document.getElementById('play-pause-btn');
                    if (btn) btn.innerText = '⏸';
                    setTimeout(() => {
                        bc.postMessage({ type: 'STATE_UPDATE', payload: { activeView: 'slides' } });
                        writeFirebase({ activeView: 'slides' });
                    }, 0);
                }
            }
            
            // View switching
            Object.keys(views).forEach(k => {
                if (k === state.activeView) views[k].classList.add('active');
                else views[k].classList.remove('active');
            });

            // Trigger congrats waving video sequence
            if (state.activeView === 'congrats-video') {
                startCongratsWavingSequence();
            } else {
                stopCongratsWavingLoop();
            }

            // Update draw view color category class
            const drawView = document.getElementById('view-draw');
            if (drawView) {
                const activeDrawDataObj = getActiveDrawData(state.draw);
                const hasDrawn = activeDrawDataObj && activeDrawDataObj.drawnNumbers && activeDrawDataObj.drawnNumbers.length > 0;
                let curPrize = null;
                if (slotsRolling) {
                    curPrize = rollingPrize;
                } else if (activeDrawDataObj) {
                    if (hasDrawn || activeDrawDataObj.currentPrize === 'generic') {
                        curPrize = activeDrawDataObj.currentPrize;
                    }
                }
                setPrizeTheme(curPrize);
            }

            // Slides rendering (only when data or activeView changes to optimize timer performance)
            const nzDateCache = getNZDate();
            const activeDrawDataObjForCache = getActiveDrawData(state.draw);
            const drawnNumbersCount = activeDrawDataObjForCache && activeDrawDataObjForCache.drawnNumbers ? activeDrawDataObjForCache.drawnNumbers.length : 0;
            const prizesLeft = activeDrawDataObjForCache ? activeDrawDataObjForCache.prizesLeft : null;
            const currentSlidesJson = JSON.stringify(state.slides || []) + '_' + JSON.stringify({
                t100: cfgPrizes100,
                t50: cfgPrizes50,
                t25: cfgPrizes25,
                day: nzDateCache.getDay(),
                hour: nzDateCache.getHours(),
                drawnCount: drawnNumbersCount,
                prizesLeft: prizesLeft
            });
            if (state.activeView === 'slides' && (state.activeView !== lastActiveView || currentSlidesJson !== lastRenderedSlidesJson)) {
                renderSlides(state.slides);
                lastRenderedSlidesJson = currentSlidesJson;
            }
            lastActiveView = state.activeView;

            // Active Event State parsing
            const activeDrawData = getActiveDrawData(state.draw);
            const isSundayEnabled = !!(state.draw && state.draw.sunday && state.draw.sunday.enabled);
            let activeEventName = (state.draw && state.draw.activeEvent) || 'thursday';
            if (activeEventName === 'sunday' && !isSundayEnabled) {
                activeEventName = 'thursday';
            }
            const isSunday = activeEventName === 'sunday' && isSundayEnabled;
            document.body.classList.toggle('theme-sunday', isSunday);

            // Compute remaining prizes dynamically from config minus drawn
            let drawnNumbers = activeDrawData.drawnNumbers || [];
            if (!Array.isArray(drawnNumbers)) drawnNumbers = Object.values(drawnNumbers);
            const n100Drawn = drawnNumbers.filter(d => (typeof d === 'object' ? d.prize : 0) == 100).length;
            const n50Drawn = drawnNumbers.filter(d => (typeof d === 'object' ? d.prize : 0) == 50).length;
            const n25Drawn = drawnNumbers.filter(d => (typeof d === 'object' ? d.prize : 0) == 25).length;
            const p100Val = Math.max(0, (activeDrawData.cfgPrizes100 ?? activeDrawData.prizes100 ?? 10) - n100Drawn);
            const p50Val = Math.max(0, (activeDrawData.cfgPrizes50 ?? activeDrawData.prizes50 ?? 16) - n50Drawn);
            const p25Val = Math.max(0, (activeDrawData.cfgPrizes25 ?? activeDrawData.prizes25 ?? 40) - n25Drawn);
            const totalRemaining = p100Val + p50Val + p25Val;

            const ptBar = document.getElementById('prizes-top-bar');
            if (ptBar) {
                let html = '';
                const drawType = activeDrawData.type || 'full';
                const isGenericDrawBtn = activeDrawData.currentPrize === 'generic' || activeDrawData.currentPrize === 'generic-countdown' || activeDrawData.currentPrize === 'generic-no-countdown';
                
                if (drawType === 'generic' || isGenericDrawBtn) {
                    const gen = (state.draw && state.draw.generic) || {};
                    const isNoCountdown = activeDrawData.currentPrize === 'generic-no-countdown' || (gen.showRemaining === 'no');
                    if (!isNoCountdown) {
                        const genLeft = gen.prizesLeft !== undefined ? gen.prizesLeft : (gen.cfgPrizes || 0);
                        html += `<div class="prize-counter-pill" style="border-color: #f59e0b; box-shadow: 0 0 10px rgba(245,158,11,0.4); animation: popIn 0.4s ease-out, pillPulse 2s infinite ease-in-out;">
                                    <span style="color: #f59e0b;">Generic Prizes Left</span>
                                    <span class="val">${genLeft}</span>
                                 </div>`;
                    }
                } else if (drawType === 'full') {
                    if (p100Val > 0) {
                        html += `<div class="prize-counter-pill" style="border-color: #ef4444; box-shadow: 0 0 10px rgba(239,68,68,0.4); animation: popIn 0.4s ease-out, pulseRed 2s infinite ease-in-out;">
                                    <span style="color: #ef4444;">$100 Prize</span>
                                    <span class="val">${p100Val}</span>
                                 </div>`;
                    }
                    if (p50Val > 0) {
                        html += `<div class="prize-counter-pill" style="border-color: #3b82f6; box-shadow: 0 0 10px rgba(59,130,246,0.4); animation: popIn 0.4s ease-out, pulseBlue 2s infinite ease-in-out;">
                                    <span style="color: #3b82f6;">$50 Prize</span>
                                    <span class="val">${p50Val}</span>
                                 </div>`;
                    }
                    if (p25Val > 0) {
                        html += `<div class="prize-counter-pill" style="border-color: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.4); animation: popIn 0.4s ease-out, pulseGreen 2s infinite ease-in-out;">
                                    <span style="color: #10b981;">$25 Prize</span>
                                    <span class="val">${p25Val}</span>
                                 </div>`;
                    }
                    if (totalRemaining > 0) {
                        const alertColor = totalRemaining <= 5 ? '#f43f5e' : '#ffffff';
                        html += `<div class="prize-counter-pill" style="border-color: ${alertColor}; box-shadow: 0 0 15px ${alertColor}66; margin-left: 2rem;">
                                    <span style="color: ${alertColor};">Total Left</span>
                                    <span class="val" style="color: ${alertColor};">${totalRemaining}</span>
                                 </div>`;
                    } else {
                        html += `<div class="prize-counter-pill" style="border-color: #ef4444; box-shadow: 0 0 15px rgba(239,68,68,0.6);">
                                    <span style="color: #ef4444;">ALL PRIZES DRAWN</span>
                                 </div>`;
                    }
                }
                ptBar.innerHTML = html;
            }
            
            // Update countdown slide prize counts if they exist in DOM
            const c100 = document.getElementById('count-100');
            const c50 = document.getElementById('count-50');
            const c25 = document.getElementById('count-25');
            if (c100) { c100.innerText = cfgPrizes100; }
            if (c50) { c50.innerText = cfgPrizes50; }
            if (c25) { c25.innerText = cfgPrizes25; }

            // Render drawn numbers chronologically (first drawn to last drawn) with line connectors
            let drawn = activeDrawData.drawnNumbers || [];
            if (!Array.isArray(drawn)) drawn = Object.values(drawn);
            
            // If reels are spinning, hide the currently rolling number (drawn[0])
            let displayDrawn = [...drawn];
            if (slotsRolling && displayDrawn.length > 0) {
                displayDrawn.shift();
            }
            
            // Display newest on left
            const displayOrder = [...displayDrawn];
            
            const renderDrawnNumberLine = (entry, i, arr, scale = 1.0) => {
                const num = typeof entry === 'object' ? entry.number : entry;
                const prize = typeof entry === 'object' ? entry.prize : 25;
                const redrawn = typeof entry === 'object' ? entry.redrawn : false;
                
                let bg = '#10b981';
                let glow = 'rgba(16,185,129,0.6)';
                let prizeLabel = isSunday ? '$' + prize : '$' + prize + ' Pack';
                if (prize === 100 || prize === '100') {
                    bg = '#ef4444';
                    glow = 'rgba(239,68,68,0.6)';
                    prizeLabel = '$100 Pack';
                } else if (prize === 50 || prize === '50') {
                    bg = '#3b82f6';
                    glow = 'rgba(59,130,246,0.6)';
                    prizeLabel = '$50 Prize';
                } else if (prize === 25 || prize === '25') {
                    bg = '#10b981';
                    glow = 'rgba(16,185,129,0.6)';
                    prizeLabel = '$25 Prize';
                } else if (prize === 'bonus') {
                    bg = '#ffd700';
                    glow = 'rgba(255,215,0,0.6)';
                    prizeLabel = 'BONUS';
                } else if (prize === 'meat') {
                    bg = '#f97316';
                    glow = 'rgba(249,115,22,0.6)';
                    prizeLabel = 'Meat Tray';
                } else if (prize === 'voucher') {
                    bg = '#ffffff';
                    glow = 'rgba(255,255,255,0.6)';
                    prizeLabel = 'VOUCHER';
                }
                
                const textColor = (prize === 'voucher' || prize === 'bonus') ? '#000000' : '#ffffff';
                const isLastDrawn = drawn[0] && (typeof drawn[0] === 'object' ? drawn[0].number : drawn[0]) === num;
                const extraClass = isLastDrawn && !redrawn ? 'class="last-drawn-glow"' : '';
                
                let style = `background: ${bg}; box-shadow: 0 0 15px ${glow}; padding: 0.5rem 1.4rem; border-radius: 0.75rem; color: ${textColor}; font-weight: 800; font-size: ${2.6 * scale}rem; position: relative; z-index: 2; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.1; min-width: ${5 * scale}rem;`;
                
                if (redrawn) {
                    style += `opacity: 0.4; filter: grayscale(100%); text-decoration: line-through; text-decoration-color: #ff0000; text-decoration-thickness: 3px;`;
                }

                // Connector line logic between drawn numbers
                const hasNext = i < arr.length - 1;
                const lineHtml = hasNext ? `<div style="width: ${2.2 * scale}rem; height: ${4 * scale}px; background: linear-gradient(90deg, ${glow}, rgba(255,255,255,0.6)); align-self: center; z-index: 1; flex-shrink: 0; box-shadow: 0 0 8px ${glow}; border-radius: 2px;"></div>` : '';

                return `
                    <div style="display: flex; align-items: center; margin-bottom: 0.8rem;">
                        <div ${extraClass} style="${style}">
                            <span>${sanitize(String(num))}</span>
                            <span style="font-size: ${0.8 * scale}rem; font-weight: 600; opacity: 0.85; text-transform: uppercase;">${prizeLabel}</span>
                        </div>
                        ${lineHtml}
                    </div>`;
            };

            const horizontalList = document.getElementById('drawn-horizontal-list');
            if (horizontalList) {
                let dynamicScale = 1.0;
                if (displayOrder.length > 35) dynamicScale = 0.65;
                else if (displayOrder.length > 25) dynamicScale = 0.75;
                else if (displayOrder.length > 15) dynamicScale = 0.85;
                
                horizontalList.innerHTML = displayOrder.map((e, i, a) => renderDrawnNumberLine(e, i, a, dynamicScale)).join('');
            }
            
            // Populate winning numbers view exactly the same, but bigger
            const winningList = document.getElementById('winning-horizontal-list');
            if (winningList) {
                let winScale = 1.3;
                if (displayOrder.length > 35) winScale = 0.8;
                else if (displayOrder.length > 25) winScale = 0.95;
                else if (displayOrder.length > 15) winScale = 1.1;
                
                winningList.innerHTML = displayOrder.map((e, i, a) => renderDrawnNumberLine(e, i, a, winScale)).join('');
            }

            // Update Robs Advert
            const robsPrizes = document.getElementById('robs-prizes-list');
            if (robsPrizes && state.draw && state.draw.sunday) {
                let p = [];
                let totalPrizes = 0;
                let totalValue = 0;
                
                if (state.draw.sunday.cfgPrizes100 > 0) { p.push(`<div>${state.draw.sunday.cfgPrizes100}x $100 Packs</div>`); totalPrizes += state.draw.sunday.cfgPrizes100; totalValue += state.draw.sunday.cfgPrizes100 * 100; }
                if (state.draw.sunday.cfgPrizes50 > 0) { p.push(`<div>${state.draw.sunday.cfgPrizes50}x $50 Prizes</div>`); totalPrizes += state.draw.sunday.cfgPrizes50; totalValue += state.draw.sunday.cfgPrizes50 * 50; }
                if (state.draw.sunday.cfgPrizes25 > 0) { p.push(`<div>${state.draw.sunday.cfgPrizes25}x $25 Prizes</div>`); totalPrizes += state.draw.sunday.cfgPrizes25; totalValue += state.draw.sunday.cfgPrizes25 * 25; }
                if (state.draw.sunday.cfgVouchersCount > 0) {
                    p.push(`<div>${state.draw.sunday.cfgVouchersCount}x Vouchers</div>`);
                    totalPrizes += state.draw.sunday.cfgVouchersCount;
                    totalValue += (state.draw.sunday.cfgVouchersValue || 0);
                }
                
                p.push(`<div style="margin-top: 1rem; color: #fff; font-size: 0.8em;">TOTAL PRIZES: ${totalPrizes}</div>`);
                p.push(`<div style="margin-top: 0.5rem; color: #10b981; font-size: 1.2em; text-shadow: 0 0 20px rgba(16,185,129,0.6);">TOTAL PRIZE POOL: $${totalValue.toLocaleString()}</div>`);
                
                robsPrizes.innerHTML = p.join('');
            }

            // Render last drawn number in slots if not currently rolling
            const slotsContainer = document.querySelector('.slot-container');
            if (slotsContainer && (!window.rollInterval || slotsContainer.querySelectorAll('.slot-strip').length === 0)) {
                const activeEvtData = getActiveDrawData(state.draw);
                let curNum = '-';
                if (activeEvtData.currentNumber !== undefined && activeEvtData.currentNumber !== null) {
                    curNum = activeEvtData.currentNumber;
                } else if (state.draw.currentNumber !== undefined && state.draw.currentNumber !== null) {
                    curNum = state.draw.currentNumber;
                }
                const curPrize = activeEvtData.currentPrize || state.draw.currentPrize;
                const titleEl = document.getElementById('draw-view-title');
                if (titleEl) {
                    if (curPrize === 'bonus') {
                        titleEl.innerText = "BONUS PRIZE DRAW";
                        titleEl.style.color = "#ffd700";
                    } else if (curPrize === 'voucher') {
                        titleEl.innerText = "VOUCHER DRAW";
                        titleEl.style.color = "#ffffff";
                    } else if (curPrize === 100 || curPrize === '100') {
                        titleEl.innerText = "WINNING $100 PACK";
                        titleEl.style.color = "#ef4444";
                    } else if (curPrize === 50 || curPrize === '50') {
                        titleEl.innerText = "WINNING $50 PRIZE";
                        titleEl.style.color = "#3b82f6";
                    } else if (curPrize === 25 || curPrize === '25') {
                        titleEl.innerText = "WINNING $25 PRIZE";
                        titleEl.style.color = "#10b981";
                    } else if (curPrize === 'generic' || curPrize === 'generic-countdown' || curPrize === 'generic-no-countdown') {
                        titleEl.innerText = "WINNING NUMBER";
                        titleEl.style.color = "#fbbf24";
                    } else {
                        titleEl.innerText = "Winning Number";
                        titleEl.style.color = "white";
                    }
                }
                
                const cfgMax = (activeEvtData && activeEvtData.max) ? parseInt(activeEvtData.max) : ((window.MMR_CONFIG && window.MMR_CONFIG.DEFAULT_TICKET_MAX) || 99999);
                const digitsCount = Math.max(3, String(cfgMax).length);

                let html = '';
                const displayStr = (curNum === '-') ? '-'.repeat(digitsCount) : String(curNum).padStart(digitsCount, '0');
                if (slotsContainer.dataset.lastRendered !== displayStr) {
                    for (let i = 0; i < displayStr.length; i++) {
                        const isDash = displayStr[i] === '-';
                        const cssClass = isDash ? 'slot-digit' : 'slot-digit locked';
                        const content = isDash ? '<img src="logo-new.png" style="height: 0.8em; vertical-align: middle; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));">' : displayStr[i];
                        html += `<span class="${cssClass}">${content}</span>`;
                    }
                    slotsContainer.innerHTML = html;
                    slotsContainer.dataset.lastRendered = displayStr;
                }
            }

            // Persist to localStorage (excluding slides)
            const stateToSave = { ...state };
            delete stateToSave.slides;
            localStorage.setItem('mmr_state_v5', JSON.stringify(stateToSave));
        }

        // Live Clock logic for dynamic values
        function calculateTimeRemainingHTML() {
            if (!state.nextDrawTime) return '<span>Starting Soon!</span>';
            const target = new Date(state.nextDrawTime); 
            const nzNow = getNZDate();
            
            const diff = target.getTime() - nzNow.getTime();
            
            // If the draw time was more than 2 hours ago, it's definitely over. 
            // Auto-advance the state to the next Thursday.
            if (diff < -(2 * 60 * 60 * 1000)) {
                state.nextDrawTime = getNextThursday7PM();
                localStorage.setItem('mmr_state_v5', JSON.stringify(state));
                return '<span>Calculating next draw...</span>';
            }

            if (diff <= 0) return '<span class="meat-time-active">GET READY... IT\'S ... MEAT O\'CLOCK!</span>';
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);
            
            const c = '<span class="colon-flash">:</span>';
            
            const daysDiv = `<div>${String(days).padStart(2,'0')}<small>DAYS</small></div>`;
            const hrsDiv = `<div>${String(hrs).padStart(2,'0')}<small>HOURS</small></div>`;
            const minDiv = `<div>${String(m).padStart(2,'0')}<small>MINUTES</small></div>`;
            const secDiv = `<div>${String(s).padStart(2,'0')}<small>SECONDS</small></div>`;

            if (days > 0) return `${daysDiv}${c}${hrsDiv}${c}${minDiv}${c}${secDiv}`;
            return `${hrsDiv}${c}${minDiv}${c}${secDiv}`;
        }

        let hasTriggeredCountdownFireworks = false;

        setInterval(() => {
            const nzNow = getNZDate();
            const target = state.nextDrawTime ? new Date(state.nextDrawTime) : null;
            const diff = target ? target.getTime() - nzNow.getTime() : 0;

            const timeHtml = calculateTimeRemainingHTML();
            const dynamicCounters = document.querySelectorAll('.slide-countdown-timer');
            dynamicCounters.forEach(el => {
                el.innerHTML = timeHtml;
                // Add heartbeat pulse in the last minute
                if (diff > 0 && diff <= 60 * 1000) {
                    el.classList.add('last-minute');
                } else {
                    el.classList.remove('last-minute');
                }
            });

            // Toggle cinematic mode on body during the last 10 minutes
            if (diff > 0 && diff <= 10 * 60 * 1000) {
                document.body.classList.add('cinematic-mode');
            } else {
                document.body.classList.remove('cinematic-mode');
            }

            // Trigger fireworks when countdown reaches 0 seconds
            if (diff <= 0 && diff > -(2 * 60 * 60 * 1000)) {
                if (!hasTriggeredCountdownFireworks) {
                    triggerFireworks();
                    hasTriggeredCountdownFireworks = true;
                }
            } else {
                hasTriggeredCountdownFireworks = false;
            }

            // Removed congrats timeline transition to video per request
            if (state.activeView !== 'congrats-video') {
                congratsStartTime = null;
            }

            if (state.activeView === 'congrats' || state.activeView === 'winning-numbers' || state.activeView === 'view-robs-advert') {
                if (!postDrawLoopInterval) {
                    let steps = ['congrats'];
                    const activeEvent = (state.draw && state.draw.activeEvent) ? state.draw.activeEvent : 'thursday';
                    const activeDrawData = (state.draw && state.draw[activeEvent]) ? state.draw[activeEvent] : {};
                    const drawnNums = getActiveDrawnNumbers(state.draw);
                    if (!activeDrawData.manualDraw && drawnNums && drawnNums.length > 0) {
                        steps.push('winning-numbers');
                    }
                    
                    let currentStepIdx = steps.indexOf(state.activeView) !== -1 ? steps.indexOf(state.activeView) : 0;
                    
                    postDrawLoopInterval = setInterval(() => {
                        currentStepIdx = (currentStepIdx + 1) % steps.length;
                        const nextView = steps[currentStepIdx];
                        bc.postMessage({ type: 'STATE_UPDATE', payload: { activeView: nextView } });
                        writeFirebase({ activeView: nextView });
                    }, 10000); // Switch every 10 seconds
                }
            } else {
                if (typeof postDrawLoopInterval !== 'undefined' && postDrawLoopInterval) {
                    clearInterval(postDrawLoopInterval);
                    postDrawLoopInterval = null;
                }
            }

            // Turn off congrats screen and resume slides if outside allowed time window
            if (state.activeView === 'congrats') {
                const nzDate = getNZDate();
                const day = nzDate.getDay();
                const hour = nzDate.getHours();
                const targetDay = (window.MMR_CONFIG && window.MMR_CONFIG.TARGET_DAY) ?? 4;
                
                let shouldTurnOff = false;
                if (day === targetDay && hour >= 22) {
                    shouldTurnOff = true;
                } else if (day !== targetDay) {
                    shouldTurnOff = true;
                } else if (day === targetDay && hour < 18) {
                    shouldTurnOff = true;
                }
                
                if (shouldTurnOff) {
                    isPaused = false;
                    const btn = document.getElementById('play-pause-btn');
                    if (btn) btn.innerText = '⏸';
                    updateState({ activeView: 'slides' });
                    bc.postMessage({ type: 'STATE_UPDATE', payload: { activeView: 'slides' } });
                    writeFirebase({ activeView: 'slides' });
                }
            }
        }, 1000);

        // Slide logic
        let slideInterval;
        let progressInterval;

        function renderSlides(slidesData) {
            slidesData = slidesData || [];
            const disabledList = state.disabledSlides || [];
            const visibleSlides = slidesData.filter(s => !disabledList.includes(s.title) && s.type !== 'avatar');
            
            const activeEvtData = getActiveDrawData(state.draw);
            const t100 = Number(activeEvtData.cfgPrizes100 ?? activeEvtData.prizes100 ?? 10);
            const t50 = Number(activeEvtData.cfgPrizes50 ?? activeEvtData.prizes50 ?? 16);
            const t25 = Number(activeEvtData.cfgPrizes25 ?? activeEvtData.prizes25 ?? 40);
            
            const isSundayEnabled = !!(state.draw && state.draw.sunday && state.draw.sunday.enabled);
            let activeEvtName = (state.draw && state.draw.activeEvent) || 'thursday';
            if (activeEvtName === 'sunday' && !isSundayEnabled) {
                activeEvtName = 'thursday';
            }
            const isSunday = activeEvtName === 'sunday' && isSundayEnabled;
            const targetDay = isSunday ? 0 : 4; // 0 = Sunday, 4 = Thursday
            const dayNameUpper = isSunday ? 'SUNDAYS' : 'THURSDAYS';
            const dayNameCap = isSunday ? "Sunday's" : "Thursday's";
            const defaultSaleTime = isSunday ? "1:00PM" : "5:30PM";
            const defaultDrawTime = isSunday ? "2:30PM" : "7:00PM";

            const nzDate = getNZDate();
            const day = nzDate.getDay();
            const hour = nzDate.getHours();

            const activeEvt = (state.draw && state.draw[activeEvtName]) || {};
            const isDrawFinished = activeEvt.prizesLeft === 0 && (activeEvt.drawnNumbers || []).length > 0;
            const isAfter8PM = hour >= 20;

            const vCount = Number(activeEvtData.cfgVouchersCount ?? 0);
            const vValue = Number(activeEvtData.cfgVouchersValue ?? 0);
            const totalPrizes = t100 + t50 + t25 + vCount;
            const totalPool = (t100 * 100) + (t50 * 50) + (t25 * 25) + vValue;

            const isTBC = isDrawFinished || (t100 === 0 && t50 === 0 && t25 === 0 && vCount === 0);

            const t100Str = isTBC ? "T.B.C." : String(t100);
            const t50Str = isTBC ? "T.B.C." : String(t50);
            const t25Str = isTBC ? "T.B.C." : String(t25);
            const vCountStr = isTBC ? "T.B.C." : String(vCount);
            const totalPrizesStr = isTBC ? "T.B.C." : String(totalPrizes);
            const totalPoolStr = isTBC ? "T.B.C." : "$" + totalPool.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            let isTonight = (day === targetDay) && !isAfter8PM && !isDrawFinished;

            const ticketsWording = isTonight ? `TONIGHT FROM ${defaultSaleTime}` : (day === (targetDay - 1 + 7) % 7) ? `TOMORROW FROM ${defaultSaleTime}` : `${dayNameUpper} FROM ${defaultSaleTime}`;
            const drawWording = isTonight ? `TONIGHT AT ${defaultDrawTime}` : (day === (targetDay - 1 + 7) % 7) ? `TOMORROW AT ${defaultDrawTime}` : `${dayNameUpper} AT ${defaultDrawTime}`;
            const poolWording = isTonight ? "tonight's" : (day === (targetDay - 1 + 7) % 7) ? "tomorrow's" : dayNameCap;

            const advertSlides = [];
            
            // Only show advert slides if it's a full draw AND not TBC
            const drawType = activeEvt.type || 'full';
            if (drawType === 'full' && !isTBC) {
                if (t100 > 0) {
                    advertSlides.push({
                        title: `${t100Str} x $100`,
                        subtitle: "🥩 Premium Assorted Meat Trays to be won!! 🥩",
                        type: "advert",
                        advertType: "p100",
                        duration: 30000
                    });
                }
                if (t50 > 0) {
                    advertSlides.push({
                        title: `${t50Str} x $50 TRAYS`,
                        subtitle: "🍗 Premium Assorted Meat Trays to be won!! 🍗",
                        type: "advert",
                        advertType: "p50",
                        duration: 30000
                    });
                }
                if (t25 > 0) {
                    advertSlides.push({
                        title: `${t25Str} x $25 TRAYS`,
                        subtitle: "🥓 Premium Assorted Meat Trays to be won!! 🥓",
                        type: "advert",
                        advertType: "p25",
                        duration: 30000
                    });
                }
                if (vCount > 0) {
                    advertSlides.push({
                        title: `${vCountStr} x VOUCHERS`,
                        subtitle: "🎫 Vouchers to be won!! 🎫",
                        type: "advert",
                        advertType: "vouchers",
                        duration: 30000
                    });
                }
                if (totalPrizes > 0) {
                    advertSlides.push({
                        title: `TOTAL PRIZES: ${totalPrizesStr}`,
                        subtitle: "🍖 Premium Assorted Meat Trays must be won!! 🍖",
                        type: "advert",
                        advertType: "total",
                        duration: 30000
                    });
                    advertSlides.push({
                        title: `A MASSIVE ${totalPoolStr}`,
                        subtitle: `in ${poolWording} ${totalPrizesStr} prizes!`,
                        type: "advert",
                        advertType: "pool",
                        duration: 30000
                    });
                }
                advertSlides.push({
                    title: "TICKETS ON SALE",
                    subtitle: `🎟️ ${ticketsWording} 🎟️`,
                    type: "advert",
                    advertType: "tickets",
                    duration: 30000
                });
                advertSlides.push({
                    title: "MONSTER MEAT RAFFLE",
                    subtitle: `🔥 DRAW STARTS ${drawWording} 🔥`,
                    type: "advert",
                    advertType: "draw_time",
                    duration: 30000
                });
            }


            const finalSlides = [...visibleSlides, ...advertSlides];

            if (finalSlides.length === 0) return;

            // Render ALL slides to DOM first
            slidesWrapper.innerHTML = finalSlides.map((slide, i) => {
                if (slide.type === 'advert') {
                    let style = '';
                    let badge = '';
                    if (slide.advertType === 'p100') {
                        style = `background: radial-gradient(circle at center, #78350f 0%, #030712 100%); --badge-glow: rgba(245, 158, 11, 0.6); --title-glow: rgba(245, 158, 11, 0.4);`;
                        badge = '🥩';
                    } else if (slide.advertType === 'p50') {
                        style = `background: radial-gradient(circle at center, #1e3a8a 0%, #030712 100%); --badge-glow: rgba(59, 130, 246, 0.6); --title-glow: rgba(59, 130, 246, 0.4);`;
                        badge = '🍗';
                    } else if (slide.advertType === 'p25') {
                        style = `background: radial-gradient(circle at center, #064e3b 0%, #030712 100%); --badge-glow: rgba(16, 185, 129, 0.6); --title-glow: rgba(16, 185, 129, 0.4);`;
                        badge = '🥓';
                    } else if (slide.advertType === 'vouchers') {
                        style = `background: radial-gradient(circle at center, #831843 0%, #030712 100%); --badge-glow: rgba(236, 72, 153, 0.6); --title-glow: rgba(236, 72, 153, 0.4);`;
                        badge = '🎫';
                    } else if (slide.advertType === 'total') {
                        style = `background: radial-gradient(circle at center, #7c2d12 0%, #020617 100%); --badge-glow: rgba(239, 68, 68, 0.6); --title-glow: rgba(239, 68, 68, 0.4);`;
                        badge = '🍖';
                    } else if (slide.advertType === 'pool') {
                        style = `background: radial-gradient(circle at center, #4c1d95 0%, #020617 100%); --badge-glow: rgba(168, 85, 247, 0.6); --title-glow: rgba(168, 85, 247, 0.4);`;
                        badge = '💰';
                    } else if (slide.advertType === 'tickets') {
                        style = `background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); --badge-glow: rgba(99, 102, 241, 0.6); --title-glow: rgba(99, 102, 241, 0.4);`;
                        badge = '🎟️';
                    } else if (slide.advertType === 'draw_time') {
                        style = `background: radial-gradient(circle at center, #451a03 0%, #030712 100%); --badge-glow: rgba(249, 115, 22, 0.6); --title-glow: rgba(249, 115, 22, 0.4);`;
                        badge = `
                            <div class="custom-clock">
                                <div class="clock-face">
                                    <div class="clock-hand clock-hour"></div>
                                    <div class="clock-hand clock-minute"></div>
                                    <div class="clock-center"></div>
                                </div>
                            </div>
                        `;
                    }
                    
                    return `
                        <div class="slide slide-advert ${i === currentSlideIdx ? 'active' : ''}" style="${style}" data-duration="${slide.duration}">
                            <div class="slide-image-overlay"></div>
                            <div class="advert-badge-container">${badge}</div>
                            <h1 class="advert-title">${sanitize(slide.title).replace(/ x /gi, ' <span style="text-transform: none;">x</span> ')}</h1>
                            <h2 class="advert-subtitle">${sanitize(slide.subtitle)}</h2>
                        </div>
                    `;
                }

                const timeHtml = slide.type === 'countdown' ? calculateTimeRemainingHTML() : '';
                
                // Use BackgroundImage if available, otherwise fallback to imageUrl
                const bgImg = safeUrl((slide.type !== 'avatar' && slide.backgroundImage) || slide.imageUrl);
                const overlayImg = safeUrl(slide.overlayImage);
                const avatarImg = safeUrl(slide.avatarImage || (slide.type === 'avatar' && slide.backgroundImage) || slide.imageUrl); // For avatar type
                
                const bgStyle = bgImg ? `background-image: url('${bgImg}'); background-size: cover; background-position: center;` : '';
                
                return `
                    <div class="slide ${i === currentSlideIdx ? 'active' : ''}" style="${bgStyle}" data-duration="${slide.duration}" data-type="${slide.type}">
                        ${bgImg ? '<div class="slide-image-overlay"></div>' : ''}
                        
                        ${overlayImg ? `<div class="slide-overlay-img-container" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1;">
                            <img src="${overlayImg}" style="max-width: 80%; max-height: 80%; object-fit: contain;">
                        </div>` : ''}

                        ${slide.title ? `<h1 style="position: relative; z-index: 2;">${sanitize(slide.title).replace(/\n/g, '<br>')}</h1>` : ''}
                        ${slide.subtitle ? `<h2 class="slide-subtitle" style="position: relative; z-index: 2;">${sanitize(slide.subtitle).replace(/\n/g, '<br>')}</h2>` : ''}
                        
                        ${slide.type === 'countdown' 
                            ? `<div class="slide-countdown slide-countdown-timer" style="position: relative; z-index: 2;">${timeHtml}</div>
                               <div class="countdown-prizes-summary" style="position: relative; z-index: 2; margin-top: 3.5rem; display: flex; gap: clamp(1.5rem, 4vw, 5.5rem); justify-content: center; font-size: clamp(1.6rem, 3.8vw, 3.8rem); font-weight: bold; background: rgba(0,0,0,0.85); padding: 1.5rem clamp(1.5rem, 4vw, 4rem); border-radius: 2rem; border: 2px solid rgba(255,255,255,0.2); box-shadow: 0 15px 35px rgba(0,0,0,0.6), 0 0 25px rgba(255,255,255,0.05); max-width: 90%; margin-left: auto; margin-right: auto; box-sizing: border-box;">
                                 <span style="color: #ef4444; text-shadow: 0 0 15px rgba(239, 68, 68, 0.85), 0 0 30px rgba(239, 68, 68, 0.45);"><span id="count-100">${activeEvtData.cfgPrizes100 ?? activeEvtData.prizes100 ?? 10}</span> x $100</span>
                                 <span style="color: #3b82f6; text-shadow: 0 0 15px rgba(59, 130, 246, 0.85), 0 0 30px rgba(59, 130, 246, 0.45);"><span id="count-50">${activeEvtData.cfgPrizes50 ?? activeEvtData.prizes50 ?? 16}</span> x $50</span>
                                 <span style="color: #10b981; text-shadow: 0 0 15px rgba(16, 185, 129, 0.85), 0 0 30px rgba(16, 185, 129, 0.45);"><span id="count-25">${activeEvtData.cfgPrizes25 ?? activeEvtData.prizes25 ?? 40}</span> x $25</span>
                               </div>` 
                            : ''
                        }
                        
                        ${slide.type === 'avatar' 
                            ? `<div class="avatar-container" style="position: relative; z-index: 5;">
                                 ${(String(slide.bubbleText || '').trim() || String(slide.subtitle || '').trim()) 
                                    ? `<div class="speech-bubble">${sanitize(slide.bubbleText || slide.subtitle).replace(/\n/g, '<br>')}</div>` 
                                    : ''}
                                 <img src="${avatarImg || (window.MMR_CONFIG && window.MMR_CONFIG.AVATAR_FALLBACK) || 'avatar.png'}" class="animated-avatar" alt="Character Avatar">
                               </div>` 
                            : ''
                        }

                        ${slide.type === 'winners' 
                            ? `<div class="winners-carousel" style="position: relative; z-index: 3; width: 100%; height: 400px; display: flex; justify-content: center; align-items: center;">
                                 ${(slide.winnerPhotos || '').split(',').map(url => url.trim()).filter(url => url).map((url, idx) => `
                                    <img src="${safeUrl(url)}" style="border-radius: 2rem; border: 8px solid var(--primary); box-shadow: 0 0 50px var(--primary-glow);">
                                 `).join('')}
                               </div>` 
                            : ''
                        }
                    </div>
                `;
            }).join('');

            // Safety boundary check
            if (currentSlideIdx >= finalSlides.length) currentSlideIdx = 0;

            startSlideTimer(finalSlides[currentSlideIdx].duration);
            playActiveCarousel();
        }

        function startSlideTimer(duration) {
            clearInterval(slideInterval);
            clearInterval(progressInterval);
            if (isLocked) return;
            const effectiveDuration = customSlideDuration || duration;
            
            let start = Date.now();
            progressBar.style.width = '0%';
            
            progressInterval = setInterval(() => {
                if (isPaused || isLocked) return;
                let elapsed = Date.now() - start;
                let percent = (elapsed / effectiveDuration) * 100;
                progressBar.style.width = Math.min(percent, 100) + '%';
            }, 50);

            if (isPaused || isLocked) return;
            
            const currentSlide = document.querySelectorAll('.slide')[currentSlideIdx];
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

            slideInterval = setInterval(() => {
                if (isPaused || isLocked) return;
                const slides = document.querySelectorAll('.slide');
                if(slides.length === 0) return;
                
                slides[currentSlideIdx].classList.remove('active');
                currentSlideIdx = (currentSlideIdx + 1) % slides.length;
                slides[currentSlideIdx].classList.add('active');
                
                const nextDur = customSlideDuration || parseInt(slides[currentSlideIdx].getAttribute('data-duration')) || 30000;
                const nextType = slides[currentSlideIdx].getAttribute('data-type');
                
                // If it's a countdown slide and draw hasn't happened yet (or just recently started), lock it
                
                }
                
                startSlideTimer(nextDur);
            }, effectiveDuration);
        }

        // Draw Speed Helper
        function getDrawSpeedConfig() {
            let lsSpeed = 1;
            try { lsSpeed = localStorage.getItem('mmr_draw_speed') || 1; } catch(e) {}
            const val = parseInt((state.draw && state.draw.drawSpeed) || lsSpeed);
            if (val === 5) {
                return { mode: 5, name: 'Ludicrous', rollDuration: 250, slotInterval: 10, digitBaseDelay: 60, digitStepDelay: 45, stopDuration: 0.35 };
            } else if (val === 4) {
                return { mode: 4, name: 'Turbo', rollDuration: 500, slotInterval: 12, digitBaseDelay: 120, digitStepDelay: 90, stopDuration: 0.6 };
            } else if (val === 3) {
                return { mode: 3, name: 'Faster', rollDuration: 900, slotInterval: 15, digitBaseDelay: 220, digitStepDelay: 170, stopDuration: 0.9 };
            } else if (val === 2) {
                return { mode: 2, name: 'Fast', rollDuration: 1600, slotInterval: 30, digitBaseDelay: 400, digitStepDelay: 300, stopDuration: 1.2 };
            } else {
                return { mode: 1, name: 'Normal', rollDuration: 3000, slotInterval: 50, digitBaseDelay: 800, digitStepDelay: 600, stopDuration: 1.5 };
            }
        }

        // Draw Logic
        let rollInterval;
        let lockTimeouts = [];
        
        function setPrizeTheme(prizeType) {
            const drawView = document.getElementById('view-draw');
            if (!drawView) return;
            drawView.classList.remove('prize-100', 'prize-50', 'prize-25', 'prize-bonus', 'prize-voucher', 'prize-generic');
            if (!prizeType) return; // Clean dark neutral background with no color accent when null/start
            const pKey = String(prizeType);
            if (pKey === '100') drawView.classList.add('prize-100');
            else if (pKey === '50') drawView.classList.add('prize-50');
            else if (pKey === '25') drawView.classList.add('prize-25');
            else if (pKey === 'bonus') drawView.classList.add('prize-bonus');
            else if (pKey === 'voucher') drawView.classList.add('prize-voucher');
            else if (pKey === 'generic' || pKey === 'generic-countdown' || pKey === 'generic-no-countdown') drawView.classList.add('prize-generic');
        }

        // Slot Machine Audio Context
        let audioCtx = null;
        function playSlotTick() {
            if (!state || !state.soundEnabled) return;
            try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
                
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start();
                osc.stop(audioCtx.currentTime + 0.05);
            } catch (e) {
                console.error('Audio play failed', e);
            }
        }

        function startLotteryRoll(prizeType, speedParam) {
            const speed = speedParam || getDrawSpeedConfig();
            slotsRolling = true;
            rollingPrize = prizeType;
            setPrizeTheme(prizeType);
            updateState(state); // Force re-render to hide the new number from list
            
            if (window.rollInterval) {
                clearInterval(window.rollInterval);
            }
            if (window.lockTimeouts) {
                window.lockTimeouts.forEach(t => clearTimeout(t));
            }
            window.lockTimeouts = [];
            
            const titleEl = document.getElementById('draw-view-title');
            if (titleEl) {
                const pKey = String(prizeType || '');
                if (pKey === '100') {
                    titleEl.innerText = "DRAWING $100 PACK";
                    titleEl.style.color = "#ef4444";
                } else if (pKey === '50') {
                    titleEl.innerText = "DRAWING $50 PRIZE";
                    titleEl.style.color = "#60a5fa";
                } else if (pKey === '25') {
                    titleEl.innerText = "DRAWING $25 PRIZE";
                    titleEl.style.color = "#34d399";
                } else if (pKey === 'bonus') {
                    titleEl.innerText = "BONUS PRIZE DRAW";
                    titleEl.style.color = "#ffd700";
                } else if (pKey === 'generic') {
                    titleEl.innerText = "DRAWING NUMBER";
                    titleEl.style.color = "#fbbf24";
                } else if (pKey === 'voucher') {
                    titleEl.innerText = "VOUCHER DRAW";
                    titleEl.style.color = "#ffffff";
                } else {
                    titleEl.innerText = "Winning Number";
                    titleEl.style.color = "white";
                }
            }
            
            document.getElementById('view-draw').classList.add('draw-flash-bg');
            
            // Dynamic slot digits layout based on config
            const activeEvtData = getActiveDrawData(state.draw);
            const cfgMax = (activeEvtData && activeEvtData.max) ? parseInt(activeEvtData.max) : ((window.MMR_CONFIG && window.MMR_CONFIG.DEFAULT_TICKET_MAX) || 99999);
            const digitsCount = Math.max(3, String(cfgMax).length);
            
            const container = document.querySelector('.slot-container');
            if (container) {
                let html = '';
                for (let i = 0; i < digitsCount; i++) {
                    html += `
                    <span class="slot-digit">
                        <div class="slot-strip" id="slot-strip-${i}" style="transform: translateY(-1750vmin);">
                            ${Array(80).fill(0).map((_, j) => `<span class="slot-strip-num">${j % 10}</span>`).join('')}
                        </div>
                    </span>`;
                }
                container.innerHTML = html;
                
                // Start spin downwards by translating from -1750vmin towards 0vmin
                setTimeout(() => {
                    for (let i = 0; i < digitsCount; i++) {
                        const strip = document.getElementById(`slot-strip-${i}`);
                        if (strip) {
                            strip.style.transition = 'transform 10s linear';
                            strip.style.transform = 'translateY(0vmin)';
                        }
                    }
                }, 40);
            }
            
            // Failsafe: if STOP_ROLL never arrives, auto-stop after 10s
            if (window._rollFailsafe) clearTimeout(window._rollFailsafe);
            window._rollFailsafe = setTimeout(() => {
                if (slotsRolling) {
                    console.warn('[Failsafe] STOP_ROLL not received! Auto-stopping draw to prevent infinite loop.');
                    stopLotteryRoll('0'.repeat(digitsCount), prizeType, speed);
                }
            }, 10000);

            // Tick sound loop
            window.rollInterval = setInterval(() => {
                playSlotTick();
            }, 100);
        }

        function stopLotteryRoll(finalNumber, prizeType, speedParam) {
            const speed = speedParam || getDrawSpeedConfig();
            
            if (window.rollInterval) {
                clearInterval(window.rollInterval);
            }
            if (window.lockTimeouts) {
                window.lockTimeouts.forEach(t => clearTimeout(t));
            }
            window.lockTimeouts = [];
            
            const activeEvtData = getActiveDrawData(state.draw);
            const cfgMax = (activeEvtData && activeEvtData.max) ? parseInt(activeEvtData.max) : ((window.MMR_CONFIG && window.MMR_CONFIG.DEFAULT_TICKET_MAX) || 99999);
            const digitsCount = Math.max(3, String(cfgMax).length);
            const numStr = String(finalNumber).padStart(digitsCount, '0');
            
            const slots = Array.from(document.querySelectorAll('.slot-digit'));
            if (slots.length === 0) return;
            
            slots.forEach((slot, index) => {
                const strip = slot.querySelector('.slot-strip');
                if (!strip) return;
                
                const targetDigit = parseInt(numStr[index]);
                const targetIndex = 10 + targetDigit;
                
                const delay = (speed.digitBaseDelay || 800) + index * (speed.digitStepDelay || 600);
                
                // Update transition to ease-out bounce to target in downward direction
                const t1 = setTimeout(() => {
                    const stopDur = speed.stopDuration || 1.4;
                    strip.style.transition = `transform ${stopDur}s cubic-bezier(0.175, 0.885, 0.32, 1.1)`;
                    strip.style.transform = `translateY(-${targetIndex * 25}vmin)`;
                    playSlotTick(); // Final click sound
                    
                    slot.classList.add('locked');
                    
                    if (index === slots.length - 1) {
                        slotsRolling = false;
                        rollingPrize = null;
                        updateState(state);
                        
                        setPrizeTheme(prizeType); // Force correct color for winner flash

                        const drawView = document.getElementById('view-draw');
                        drawView.classList.remove('draw-flash-bg');
                        drawView.classList.add('winner-flash-bg');
                        setTimeout(() => {
                            drawView.classList.remove('winner-flash-bg');
                            // Re-apply state prize theme after flash to ensure consistency
                            updateState(state);
                        }, 2500);
                        
                        triggerConfetti();
                        
                        const cfg = window.MMR_CONFIG;
                        const voiceOn = localStorage.getItem('mmr_voice_on') === 'true';
                        if ('speechSynthesis' in window && voiceOn) {
                            window.speechSynthesis.cancel();
                            let label = "Ticket number ";
                            if (prizeType === 'bonus') {
                                label = "Bonus prize, ticket number ";
                            }
                            const msg = new SpeechSynthesisUtterance(label + finalNumber + "!");
                            msg.volume = 1;
                            msg.rate = (cfg && cfg.VOICE_RATE) || 0.9;
                            msg.pitch = (cfg && cfg.VOICE_PITCH) || 0.8;
                            setTimeout(() => window.speechSynthesis.speak(msg), 400);
                        }
                    }
                }, delay);
                window.lockTimeouts.push(t1);
            });
        }

        // Confetti Logic
        function triggerConfetti() {
            confettiContainer.innerHTML = '';
            const symbols = ['🥩', '🥓', '🍗', '🍖', 'LOGO'];
            for (let i = 0; i < 60; i++) {
                const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                const el = document.createElement('div');
                el.style.position = 'absolute';
                el.style.top = '-100px';
                el.style.left = Math.random() * 100 + '%';
                el.style.fontSize = '3rem';
                el.style.filter = 'drop-shadow(0 5px 15px rgba(0,0,0,0.5))';
                el.style.zIndex = Math.random() > 0.5 ? 60 : 40;
                
                if (symbol === 'LOGO') {
                    const img = document.createElement('img');
                    img.src = 'logo-new.png';
                    img.style.width = '4rem';
                    img.style.height = 'auto';
                    el.appendChild(img);
                } else {
                    el.innerText = symbol;
                }

                // Animation
                const duration = Math.random() * 3 + 2;
                const delay = Math.random() * 2;
                el.style.transition = `transform ${duration}s linear, opacity ${duration}s ease-in`;
                
                confettiContainer.appendChild(el);
                
                setTimeout(() => {
                    el.style.transform = `translateY(120vh) rotate(${Math.random() * 360}deg)`;
                    el.style.opacity = '0';
                }, delay * 1000 + 50);

                setTimeout(() => el.remove(), (duration + delay) * 1000 + 100);
            }
        }

        // Fireworks Logic for countdown completion
        function triggerFireworks() {
            const container = document.getElementById('confetti-container');
            if (!container) return;
            container.innerHTML = '';
            
            // Spawn 8 separate fireworks over 6 seconds
            for (let f = 0; f < 8; f++) {
                setTimeout(() => {
                    const centerX = 15 + Math.random() * 70; // 15% to 85% width
                    const centerY = 20 + Math.random() * 50; // 20% to 70% height
                    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#ffffff'];
                    const fireworkColor = colors[Math.floor(Math.random() * colors.length)];
                    const particles = 24;
                    
                    for (let i = 0; i < particles; i++) {
                        const el = document.createElement('div');
                        el.style.position = 'absolute';
                        el.style.left = centerX + '%';
                        el.style.top = centerY + 'vh';
                        el.style.width = '12px';
                        el.style.height = '12px';
                        el.style.borderRadius = '50%';
                        el.style.background = fireworkColor;
                        el.style.boxShadow = `0 0 10px ${fireworkColor}, 0 0 20px ${fireworkColor}`;
                        el.style.zIndex = '9999';
                        el.style.transition = 'transform 1.8s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 1.8s ease-out';
                        
                        // Add some meat emojis as special particles!
                        if (i % 4 === 0) {
                            el.innerText = ['🥩', '🥓', '🍗', '🍖'][Math.floor(Math.random() * 4)];
                            el.style.background = 'none';
                            el.style.boxShadow = 'none';
                            el.style.fontSize = '2.5rem';
                            el.style.lineHeight = '1';
                        }
                        
                        container.appendChild(el);
                        
                        // Calculate explosion trajectory angle and distance
                        const angle = (i / particles) * 2 * Math.PI + (Math.random() * 0.2 - 0.1);
                        const distance = 120 + Math.random() * 180; // pixels
                        const destX = Math.cos(angle) * distance;
                        const destY = Math.sin(angle) * distance;
                        
                        // Trigger CSS animation frame
                        setTimeout(() => {
                            el.style.transform = `translate(${destX}px, ${destY}px) scale(0.5)`;
                            el.style.opacity = '0';
                        }, 50);
                        
                        // Clean up element
                        setTimeout(() => el.remove(), 2000);
                    }
                }, f * 750);
            }
        }

        // Ambient Slide Confetti
        const ambientContainer = document.getElementById('ambient-confetti-container');
        function spawnAmbientConfetti() {
            if (state.activeView !== 'slides') return;
            const symbols = ['🥩', '🥓', '🍗', '🍖', 'LOGO'];
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const el = document.createElement('div');
            el.className = 'ambient-confetti';
            el.style.top = '-80px';
            el.style.left = Math.random() * 100 + '%';
            el.style.fontSize = (Math.random() * 1 + 2.5) + 'rem'; // Narrower range: 2.5-3.5rem for consistency
            el.style.filter = 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))';
            el.style.opacity = (Math.random() * 0.15 + 0.35).toFixed(2); // Tighter range: 0.35-0.50 for uniformity
            
            if (symbol === 'LOGO') {
                const img = document.createElement('img');
                img.src = 'logo-new.png';
                img.style.width = '3rem';
                img.style.height = 'auto';
                img.style.opacity = '0.7';
                el.appendChild(img);
            } else {
                el.innerText = symbol;
            }

            const duration = Math.random() * 3 + 12; // Tighter range: 12-15s for steadier fall
            const rotation = Math.random() * 180 + 90; // 90-270deg rotation
            const drift = (Math.random() - 0.5) * 100; // Horizontal drift for natural feel
            el.style.transition = `transform ${duration}s linear`;
            ambientContainer.appendChild(el);
            
            setTimeout(() => {
                el.style.transform = `translateY(115vh) translateX(${drift}px) rotate(${rotation}deg)`;
            }, 50);

            setTimeout(() => el.remove(), duration * 1000 + 100);
        }
        setInterval(spawnAmbientConfetti, 500); // Steadier spawn rate for even distribution

        // Initialization and Google Sheets Sync
        function parseSlidesCSV(text) {
            const result = [];
            let row = [];
            let col = '';
            let inQuotes = false;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const nextChar = text[i + 1];

                if (inQuotes) {
                    if (char === '"' && nextChar === '"') { col += '"'; i++; }
                    else if (char === '"') { inQuotes = false; }
                    else { col += char; }
                } else {
                    if (char === '"') { inQuotes = true; }
                    else if (char === ',') { row.push(col.trim()); col = ''; }
                    else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                        if (char === '\r') i++;
                        row.push(col.trim());
                        result.push(row);
                        row = []; col = '';
                    } else { col += char; }
                }
            }
            if (col || row.length > 0) { row.push(col.trim()); result.push(row); }

            if (result.length < 2) return [];

            const header = result[0].map(h => h.toLowerCase().trim());
            const idxTitle = header.indexOf('title');
            const idxSubtitle = header.indexOf('subtitle');
            const idxType = header.indexOf('type');
            const idxDuration = header.indexOf('duration');
            
            let idxBg = header.indexOf('backgroundimage');
            if (idxBg === -1) idxBg = header.indexOf('backgroundimg');
            
            let idxOverlay = header.indexOf('overlayimage');
            if (idxOverlay === -1) idxOverlay = header.indexOf('overlayimg');
            
            let idxAvatar = header.indexOf('avatarimage');
            if (idxAvatar === -1) idxAvatar = header.indexOf('avatar');
            if (idxAvatar === -1) idxAvatar = header.indexOf('avatarimg');

            const idxBubble = header.indexOf('bubbletext');
            const idxWinnerPhotos = header.indexOf('winnerphotos');

            return result.slice(1).map(clean => {
                const type = (idxType !== -1 ? clean[idxType] : 'normal').toLowerCase();
                const title = idxTitle !== -1 ? clean[idxTitle] : '';
                const subtitle = idxSubtitle !== -1 ? clean[idxSubtitle] : '';
                const durationVal = idxDuration !== -1 ? parseInt(clean[idxDuration]) : 30000;
                const bgImage = idxBg !== -1 ? clean[idxBg] : '';
                const overlayImage = idxOverlay !== -1 ? clean[idxOverlay] : '';
                const avatarImage = idxAvatar !== -1 ? clean[idxAvatar] : '';
                const bubbleText = idxBubble !== -1 ? clean[idxBubble] : '';
                const winnerPhotos = idxWinnerPhotos !== -1 ? clean[idxWinnerPhotos] : '';

                if (!title && !subtitle && !bubbleText && !winnerPhotos && !bgImage && !overlayImage && !avatarImage && type !== 'countdown' && type !== 'avatar') return null;

                const ruthlessString = [title, subtitle, type, bubbleText].join(' ').toLowerCase();
                if (ruthlessString.includes('tbc') || ruthlessString.includes('tba') || 
                    ruthlessString.includes('to be confirmed') || ruthlessString.includes('to be announced')) {
                    return null;
                }

                return {
                    title: title || '',
                    subtitle: subtitle || '',
                    type: type || 'normal',
                    duration: durationVal || 30000,
                    backgroundImage: bgImage || '',
                    overlayImage: overlayImage || '',
                    avatarImage: avatarImage || '',
                    bubbleText: bubbleText || '',
                    winnerPhotos: winnerPhotos || ''
                };
            }).filter(s => s !== null);
        }

        const DEFAULT_SLIDES_URL = (window.MMR_CONFIG && window.MMR_CONFIG.GSHEETS_URL) || '';

        async function fetchAndApplySlides() {
            const slidesUrl = DEFAULT_SLIDES_URL;
            console.log('[MMR] Fetching slides from:', slidesUrl || 'local-backup.csv');
            let success = false;
            let csv = '';

            if (slidesUrl) {
                try {
                    const res = await fetch(slidesUrl + (slidesUrl.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
                    if (res.ok) {
                        csv = await res.text();
                        success = true;
                    }
                } catch (e) {
                    console.warn('[MMR] Google Sheets fetch failed, falling back to local-backup.csv:', e);
                }
            }

            if (!success) {
                try {
                    const res = await fetch('local-backup.csv?t=' + Date.now(), { cache: 'no-store' });
                    if (res.ok) {
                        csv = await res.text();
                        success = true;
                        console.log('[MMR] Loaded slides from local-backup.csv');
                    }
                } catch (e) {
                    console.error('[MMR] Failed to load local-backup.csv via fetch:', e);
                }
            }

            if (success && csv) {
                let slides = parseSlidesCSV(csv);
                if (window.MMR_CONFIG && Array.isArray(window.MMR_CONFIG.LOCAL_WINNERS_SLIDES)) {
                    slides = [...slides, ...window.MMR_CONFIG.LOCAL_WINNERS_SLIDES];
                }

                if (slides.length > 0) {
                    console.log('[MMR] Slides synced OK — ' + slides.length + ' slides loaded.');
                    updateState({ slides: slides });
                } else {
                    console.warn('[MMR] Slides parse returned 0 rows — keeping current slides.');
                }
            }
        }

        async function init() {
            // Apply Config Visuals
            const cfg = window.MMR_CONFIG;
            if (cfg) {
                const root = document.documentElement;
                if (cfg.COLORS.primary) root.style.setProperty('--cfg-primary', cfg.COLORS.primary);
                if (cfg.COLORS.primaryGlow) root.style.setProperty('--cfg-primary-glow', cfg.COLORS.primaryGlow);
                if (cfg.COLORS.bgDark) root.style.setProperty('--cfg-bg-dark', cfg.COLORS.bgDark);
                if (cfg.COLORS.bgGrad) root.style.setProperty('--cfg-bg-grad', cfg.COLORS.bgGrad);
                if (cfg.COLORS.textLight) root.style.setProperty('--cfg-text-light', cfg.COLORS.textLight);
                if (cfg.PROGRESS_BAR_HEIGHT) root.style.setProperty('--cfg-progress-bar-height', cfg.PROGRESS_BAR_HEIGHT);
                
                const fixedTitle = document.getElementById('fixed-title-main');
                if (fixedTitle) {
                    fixedTitle.innerHTML = `${cfg.EVENT_NAME}<br><span style="font-size: 0.6em;">${cfg.EVENT_SUBTITLE}</span>`;
                }
                
                const logo = document.getElementById('logo');
                if (logo && cfg.LOGO_PATH) logo.src = cfg.LOGO_PATH;
            }

            // 1. Show stored state immediately
            const storedState = localStorage.getItem('mmr_state_v5');
            if (storedState) {
                try { 
                    const parsed = JSON.parse(storedState);
                    // Force-clear slides from storage to ensure fresh fetch from CSV
                    delete parsed.slides; 
                    if (parsed.nextDrawTime && new Date(parsed.nextDrawTime).getTime() < getNZDate().getTime()) {
                        parsed.nextDrawTime = getNextThursday7PM();
                    }
                    updateState(parsed); 
                } catch(e){}
            } else {
                updateState({}); // Trigger re-render without mutating global state object destructively
            }

            // 2. Then immediately pull fresh slides from Sheets
            await fetchAndApplySlides();

            // 3. Re-sync every 5 minutes so slides stay current without a page reload
            setInterval(fetchAndApplySlides, 5 * 60 * 1000);
        }

        init();

        // ── Screen Wake Lock (Keep Screen On) ──────────────────────────────
        let wakeLock = null;
        async function requestWakeLock() {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('[MMR] Screen Wake Lock acquired.');
                    wakeLock.addEventListener('release', () => {
                        console.log('[MMR] Screen Wake Lock released.');
                    });
                }
            } catch (err) {
                console.warn('[MMR] Screen Wake Lock request failed:', err);
            }
        }
        
        document.addEventListener('visibilitychange', async () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        });
        
        requestWakeLock();

        // ── Firebase cross-device sync (optional) ──────────────────────────
        let fbDbUrl = (window.MMR_CONFIG && window.MMR_CONFIG.FIREBASE_DB_URL) || '';
        let lastFbCmdTs = 0;
        let isInitialFbLoad = true;

        function initFirebase() {
            try {
                if (!fbDbUrl) return;
                listenFirebaseState();
                console.log('[MMR] Firebase RTDB connected:', fbDbUrl);
            } catch(e) { console.error('[MMR] Firebase init error:', e); }
        }

        function writeFirebase(data) {
            if (!fbDbUrl) return;
            fetch(`${fbDbUrl}/mmr.json`, {
                method: 'PATCH',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store'
            }).catch(e => console.warn('[MMR] Firebase write error:', e));
        }

        function listenFirebaseState() {
            const es = new EventSource(`${fbDbUrl}/mmr.json`);
            es.addEventListener('put', handleFbEvent);
            es.addEventListener('patch', handleFbEvent);
            es.onerror = () => { es.close(); setTimeout(listenFirebaseState, 5000); };
        }

        function handleFbEvent(e) {
            try {
                const eventData = JSON.parse(e.data);
                const path = eventData.path || '/';
                const rawData = eventData.data;
                if (rawData === undefined || rawData === null) return;

                if (path === '/voiceOn' || (path === '/' && rawData.voiceOn !== undefined)) {
                    const voiceVal = path === '/voiceOn' ? rawData : rawData.voiceOn;
                    localStorage.setItem('mmr_voice_on', voiceVal);
                }

                const slideCmdObj = path === '/slideCmd' ? rawData : (rawData && rawData.slideCmd);
                if (slideCmdObj && slideCmdObj.ts > (state.lastSlideCmdTs || 0)) {
                    const shouldExec = !isInitialFbLoad && (Date.now() - slideCmdObj.ts < 15000);
                    state.lastSlideCmdTs = slideCmdObj.ts;
                    if (shouldExec) {
                        handleSlideCmd(slideCmdObj.cmd);
                    }
                }

                const cmdObj = path === '/cmd' ? rawData : (rawData && rawData.cmd);
                if (cmdObj && cmdObj.ts > lastFbCmdTs) {
                    lastFbCmdTs = cmdObj.ts;
                    if (!isInitialFbLoad) {
                        if (cmdObj.type === 'START_ROLL') startLotteryRoll(cmdObj.prize, cmdObj.speed);
                        else if (cmdObj.type === 'STOP_ROLL') stopLotteryRoll(cmdObj.number, cmdObj.prize, cmdObj.speed);
                        else if (cmdObj.type === 'CONFETTI') triggerConfetti();
                        else if (cmdObj.type === 'FORCE_SYNC') fetchAndApplySlides();
                    }
                }
                
                isInitialFbLoad = false;

                if (path === '/') {
                    const { cmd, slideCmd, voiceOn, ...stateData } = rawData;
                    if (stateData.slides) delete stateData.slides;
                    if (Object.keys(stateData).length) updateState(stateData);
                } else if (path === '/activeView') {
                    updateState({ activeView: rawData });
                } else if (path.startsWith('/draw')) {
                    if (path === '/draw') updateState({ draw: rawData });
                    else {
                        const key = path.replace('/draw/', '');
                        updateState({ draw: { [key]: rawData } });
                    }
                }
            } catch(err) {
                console.error('[MMR] Firebase event processing error:', err);
            }
        }

        var wavingLoopInterval = null;
        var sequenceTimeout = null;
        var wavingActive = false;

        function startCongratsWavingSequence() {
            if (wavingActive) return;
            wavingActive = true;
            
            // Show video container
            const containerView = document.getElementById('view-congrats-video');
            if (containerView) containerView.classList.add('active');
            
            // Reset darkness overlay
            const overlay = document.getElementById('darkness-overlay');
            if (overlay) overlay.style.opacity = '0';
            
            // Loop between dark waving frames (250ms rate)
            const img1 = document.getElementById('waving-frame-1');
            const img2 = document.getElementById('waving-frame-2');
            if (img1 && img2) {
                let frameToggle = true;
                clearInterval(wavingLoopInterval);
                wavingLoopInterval = setInterval(() => {
                    if (frameToggle) {
                        img1.style.display = 'none';
                        img2.style.display = 'block';
                    } else {
                        img2.style.display = 'none';
                        img1.style.display = 'block';
                    }
                    frameToggle = !frameToggle;
                }, 250);
            }
            
            // Start dialogue and joke sequence
            runWavingDialogSequence();
        }

        function stopCongratsWavingLoop() {
            wavingActive = false;
            clearInterval(wavingLoopInterval);
            wavingLoopInterval = null;
            clearTimeout(sequenceTimeout);
            const overlay = document.getElementById('darkness-overlay');
            if (overlay) overlay.style.opacity = '0';
            const male = document.getElementById('avatar-bubble-male');
            const female = document.getElementById('avatar-bubble-female');
            if (male) male.style.display = 'none';
            if (female) female.style.display = 'none';
            const videoView = document.getElementById('view-congrats-video');
            if (videoView) videoView.classList.remove('active');
        }

        function runWavingDialogSequence() {
            const bubbleMale = document.getElementById('avatar-bubble-male');
            const bubbleFemale = document.getElementById('avatar-bubble-female');
            if (!bubbleMale || !bubbleFemale) return;
            
            const sequence = [
                { speaker: 'both', text: 'Thank You, Everyone!', duration: 3000 },
                { speaker: 'both', text: 'Nice to meat you!', duration: 3000 },
                { speaker: 'both', text: 'Cheerio!', duration: 3000 },
                { speaker: 'both', text: 'Saveloy', duration: 3000 },
                { speaker: 'both', text: 'Good Gravy!', duration: 3000 },
                { speaker: 'both', text: 'Meat-lovers!', duration: 3000 },
                { speaker: 'both', text: 'Lettuce meat next Thursday!?!?', duration: 3500 },
                // Joke starts
                { speaker: 'male', text: 'Why did the steak blush?', duration: 4000 },
                { speaker: 'female', text: "Don't know... Why?", duration: 3000 },
                { speaker: 'male', text: 'It saw the Salad Undressing!!!', duration: 4500 },
                { speaker: 'female', text: 'Oh, Well Done Robert! Well-Done!', duration: 4000 },
                { speaker: 'female', text: "You're really bacon them laugh!", duration: 4000 },
                // Fade to black
                { speaker: 'fade', text: '', duration: 5000 }
            ];
            
            let currentIdx = 0;
            
            function showNext() {
                if (!wavingActive) return;
                if (currentIdx >= sequence.length) return;
                
                const step = sequence[currentIdx];
                
                // Clear bubbles
                bubbleMale.style.display = 'none';
                bubbleFemale.style.display = 'none';
                
                if (step.speaker === 'both') {
                    bubbleMale.innerText = step.text;
                    bubbleFemale.innerText = step.text;
                    bubbleMale.style.display = 'block';
                    bubbleFemale.style.display = 'block';
                } else if (step.speaker === 'male') {
                    bubbleMale.innerText = step.text;
                    bubbleMale.style.display = 'block';
                } else if (step.speaker === 'female') {
                    bubbleFemale.innerText = step.text;
                    bubbleFemale.style.display = 'block';
                } else if (step.speaker === 'fade') {
                    const overlay = document.getElementById('darkness-overlay');
                    if (overlay) overlay.style.opacity = '1';
                }
                
                currentIdx++;
                sequenceTimeout = setTimeout(showNext, step.duration);
            }
            
            showNext();
        }

        initFirebase();

        // Generate QR codes for TV display
        function generateTVQRCodes() {
            let baseUrl = window.location.href.split('?')[0].split('#')[0];
            baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
            const verifyUrl = encodeURIComponent(baseUrl + '/verify.html');
            const archiveUrl = encodeURIComponent(baseUrl + '/archive.html');
            
            const verifyImg = document.getElementById('tv-qr-verify');
            if (verifyImg) verifyImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&color=0f172a&bgcolor=ffffff&data=${verifyUrl}`;
            
            const archiveImg = document.getElementById('tv-qr-archive');
            if (archiveImg) archiveImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&color=0f172a&bgcolor=ffffff&data=${archiveUrl}`;
        }
        // Slideshow Keyboard Navigation
        function showKeyboardHud(text) {
            let hud = document.getElementById('keyboard-hud-toast');
            if (!hud) {
                hud = document.createElement('div');
                hud.id = 'keyboard-hud-toast';
                hud.style.cssText = 'position:fixed; bottom:2.5rem; right:2.5rem; z-index:999999; background:rgba(0,0,0,0.85); color:#fbbf24; border:1px solid rgba(251,191,36,0.5); padding:0.6rem 1.4rem; border-radius:9999px; font-family:sans-serif; font-size:1.1rem; font-weight:700; pointer-events:none; box-shadow:0 10px 30px rgba(0,0,0,0.7); backdrop-filter:blur(10px); transition:opacity 0.25s ease, transform 0.25s ease; opacity:0; transform:translateY(10px);';
                document.body.appendChild(hud);
            }
            hud.innerText = text;
            hud.style.opacity = '1';
            hud.style.transform = 'translateY(0)';
            clearTimeout(hud._t);
            hud._t = setTimeout(() => {
                hud.style.opacity = '0';
                hud.style.transform = 'translateY(10px)';
            }, 2000);
        }

        window.addEventListener('keydown', (e) => {
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    prevSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const slides = document.querySelectorAll('.slide');
                    if (slides.length > 0) {
                        slides[currentSlideIdx]?.classList.remove('active');
                        currentSlideIdx = 0;
                        slides[0]?.classList.add('active');
                        playActiveCarousel();
                        const dur = customSlideDuration || parseInt(slides[0].getAttribute('data-duration')) || 30000;
                        startSlideTimer(dur);
                        showKeyboardHud('⏮ Slide 1');
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'SKIP_MODULE' }, '*');
                    } else {
                        nextSlide();
                    }
                    break;
                case ' ':
                case 'Space':
                    e.preventDefault();
                    toggleSlidePlay();
                    break;
                case 'a':
                case 'A':
                    e.preventDefault();
                    window.open('admin.html', '_blank');
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    window.open('remote.html', '_blank');
                    break;
                case '0':
                    e.preventDefault();
                    isLocked = !isLocked;
                    if (isLocked) {
                        clearInterval(slideInterval);
                        clearInterval(progressInterval);
                        showKeyboardHud('🔒 SLIDE LOCKED (0 to unlock)');
                    } else {
                        showKeyboardHud('🔓 SLIDE UNLOCKED');
                        if (!isPaused) {
                            const curDur = customSlideDuration || parseInt(document.querySelectorAll('.slide')[currentSlideIdx]?.getAttribute('data-duration')) || 30000;
                            startSlideTimer(curDur);
                        }
                    }
                    break;
                default:
                    if (e.key >= '1' && e.key <= '9') {
                        e.preventDefault();
                        const secs = parseInt(e.key, 10) * 10;
                        customSlideDuration = secs * 1000;
                        startSlideTimer(customSlideDuration);
                        showKeyboardHud(`⏱ Duration: ${secs}s`);
                    }
                    break;
            }
        });

        window.addEventListener('message', (e) => {
            if (!e.data) return;
            if (e.data.type === 'GOTO_FIRST') {
                const s = document.querySelectorAll('.slide');
                if (s.length > 0) {
                    s[currentSlideIdx]?.classList.remove('active');
                    currentSlideIdx = 0;
                    s[0]?.classList.add('active');
                    playActiveCarousel();
                    const dur = customSlideDuration || parseInt(s[0].getAttribute('data-duration')) || 30000;
                    startSlideTimer(dur);
                }
            }
        });
