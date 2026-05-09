/**
 * MMR Raffle System - Configuration Template
 * 
 * Edit this file to customize the raffle for different events.
 * All changes here will apply across the Display, Remote, and Admin panels.
 */

window.MMR_CONFIG = {
    // ── EVENT IDENTITY ──────────────────────────────────────────────────
    EVENT_NAME: "Monster Meat Raffle",
    EVENT_SUBTITLE: "weekly on Thursdays",
    
    // ── DATA SOURCES ────────────────────────────────────────────────────
    // Google Sheets CSV URL (must be 'Published to Web' as CSV)
    GSHEETS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMXn3GlWIeGLKc3XqYXFSi_ofevUW4JZtptUoDoyzapOQCmoDSdC96QRZf0EXpWQ8CYoJ7YJ5h5Boy/pub?output=csv',
    
    // Firebase Realtime Database URL (for cross-device sync)
    // Example: 'https://your-project-id-default-rtdb.firebaseio.com'
    FIREBASE_DB_URL: 'https://ct-mmr-default-rtdb.firebaseio.com',
    
    // ── VISUAL STYLING ──────────────────────────────────────────────────
    COLORS: {
        primary: '#ef4444',        // Main theme color (Red)
        primaryGlow: 'rgba(239, 68, 68, 0.6)',
        bgDark: '#020617',         // Background base
        bgGrad: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
        textLight: '#f8fafc',
        textSubtitle: '#ffffff',    // Warm white for subtitles
    },
    
    PROGRESS_BAR_HEIGHT: '12px',   // Thicker for TV visibility
    
    // ── LOTTERY LOGIC ───────────────────────────────────────────────────
    DEFAULT_PRIZE_COUNT: 62,
    DEFAULT_TICKET_MIN: 1,
    DEFAULT_TICKET_MAX: 999,
    
    // ── DATE LOGIC ──────────────────────────────────────────────────────
    TARGET_DAY: 4,               // 0=Sun, 1=Mon, ..., 4=Thu
    TARGET_HOUR: 19,             // 7 PM (24h format)
    TIMEZONE: 'Pacific/Auckland',
    
    // ── ASSETS ──────────────────────────────────────────────────────────
    LOGO_PATH: 'logo-new.png',
    AVATAR_FALLBACK: 'avatar.png',
    CONFETTI_SYMBOLS: ['🥩', '🥓', '🍗', '🍖', 'LOGO'],
    
    // ── FEATURES ────────────────────────────────────────────────────────
    VOICE_ENABLED_DEFAULT: true,
    VOICE_RATE: 0.9,
    VOICE_PITCH: 0.8,
    
    // ── LOCAL CONTENT OVERRIDES ─────────────────────────────────────────
    // These slides are appended to those fetched from Google Sheets
    LOCAL_WINNERS_SLIDES: [
        {
            title: "Recently Meat Winners",
            subtitle: "Proudly supporting our local tavern!",
            type: "winners",
            duration: 20000,
            winnerPhotos: "_winners/671121160_1527990205993631_1560606402684196086_n.jpg, _winners/671307339_1527990229326962_4955696085047281956_n.jpg, _winners/671755739_1527990232660295_3703908239392174146_n.jpg"
        },
        {
            title: "More Happy Winners",
            subtitle: "Join us every Thursday for your chance to win!",
            type: "winners",
            duration: 20000,
            winnerPhotos: "_winners/672076370_1527990139326971_3901420564382756015_n.jpg, _winners/672378350_1527990122660306_1925883341616935984_n.jpg, _winners/672684609_1527990235993628_3614426172678345369_n.jpg"
        }
    ]
};
