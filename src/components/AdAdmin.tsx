import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, ExternalLink, Link2, Play, Eye, EyeOff, ChevronRight } from 'lucide-react';
import Navigation from './Navigation';

export default function AdAdmin() {
  const DEFAULT_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGkdY9CpTGOcRZf-giDDGGqDcXJaO7BYO9nxyNO4Jw_XpODvq2sicVYtNDy1w-qGnaA5iNJ-lghCNy/pub?output=csv";
  
  const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('mmr_sheet_url') || DEFAULT_CSV);
  const [editUrl, setEditUrl] = useState(localStorage.getItem('mmr_edit_url') || '');
  const [excludedSlides, setExcludedSlides] = useState<string[]>(JSON.parse(localStorage.getItem('mmr_excluded_slides') || '[]'));
  const [previewSlides, setPreviewSlides] = useState<any[]>([]);
  const [titleSize, setTitleSize] = useState(JSON.parse(localStorage.getItem('mmr_raffle_state') || '{}').titleSize || 100);
  const [subtitleSize, setSubtitleSize] = useState(JSON.parse(localStorage.getItem('mmr_raffle_state') || '{}').subtitleSize || 100);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchPreview(sheetUrl);
  }, []);

  const fetchPreview = async (url: string) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      // Robust CSV parsing
      const rows = text.split(/\r?\n/).filter(line => line.trim());
      const parsed = rows.slice(1).map(line => {
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
        return result.map(s => s.replace(/^"|"$/g, ''));
      }).filter(r => r[0]);
      
      setPreviewSlides(parsed);
    } catch (e) {
      console.error(e);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      localStorage.setItem('mmr_sheet_url', sheetUrl);
      localStorage.setItem('mmr_edit_url', editUrl);
      localStorage.setItem('mmr_excluded_slides', JSON.stringify(excludedSlides));
      
      // Notify other tabs
      const bc = new BroadcastChannel('mmr_sync_ads');
      bc.postMessage({ sheetUrl, editUrl, excludedSlides });
      bc.close();

      setMessage({ text: 'Configuration saved to local storage!', type: 'success' });
      fetchPreview(sheetUrl);
    } catch (e: any) {
      console.error(e);
      setMessage({ text: `Error: ${e.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSlide = (slideTitle: string) => {
    const isExcluded = excludedSlides.includes(slideTitle);
    const newExcluded = isExcluded
      ? excludedSlides.filter(s => s !== slideTitle)
      : [...excludedSlides, slideTitle];
    
    setExcludedSlides(newExcluded);
    localStorage.setItem('mmr_excluded_slides', JSON.stringify(newExcluded));
    
    // Notify other tabs
    const bc = new BroadcastChannel('mmr_sync_ads');
    bc.postMessage({ excludedSlides: newExcluded });
    bc.close();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans max-w-4xl mx-auto">
      <header className="flex flex-col gap-6 mb-8 pb-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-600/30">
              <Settings className="text-white h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Ad Manager</h1>
              <p className="text-slate-400 font-medium tracking-tight">Configure Slides & Sources (No Cloud Required)</p>
            </div>
          </div>
          <div className="flex gap-4">
            <a
              href="./mmr-ads.html"
              target="_blank"
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
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
        {/* Local Status Indicator */}
        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-green-400 uppercase tracking-widest">Local-Only Mode Active</span>
        </div>

        {/* URL Configuration */}
        <section className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xl border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <Link2 className="text-red-500" size={24} />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Slide Source</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">CSV URL (Public)</label>
              <div className="relative group">
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-5 py-4 font-medium text-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all pr-12 text-lg shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                    <ExternalLink size={20} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Edit URL (Keep private)</label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-5 py-3 font-medium text-slate-200 focus:border-red-500 outline-none transition-all shadow-inner"
              />
            </div>

            {/* Text Size Scaling */}
            <div className="border-t border-slate-800 pt-6 space-y-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Settings size={16} /> Global Slide Scale
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">
                    <span>Title Growth</span>
                    <span className="text-red-500">{titleSize}%</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="300"
                    step="5"
                    value={titleSize}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value);
                      setTitleSize(newSize);
                      const st = JSON.parse(localStorage.getItem('mmr_raffle_state') || '{}');
                      st.titleSize = newSize;
                      localStorage.setItem('mmr_raffle_state', JSON.stringify(st));
                      new BroadcastChannel('mmr_sync').postMessage(st);
                    }}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">
                    <span>Subtitle Growth</span>
                    <span className="text-red-500">{subtitleSize}%</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="300"
                    step="5"
                    value={subtitleSize}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value);
                      setSubtitleSize(newSize);
                      const st = JSON.parse(localStorage.getItem('mmr_raffle_state') || '{}');
                      st.subtitleSize = newSize;
                      localStorage.setItem('mmr_raffle_state', JSON.stringify(st));
                      new BroadcastChannel('mmr_sync').postMessage(st);
                    }}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={saveConfig}
                disabled={isSaving}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                  isSaving ? 'bg-slate-800 text-slate-600' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                }`}
              >
                {isSaving ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={20} /> Save Configuration</>}
              </button>
              
              {editUrl && (
                <a
                  href={editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-white shadow-lg transition-all active:scale-95 border border-slate-700"
                >
                  <ExternalLink size={20} />
                  Edit Sheet
                </a>
              )}
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top-2 duration-300 ${
                message.type === 'error' ? 'bg-red-950/50 border-red-500/30 text-red-200' : 'bg-green-950/50 border-green-500/30 text-green-200'
              }`}>
                <AlertCircle size={20} />
                <span className="font-bold">{message.text}</span>
              </div>
            )}
          </div>
        </section>

        {/* Preview */}
        {previewSlides.length > 0 && (
          <section className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xl border border-slate-800">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center justify-between">
               <span>Live Preview</span>
               <span className="bg-slate-800 px-3 py-1 rounded-full text-slate-300 text-xs">{previewSlides.length} slides</span>
            </h2>
            <div className="space-y-3">
              {previewSlides.map((slide, i) => {
                const isExcluded = excludedSlides.includes(slide[0]);
                return (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isExcluded 
                      ? 'bg-slate-950/50 border-slate-800 opacity-40 italic' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-red-500/50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleSlide(slide[0])}
                        className={`p-2 rounded-lg transition-colors ${
                          isExcluded ? 'text-slate-600 hover:text-red-500' : 'text-red-500 hover:bg-red-500/10'
                        }`}
                        title={isExcluded ? "Enable Slide" : "Disable Slide"}
                      >
                        {isExcluded ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                      <div className="w-12 h-12 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center text-slate-600 font-mono text-xs overflow-hidden shrink-0">
                        {slide[2] && <img src={slide[2]} className="w-full h-full object-cover" />}
                        {!slide[2] && (i+1)}
                      </div>
                      <div>
                        <h4 className={`font-bold line-clamp-1 ${isExcluded ? 'text-slate-600 line-through' : 'text-white'}`}>
                          {slide[0]}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1 italic">{slide[1] || 'No subtitle'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500">
                      <span className="text-xs font-bold font-mono bg-slate-900 px-2 py-1 rounded-md">{slide[3] || '8000'}ms</span>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
