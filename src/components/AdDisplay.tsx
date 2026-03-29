import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Slide {
  title: string;
  subtitle: string;
  image: string;
  duration: number;
}

export default function AdDisplay() {
  const DEFAULT_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGkdY9CpTGOcRZf-giDDGGqDcXJaO7BYO9nxyNO4Jw_XpODvq2sicVYtNDy1w-qGnaA5iNJ-lghCNy/pub?output=csv";
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sheetUrl, setSheetUrl] = useState<string>(localStorage.getItem('mmr_sheet_url') || DEFAULT_CSV);
  const [excludedSlides, setExcludedSlides] = useState<string[]>(JSON.parse(localStorage.getItem('mmr_excluded_slides') || '[]'));
  const [titleSize, setTitleSize] = useState(JSON.parse(localStorage.getItem('mmr_raffle_state') || '{}').titleSize || 100);
  const [subtitleSize, setSubtitleSize] = useState(JSON.parse(localStorage.getItem('mmr_raffle_state') || '{}').subtitleSize || 100);
  const [error, setError] = useState<string | null>(null);

  // Sync with Admin tab
  useEffect(() => {
    const bcAds = new BroadcastChannel('mmr_sync_ads');
    bcAds.onmessage = (event) => {
      const { sheetUrl: newUrl, excludedSlides: newExcluded } = event.data;
      if (newUrl) setSheetUrl(newUrl);
      if (newExcluded) setExcludedSlides(newExcluded);
    };

    const bcSync = new BroadcastChannel('mmr_sync');
    bcSync.onmessage = (event) => {
      if (event.data?.titleSize !== undefined) setTitleSize(event.data.titleSize);
      if (event.data?.subtitleSize !== undefined) setSubtitleSize(event.data.subtitleSize);
    };

    return () => {
      bcAds.close();
      bcSync.close();
    };
  }, []);

  const fetchSlides = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.statusText}`);
      
      const text = await response.text();
      // Robust CSV parsing
      const rows = text.split(/\r?\n/).filter(line => line.trim());
      const parsedSlides: Slide[] = rows.slice(1)
        .map(line => {
          const result = [];
          let cur = '';
          let inQuote = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) {
              result.push(cur.trim());
              cur = '';
            } else cur += char;
          }
          result.push(cur.trim());
          const cols = result.map(s => s.replace(/^"|"$/g, ''));
          
          const [title, subtitle, image, duration] = cols;
          if (!title) return null;
          return {
            title,
            subtitle: subtitle || '',
            image: image || '',
            duration: parseInt(duration) || 8000
          };
        })
        .filter(Boolean) as Slide[];

      if (parsedSlides.length > 0) {
        setSlides(parsedSlides);
        setError(null);
      } else {
        setError("No valid slides found in the Google Sheets CSV.");
      }
    } catch (e: any) {
      console.error("Error fetching slides:", e);
      setError(`Sync Error: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    if (sheetUrl) {
      fetchSlides(sheetUrl);
      const interval = setInterval(() => fetchSlides(sheetUrl), 300000); // 5 min refresh
      return () => clearInterval(interval);
    }
  }, [sheetUrl, fetchSlides]);

  const activeSlides = slides.filter(s => !excludedSlides.includes(s.title));

  if (activeSlides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white gap-4">
        <div className="w-16 h-16 border-4 border-slate-800 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-xl font-bold uppercase tracking-widest text-slate-500">Wait for slides...</p>
      </div>
    );
  }

  const safeIndex = currentIndex % activeSlides.length;
  const slide = activeSlides[safeIndex];

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      {/* Event Banner */}
      <div className="bg-red-600 text-white font-black text-center py-2 px-4 shadow-lg border-b-4 border-white z-50 uppercase tracking-widest text-lg md:text-xl relative">
        Join us for our weekly Monster Meat Raffles every Thursday night!
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={safeIndex}
          initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
          transition={{ duration: 1.2, ease: "anticipate" }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
        >
          {slide.image && (
            <div 
              className="absolute inset-0 opacity-40 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})`, filter: 'blur(10px)' }}
            />
          )}

          <div className="z-10 relative space-y-8 max-w-6xl">
            {slide.image && (
              <motion.img 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                src={slide.image} 
                alt={slide.title} 
                className="max-h-[50vh] mx-auto rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/20 mb-8"
              />
            )}
            
            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ fontSize: (titleSize > 100) ? `${(titleSize / 100)}em` : undefined }}
              className="text-6xl md:text-8xl lg:text-9xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] leading-none"
            >
              {slide.title}
            </motion.h1>

            {slide.subtitle && (
              <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ fontSize: (subtitleSize > 100) ? `${(subtitleSize / 100)}em` : undefined }}
                className="text-4xl md:text-6xl lg:text-7xl text-red-500 font-bold uppercase tracking-widest drop-shadow-md"
              >
                {slide.subtitle}
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute bottom-0 left-0 w-full h-2 bg-white/10 overflow-hidden">
        <motion.div
          key={`progress-${currentIndex}`}
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: (slide.duration / 1000), ease: "linear" }}
          className="h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]"
          onAnimationComplete={() => {
            setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
          }}
        />
      </div>

      <div className="absolute top-8 left-8 flex items-center gap-4 opacity-50 z-20">
         <img src="https://coasterstavern.co.nz/wp-content/uploads/2024/03/coasters-new-600-1.png" alt="Logo" className="h-16 w-auto" />
      </div>
    </div>
  );
}
