import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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
  const [sheetUrl, setSheetUrl] = useState<string>(DEFAULT_CSV);
  const [excludedSlides, setExcludedSlides] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for the ads configuration in Firestore
    const adsDoc = doc(db, 'config', 'ads');
    const unsubscribe = onSnapshot(adsDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.sheetUrl && data.sheetUrl !== sheetUrl) {
          setSheetUrl(data.sheetUrl);
        } else if (!data.sheetUrl) {
          setSheetUrl(DEFAULT_CSV);
        }
        setExcludedSlides(data.excludedSlides || []);
        setError(null);
      } else {
        setError("Configuration document 'config/ads' not found in Firestore.");
      }
    }, (err) => {
      console.error("Firestore error in AdDisplay:", err);
      setError(`Firestore Error: ${err.message}`);
    });
    return () => unsubscribe();
  }, [sheetUrl]);

  const fetchSlides = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.statusText}`);
      
      const text = await response.text();
      // Robust CSV parsing (handles quotes and commas)
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
      console.error("Error fetching slides from Google Sheets:", e);
      setError(`Google Sheets Sync Error: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    if (sheetUrl) {
      fetchSlides(sheetUrl);
      // Refresh slides every 5 minutes
      const interval = setInterval(() => fetchSlides(sheetUrl), 300000);
      return () => clearInterval(interval);
    }
  }, [sheetUrl, fetchSlides]);

  useEffect(() => {
    if (slides.length === 0) return;

    const currentSlide = slides[currentIndex];
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, currentSlide?.duration || 8000);

    return () => clearTimeout(timer);
  }, [currentIndex, slides]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white p-8">
        <div className="max-w-xl w-full bg-slate-900 p-8 rounded-3xl border border-red-500/30 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <span className="text-3xl font-bold">!</span>
          </div>
          <h1 className="text-3xl font-black text-red-500 mb-4 uppercase tracking-tight">Ad System Error</h1>
          <p className="text-slate-300 mb-6 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeSlides = slides.filter(s => !excludedSlides.includes(s.title));

  if (activeSlides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white gap-4">
        <div className="w-16 h-16 border-4 border-slate-800 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-xl font-bold uppercase tracking-widest text-slate-500">Wait for slides...</p>
      </div>
    );
  }

  // Ensure index is within bounds if slides were just filtered
  const safeIndex = currentIndex % activeSlides.length;
  const slide = activeSlides[safeIndex];

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
          transition={{ duration: 1.2, ease: "anticipate" }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
        >
          {/* Background Image / Effect */}
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
              className="text-6xl md:text-8xl lg:text-9xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] leading-none"
            >
              {slide.title}
            </motion.h1>

            {slide.subtitle && (
              <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-3xl md:text-5xl lg:text-6xl text-red-500 font-bold uppercase tracking-widest drop-shadow-md"
              >
                {slide.subtitle}
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Progress Bar */}
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
