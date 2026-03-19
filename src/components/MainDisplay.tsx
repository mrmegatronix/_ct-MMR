import React, { useEffect, useState } from 'react';
import { useRaffleSocket } from '../hooks/useRaffleSocket';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function MainDisplay() {
  const { state, isConnected } = useRaffleSocket();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!state) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white text-2xl font-bold">Connecting to server...</div>;
  }

  // Check if it's Thursday between 5:30 PM and 7:00 PM
  const isThursday = currentTime.getDay() === 4;
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const isBuildupTime = isThursday && ((hours === 17 && minutes >= 30) || (hours === 18));

  // Auto-switch to buildup if not drawing and it's buildup time
  // But let's rely on the server state for 'buildup' to allow manual override
  const showBuildup = state.status === 'buildup' || (state.status === 'idle' && isBuildupTime && state.drawnNumbers.length === 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <header className="bg-red-900/80 p-6 shadow-2xl border-b border-red-500/30 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)]">
            <span className="text-3xl">🥩</span>
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-600 drop-shadow-sm">
              Monster Meat Raffle
            </h1>
            <p className="text-red-200 text-xl font-medium tracking-wide">Weekly Thursday Draw</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono font-bold text-red-100">{format(currentTime, 'HH:mm:ss')}</div>
          <div className="text-red-300/80 text-lg uppercase tracking-widest">{format(currentTime, 'EEEE, MMM do')}</div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col p-8">
        <AnimatePresence mode="wait">
          {showBuildup ? (
            <BuildupSlides key="buildup" />
          ) : state.status === 'drawing' ? (
            <DrawingAnimation key="drawing" currentDraw={state.currentDraw} />
          ) : (
            <ResultsBoard key="results" state={state} />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 p-4 text-center text-slate-500 text-sm border-t border-slate-800 flex justify-between items-center">
        <span>Tickets: $5 each or $20 for 4 • Main Draw at 7:00 PM</span>
        <a href="/remote" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-400 transition-colors">
          Remote Control
        </a>
      </footer>
    </div>
  );
}

function BuildupSlides() {
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = [
    {
      title: "Monster Meat Raffle",
      subtitle: "Tickets on sale NOW!",
      content: <div className="text-8xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">🥩 🍗 🥓</div>
    },
    {
      title: "Ticket Prices",
      subtitle: "Get yours before the draw!",
      content: (
        <div className="flex gap-12 justify-center items-center">
          <div className="bg-slate-800 p-8 rounded-3xl border-2 border-slate-700 shadow-2xl">
            <div className="text-4xl text-slate-400 mb-2">Single Ticket</div>
            <div className="text-7xl font-black text-white">$5</div>
          </div>
          <div className="text-6xl text-slate-600 font-bold">OR</div>
          <div className="bg-gradient-to-br from-red-900 to-red-700 p-8 rounded-3xl border-2 border-red-500 shadow-[0_0_40px_rgba(220,38,38,0.4)] transform scale-110">
            <div className="text-4xl text-red-200 mb-2 font-bold">Value Pack</div>
            <div className="text-8xl font-black text-white">$20</div>
            <div className="text-2xl text-red-200 mt-2">for 4 tickets</div>
          </div>
        </div>
      )
    },
    {
      title: "Main Draw",
      subtitle: "Don't miss out!",
      content: <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">7:00 PM</div>
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center p-12"
    >
      <motion.h2 
        key={`title-${slideIndex}`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-7xl font-black uppercase tracking-tight mb-6 text-white"
      >
        {slide.title}
      </motion.h2>
      <motion.h3
        key={`sub-${slideIndex}`}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl text-red-400 font-medium tracking-wide mb-16"
      >
        {slide.subtitle}
      </motion.h3>
      <motion.div
        key={`content-${slideIndex}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
      >
        {slide.content}
      </motion.div>
    </motion.div>
  );
}

function DrawingAnimation({ currentDraw }: { currentDraw: number | null; key?: string }) {
  const [displayNumber, setDisplayNumber] = useState(0);

  useEffect(() => {
    // Rapidly change numbers to simulate a slot machine
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 1000) + 1);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      <h2 className="text-5xl text-red-400 font-bold uppercase tracking-widest mb-12 animate-pulse">Drawing Winner...</h2>
      <div className="bg-slate-900 border-4 border-red-600 rounded-3xl p-16 shadow-[0_0_100px_rgba(220,38,38,0.3)]">
        <div className="text-[12rem] font-mono font-black leading-none text-white tabular-nums tracking-tighter">
          {displayNumber.toString().padStart(3, '0')}
        </div>
      </div>
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
      <div className="flex-1 bg-slate-900/50 rounded-3xl border border-slate-800 p-8 flex flex-col">
        <h2 className="text-3xl font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-4">
          <span className="w-8 h-1 bg-red-600 rounded-full"></span>
          Winning Numbers
          <span className="w-8 h-1 bg-red-600 rounded-full"></span>
        </h2>
        
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
            <div className="w-full h-full flex items-center justify-center text-slate-600 text-2xl font-medium italic">
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
          className="bg-slate-900/80 rounded-3xl border border-orange-500/30 p-6"
        >
          <h2 className="text-2xl font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-3">
            <span>🎲</span> Second Chance Draws
          </h2>
          <div className="flex flex-wrap gap-4">
            {state.secondChanceNumbers.map((num: number, i: number) => (
              <motion.div
                key={`sc-${num}-${i}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-orange-950/50 border border-orange-500/50 rounded-xl px-8 py-4 flex items-center justify-center"
              >
                <span className="text-4xl font-mono font-bold text-orange-200">{num}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
