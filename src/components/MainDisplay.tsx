import React, { useEffect, useState } from 'react';
import { useRaffleSocket } from '../hooks/useRaffleSocket';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInSeconds } from 'date-fns';
import { toZonedTime, formatInTimeZone, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Pacific/Auckland';

function getNextDrawDate() {
  const now = new Date();
  const nzTime = toZonedTime(now, TIMEZONE);
  
  let targetDate = new Date(nzTime);
  if (nzTime.getDay() !== 4 || nzTime.getHours() >= 19) {
    targetDate.setDate(targetDate.getDate() + ((4 + 7 - targetDate.getDay()) % 7 || 7));
  }
  
  const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}T19:00:00`;
  
  return fromZonedTime(dateString, TIMEZONE);
}

function MeatConfetti() {
  const meats = ['🥩', '🥓', '🍗', '🍖'];
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    setPieces(Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      meat: meats[Math.floor(Math.random() * meats.length)],
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 15 + 15}s`,
      animationDelay: `${Math.random() * 10}s`,
      size: `${Math.random() * 3 + 2}rem`,
      rotation: Math.random() * 360,
    })));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '-10vh', rotate: p.rotation, opacity: 0 }}
          animate={{ y: '110vh', rotate: p.rotation + 360, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: parseFloat(p.animationDuration),
            delay: parseFloat(p.animationDelay),
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ position: 'absolute', left: p.left, fontSize: p.size }}
        >
          {p.meat}
        </motion.div>
      ))}
    </div>
  );
}

function formatTimeLeft(diff: number) {
  if (diff <= 0) return '00 Hours 00 Minutes 00 Seconds';
  const d = Math.floor(diff / (3600 * 24));
  const h = Math.floor((diff % (3600 * 24)) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  const dStr = d > 0 ? `${d} Days ` : '';
  const hStr = `${h.toString().padStart(2, '0')} Hours `;
  const mStr = `${m.toString().padStart(2, '0')} Minutes `;
  const sStr = `${s.toString().padStart(2, '0')} Seconds`;
  return `${dStr}${hStr}${mStr}${sStr}`;
}

function CountdownSlide() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const target = getNextDrawDate();
    
    const timer = setInterval(() => {
      const now = new Date();
      const diff = differenceInSeconds(target, now);
      
      if (diff <= 0) {
        setTimeLeft(formatTimeLeft(0));
      } else {
        setTimeLeft(formatTimeLeft(diff));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center px-4">
      <div className="text-3xl md:text-4xl lg:text-5xl text-red-400 mb-4 md:mb-6 font-bold uppercase tracking-widest drop-shadow-md text-center">Draw Commences In</div>
      <div className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-mono font-black text-white tabular-nums leading-tight drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] text-center">
        {timeLeft || '00 Hours 00 Minutes 00 Seconds'}
      </div>
    </div>
  );
}

function BuildupSlides({ state }: { state: any; key?: string }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = [
    {
      title: state.slide1Title || "Monster Meat Raffle",
      subtitle: state.slide1Subtitle || "Tickets on sale NOW!",
      content: (
        <div className="flex flex-col items-center gap-4 md:gap-8">
          <img src="https://coasterstavern.co.nz/wp-content/uploads/2024/03/coasters-new-600-1.png" alt="Coasters Tavern" className="h-32 md:h-48 object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
          <div className="text-5xl md:text-7xl lg:text-[8rem] font-black text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]">🥩 🍗 🥓</div>
        </div>
      )
    },
    {
      title: state.slide2Title || "Tonight's Prizes",
      subtitle: state.slide2Subtitle || "Massive Meat Trays to be won!",
      content: (
        <div className="flex flex-col items-center gap-4 md:gap-8 bg-slate-900/60 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border-4 border-slate-700 backdrop-blur-md mx-4">
          <div className="text-4xl md:text-6xl lg:text-[7rem] leading-none font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] text-center">
            {state.numberOfPrizes} Prizes
          </div>
          <div className="text-3xl md:text-6xl text-white font-bold text-center">
            Total Value: <span className="text-green-400">{state.prizePool}</span>
          </div>
          <div className="text-xl md:text-4xl text-slate-300 mt-2 md:mt-4 font-medium text-center">
            Prize Values: {state.prizeSizes}
          </div>
        </div>
      )
    },
    {
      title: state.slide3Title || "Ticket Prices",
      subtitle: state.slide3Subtitle || "Get yours before the draw!",
      content: (
        <div className="flex flex-col md:flex-row gap-4 md:gap-16 justify-center items-center mx-4">
          <div className="bg-slate-800/80 p-4 md:p-12 rounded-3xl md:rounded-[3rem] border-4 border-slate-600 shadow-2xl backdrop-blur-sm w-full md:w-auto">
            <div className="text-xl md:text-5xl text-slate-300 mb-1 md:mb-4 font-bold">Single Ticket</div>
            <div className="text-4xl md:text-8xl font-black text-white">{state.ticketPriceSingle || '$5'}</div>
          </div>
          <div className="text-2xl md:text-7xl text-slate-500 font-black italic">OR</div>
          <div className="bg-gradient-to-br from-red-900 to-red-600 p-6 md:p-16 rounded-3xl md:rounded-[3rem] border-4 border-red-400 shadow-[0_0_60px_rgba(220,38,38,0.5)] transform md:scale-110 w-full md:w-auto">
            <div className="text-2xl md:text-5xl text-red-100 mb-1 md:mb-4 font-bold">Value Pack</div>
            <div className="text-5xl md:text-9xl font-black text-white">{state.ticketPricePack || '$20'}</div>
            <div className="text-lg md:text-3xl text-red-200 mt-1 md:mt-4 font-bold uppercase tracking-widest">for {state.ticketPackQuantity || '4'} tickets</div>
          </div>
        </div>
      )
    },
    {
      content: <CountdownSlide />
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[slideIndex];

  return (
    <div className="w-full h-full z-10 overflow-hidden relative">
      <MeatConfetti />
      <AnimatePresence mode="wait">
        <motion.div
          key={`slide-container-${slideIndex}`}
          initial={{ opacity: 0, x: 100, filter: "blur(10px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -100, filter: "blur(10px)" }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
          className="w-full h-full flex flex-col items-center justify-center text-center px-4 py-8 z-10"
        >
          {slide.title && (
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight font-black uppercase tracking-tight mb-4 md:mb-6 text-white drop-shadow-xl">
              {slide.title}
            </h2>
          )}
          {slide.subtitle && (
            <h3 className="text-2xl md:text-3xl lg:text-4xl text-red-400 font-bold tracking-wide mb-6 md:mb-10 drop-shadow-md">
              {slide.subtitle}
            </h3>
          )}
          <div className="z-10 relative">
            {slide.content}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DrawingAnimation({ currentDraw }: { currentDraw: number | null; key?: string }) {
  const [displayNumber, setDisplayNumber] = useState(0);
  const [isSlowing, setIsSlowing] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let speed = 50;
    let elapsed = 0;

    const tick = () => {
      setDisplayNumber(Math.floor(Math.random() * 1000) + 1);
      elapsed += speed;
      
      if (elapsed > 2000) {
        setIsSlowing(true);
        speed += 50; // slow down
      }

      if (elapsed < 3000) {
        interval = setTimeout(tick, speed);
      } else {
        if (currentDraw !== null) {
          setDisplayNumber(currentDraw);
        }
      }
    };

    interval = setTimeout(tick, speed);
    return () => clearTimeout(interval);
  }, [currentDraw]);

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
      transition={{ type: "spring", duration: 1, bounce: 0.5 }}
      className="w-full h-full flex flex-col items-center justify-center z-20"
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl text-yellow-400 font-black uppercase tracking-widest mb-6 md:mb-10 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] text-center px-4">
        {isSlowing ? "Locking In..." : "Drawing Winner..."}
      </h2>
      
      {/* Lottery Ball */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-[28rem] lg:h-[28rem] rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 border-8 md:border-[16px] border-yellow-200 shadow-[0_0_100px_rgba(253,224,71,0.6),inset_0_-20px_40px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden shrink-0">
        
        {/* Spinning Logo Background */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: isSlowing ? 4 : 0.5, ease: "linear" }}
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://coasterstavern.co.nz/wp-content/uploads/2024/03/coasters-new-600-1.png')`,
            backgroundSize: '80%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Glossy reflection */}
        <div className="absolute top-4 left-8 w-32 h-16 md:w-64 md:h-32 bg-white/30 rounded-full blur-xl transform -rotate-45 z-10"></div>
        
        <div className="w-48 h-48 md:w-60 md:h-60 lg:w-[20rem] lg:h-[20rem] rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-[inset_0_10px_30px_rgba(0,0,0,0.2)] z-20">
          <span className="text-6xl md:text-7xl lg:text-[8rem] font-black text-slate-900 tabular-nums tracking-tighter">
            {displayNumber.toString().padStart(3, '0')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ThankYouSlides() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1 }}
      className="w-full h-full flex flex-col items-center justify-center text-center px-4 py-8 bg-slate-950/90 z-20 rounded-3xl"
    >
      <MeatConfetti />
      <motion.h2 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-4xl md:text-5xl lg:text-6xl leading-tight font-black uppercase tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 drop-shadow-[0_0_30px_rgba(253,224,71,0.4)] px-4"
      >
        Thank You!
      </motion.h2>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
        className="mb-4 md:mb-6"
      >
        <img src="https://coasterstavern.co.nz/wp-content/uploads/2024/03/coasters-new-600-1.png" alt="Coasters Tavern" className="h-16 md:h-24 object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
      </motion.div>
      <motion.h3
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-xl md:text-3xl lg:text-4xl text-white font-bold tracking-wide mb-4 md:mb-6 px-4"
      >
        Thank you for your support
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-base md:text-xl lg:text-2xl text-slate-300 leading-relaxed bg-slate-900/50 p-4 md:p-6 rounded-3xl border border-slate-700 backdrop-blur-sm mx-4"
      >
        Please collect your prizes at the bar.<br/>
        <span className="text-red-400 font-bold mt-2 block">Come back next week for the next monster raffle!</span>
      </motion.p>
    </motion.div>
  );
}

function ResultsBoard({ state }: { state: any; key?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col gap-8"
    >
      {/* Main Winners */}
      <div className="flex-1 bg-slate-900/50 rounded-3xl border border-slate-800 p-4 md:p-8 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 md:gap-4 text-center">
            <span className="w-4 md:w-8 h-1 bg-red-600 rounded-full hidden sm:block"></span>
            Winning Numbers
            <span className="w-4 md:w-8 h-1 bg-red-600 rounded-full hidden sm:block"></span>
          </h2>
          {state.drawnNumbers.length > 0 && (
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-sm md:text-lg lg:text-2xl font-bold text-red-400 uppercase tracking-widest bg-red-900/30 px-4 py-2 md:px-6 md:py-3 rounded-xl border border-red-500/30 text-center"
            >
              Winner: Please come up and claim your prize!
            </motion.div>
          )}
        </div>
        
        <div className="flex-1 flex flex-wrap content-start gap-4 overflow-y-auto pr-4 custom-scrollbar">
          <AnimatePresence>
            {state.drawnNumbers.map((num: number, i: number) => (
              <motion.div
                key={`win-${num}-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl w-32 h-32 flex items-center justify-center shadow-lg relative overflow-hidden group"
              >
                {/* Highlight latest number */}
                {i === state.drawnNumbers.length - 1 && (
                  <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>
                )}
                <span className="text-5xl font-mono font-black text-white z-10">{num}</span>
                <div className="absolute top-2 left-2 text-xs font-bold text-slate-500">#{i + 1}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          {state.drawnNumbers.length === 0 && (
            <div className="w-full h-full flex items-center justify-center text-slate-600 text-3xl font-medium italic">
              Waiting for the first draw...
            </div>
          )}
        </div>
      </div>

      {/* Second Chance Winners */}
      {state.secondChanceNumbers.length > 0 && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-slate-900/80 rounded-3xl border border-orange-500/30 p-4 md:p-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2 md:gap-3 text-center">
              <span>🎲</span> Second Chance Draws
            </h2>
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-sm md:text-lg lg:text-xl font-bold text-orange-400 uppercase tracking-widest bg-orange-900/30 px-4 py-2 rounded-xl border border-orange-500/30 text-center"
            >
              Winner: Claim your prize!
            </motion.div>
          </div>
          <div className="flex flex-wrap gap-4">
            {state.secondChanceNumbers.map((num: number, i: number) => (
              <motion.div
                key={`sc-${num}-${i}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-orange-950/50 border border-orange-500/50 rounded-xl px-10 py-5 flex items-center justify-center"
              >
                <span className="text-5xl font-mono font-bold text-orange-200">{num}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function MainDisplay() {
  const { state, isConnected } = useRaffleSocket();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!state) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white text-3xl font-bold">Connecting to server...</div>;
  }

  const nzTime = toZonedTime(currentTime, TIMEZONE);
  const isThursdayNow = nzTime.getDay() === 4;
  const hours = nzTime.getHours();
  const minutes = nzTime.getMinutes();
  
  // Show buildup slides if it's not Thursday, or if it's Thursday before 6:30 PM
  const isBeforeMainDraw = !isThursdayNow || (hours < 18 || (hours === 18 && minutes < 30));

  const showBuildup = state.status === 'buildup' || (state.status === 'idle' && isBeforeMainDraw && state.drawnNumbers.length === 0);

  const target = getNextDrawDate();
  const diff = differenceInSeconds(target, currentTime);
  const timeLeft = formatTimeLeft(diff);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900/90 p-4 md:p-8 shadow-2xl border-b border-slate-700 flex flex-wrap justify-between items-center gap-4 z-30 relative">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-white rounded-xl p-1 md:p-2 shadow-[0_0_15px_rgba(255,255,255,0.2)] shrink-0">
            <img src="https://coasterstavern.co.nz/wp-content/uploads/2024/03/coasters-new-600-1.png" alt="Coasters Tavern Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div className="min-w-0">
            <motion.h1 
              animate={{ textShadow: ["0px 0px 10px rgba(220,38,38,0.5)", "0px 0px 30px rgba(220,38,38,1)", "0px 0px 10px rgba(220,38,38,0.5)"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-600 drop-shadow-sm leading-tight"
            >
              Monster Meat Raffle
            </motion.h1>
            <p className="text-slate-300 text-lg md:text-2xl font-medium tracking-wide mt-1">Weekly Thursday Draw</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl md:text-3xl lg:text-4xl font-mono font-bold text-slate-100 tabular-nums">{timeLeft}</div>
          <div className="text-slate-400 text-xs md:text-sm uppercase tracking-widest mt-1">Until Draw</div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {state.status === 'thankyou' ? (
            <ThankYouSlides key="thankyou" />
          ) : showBuildup ? (
             <BuildupSlides key="buildup" state={state} />
          ) : state.status === 'drawing' ? (
            <DrawingAnimation key="drawing" currentDraw={state.currentDraw} />
          ) : (
            <ResultsBoard key="results" state={state} />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 p-4 md:p-6 text-center text-slate-500 text-lg md:text-xl font-medium border-t border-slate-800 flex justify-between items-center z-30 relative group overflow-hidden">
        <div className="flex-1 overflow-hidden whitespace-nowrap relative flex items-center">
          <motion.div
            animate={{ x: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="inline-block text-xl md:text-3xl font-bold text-slate-300 tracking-wider"
          >
            Tickets: $5 each or $20 for 4 • Main Draw at 7:00 PM
          </motion.div>
        </div>
        <a href="#/remote" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100 absolute right-6 bg-slate-900 px-4 py-2 rounded-lg z-10">
          Remote Control
        </a>
      </footer>
    </div>
  );
}
