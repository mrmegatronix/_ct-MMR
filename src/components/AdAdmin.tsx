import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Settings, Save, AlertCircle, ExternalLink, Link2, Info, ChevronRight, Play, Monitor, Smartphone, Tv } from 'lucide-react';
import Navigation from './Navigation';

export default function AdAdmin() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [previewSlides, setPreviewSlides] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const adsDoc = doc(db, 'config', 'ads');
    const unsubscribe = onSnapshot(adsDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const url = data.sheetUrl || '';
        setSheetUrl(url);
        if (url) {
            fetchPreview(url);
        }
      } else {
        // Init with empty
        setSheetUrl('');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchPreview = async (url: string) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      const rows = text.split('\n').slice(1);
      const parsed = rows.map(r => r.split(',').map(s => s.trim())).filter(r => r[0]);
      setPreviewSlides(parsed);
    } catch (e) {
      console.error(e);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      if (!sheetUrl.includes('/pub?output=csv')) {
        setMessage({ text: 'Warning: URL might not be a direct CSV export.', type: 'error' });
      }

      const adsDoc = doc(db, 'config', 'ads');
      const snap = await getDoc(adsDoc);
      
      if (!snap.exists()) {
        await setDoc(adsDoc, { sheetUrl });
      } else {
        await updateDoc(adsDoc, { sheetUrl });
      }
      
      setMessage({ text: 'Configuration saved successfully!', type: 'success' });
      fetchPreview(sheetUrl);
    } catch (e: any) {
      setMessage({ text: `Error: ${e.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans max-w-4xl mx-auto shadow-sm">
      <header className="flex flex-col gap-6 mb-8 pb-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-600/30">
              <Settings className="text-white h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Ad Manager</h1>
              <p className="text-slate-500 font-medium">Configure Display Advertisements</p>
            </div>
          </div>
          <div className="flex gap-4">
            <a
              href="./mmr-ads.html"
              target="_blank"
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-md"
            >
              <Play size={18} fill="white" />
              Open Screen
            </a>
          </div>
        </div>
        <div className="flex justify-center">
          <Navigation currentPath="#/ads-admin" />
        </div>
      </header>

      <div className="space-y-8">
        {/* URL Configuration */}
        <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Link2 className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">Slide Source</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase mb-2 tracking-wide">Google Sheets CSV URL</label>
              <div className="relative group">
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-medium text-slate-700 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 outline-none transition-all pr-12 text-lg shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                    <ExternalLink size={20} />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                <Info size={14} /> Paste the "Publish to the web" CSV link from Google Sheets here.
              </p>
            </div>

            <button
              onClick={saveConfig}
              disabled={isSaving}
              className={`w-full flex items-center justify-center gap-2 py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                isSaving ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
              }`}
            >
              {isSaving ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={24} />
                  Update Source
                </>
              )}
            </button>

            {message.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border ${
                message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'
              }`}>
                <AlertCircle size={20} />
                <span className="font-bold">{message.text}</span>
              </div>
            )}
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border border-slate-800">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6 text-red-400 flex items-center gap-3">
             <span>📖</span> Setup Guide
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
               <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xl">1</div>
               <h3 className="font-bold text-lg">Create Sheet</h3>
               <p className="text-slate-400 text-sm leading-relaxed">Headers: <span className="text-slate-200 font-mono bg-slate-800 px-1">Title, Subtitle, ImageURL, Duration(ms)</span></p>
            </div>
            <div className="space-y-3">
               <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xl">2</div>
               <h3 className="font-bold text-lg">Publish File</h3>
               <p className="text-slate-400 text-sm leading-relaxed">File &gt; Share &gt; Publish to web. Select "Entire Document" and "CSV".</p>
            </div>
            <div className="space-y-3">
               <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xl">3</div>
               <h3 className="font-bold text-lg">Paste Link</h3>
               <p className="text-slate-400 text-sm leading-relaxed">Copy the link and paste it above. Slides update automatically!</p>
            </div>
          </div>
        </section>

        {/* Preview */}
        {previewSlides.length > 0 && (
          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in duration-500">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
               <span>Live Preview</span>
               <span>{previewSlides.length} slides detected</span>
            </h2>
            <div className="space-y-3">
              {previewSlides.map((slide, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-red-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 font-mono text-sm overflow-hidden shrink-0">
                      {slide[2] ? <img src={slide[2]} className="w-full h-full object-cover" /> : i+1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 line-clamp-1">{slide[0]}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 italic">{slide[1] || 'No subtitle'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span className="text-xs font-bold font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded-md">{slide[3] || '8000'}ms</span>
                    <ChevronRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
