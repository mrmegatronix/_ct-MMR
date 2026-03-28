import React, { useState, useEffect } from 'react';
import { useRaffleSocket } from '../hooks/useRaffleLocal';
import { Settings, Play, Square, RotateCcw, Download, XCircle, Plus, ExternalLink } from 'lucide-react';
import Navigation from './Navigation';

export default function RemoteControl() {
  const { state, isConnected, error, updateState, drawNumber, resetDraw, excludeNumber, removeExcludedNumber } = useRaffleSocket();
  const [excludeInput, setExcludeInput] = useState('');
  const [editUrl, setEditUrl] = useState(localStorage.getItem('mmr_edit_url') || '');

  useEffect(() => {
    // Sync editUrl from localStorage periodically or on change
    const handleStorage = () => {
      setEditUrl(localStorage.getItem('mmr_edit_url') || '');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white font-sans max-w-md mx-auto">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-red-900/50">
          <div className="w-16 h-16 bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Remote Error</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (!state || !isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-black uppercase tracking-widest mb-2 text-white">Connecting</h1>
        <p className="text-slate-500">Establishing real-time link...</p>
      </div>
    );
  }

  const handleDraw = () => {
    if (state.status === 'idle' || state.status === 'buildup') {
      drawNumber(false);
    }
  };

  const handleSecondChanceDraw = () => {
    if (state.status === 'idle' || state.status === 'buildup') {
      drawNumber(true);
    }
  };

  const toggleBuildup = () => {
    updateState({ status: state.status === 'buildup' ? 'idle' : 'buildup' });
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const val = parseInt(e.target.value) || 0;
    updateState({
      numberRange: {
        ...state.numberRange,
        [type]: val
      }
    });
  };

  const handleAddExclude = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(excludeInput);
    if (!isNaN(num)) {
      excludeNumber(num);
      setExcludeInput('');
    }
  };

  const downloadCSV = () => {
    const headers = ['Type', 'Number', 'Timestamp'];
    const rows = [
      ...state.drawnNumbers.map((n, i) => `Main Draw,${n},Draw ${i+1}`),
      ...state.secondChanceNumbers.map((n, i) => `Second Chance,${n},Draw ${i+1}`),
      ...state.excludedNumbers.map(n => `Excluded,${n},N/A`)
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `raffle_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans max-w-md mx-auto">
      <header className="flex flex-col gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span>🥩</span> Remote
          </h1>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-900/30 text-green-400">
              LOCAL SYNC
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <Navigation currentPath="#/remote" />
        </div>
      </header>

      <div className="space-y-6 pb-20">
        {/* Status & Main Controls */}
        <section className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</h2>
            <span className="px-3 py-1 bg-slate-800 text-red-400 rounded-lg text-sm font-black uppercase tracking-wider border border-red-500/20">
              {state.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={toggleBuildup}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                state.status === 'buildup' 
                  ? 'bg-amber-900/40 text-amber-400 border border-amber-500/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {state.status === 'buildup' ? <Square size={18} /> : <Play size={18} />}
              {state.status === 'buildup' ? 'Stop Slides' : 'Start Slides'}
            </button>
            <button
              onClick={() => updateState({ status: 'idle' })}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                state.status === 'idle' 
                  ? 'bg-blue-900/40 text-blue-400 border border-blue-500/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Results
            </button>
            <button
              onClick={() => updateState({ status: 'thankyou' })}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                state.status === 'thankyou' 
                  ? 'bg-purple-900/40 text-purple-400 border border-purple-500/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Thank You
            </button>
            <button
              onClick={resetDraw}
              className="flex items-center justify-center gap-2 py-3 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-xl font-bold transition-all border border-red-900/50"
            >
              <RotateCcw size={18} />
              Reset All
            </button>
          </div>
        </section>

        {/* Draw Actions */}
        <section className="bg-slate-900 p-5 rounded-3xl shadow-2xl border border-red-900/30 space-y-3">
          <button
            onClick={handleDraw}
            disabled={state.status === 'drawing'}
            className="w-full py-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-black text-2xl uppercase tracking-widest shadow-xl shadow-red-600/30 transition-all active:scale-95"
          >
            {state.status === 'drawing' ? 'Drawing...' : 'Draw Number'}
          </button>
          
          <button
            onClick={handleSecondChanceDraw}
            disabled={state.status === 'drawing'}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg shadow-orange-600/20 transition-all active:scale-95 border border-orange-500/30"
          >
            Second Chance
          </button>
        </section>

        {/* Settings */}
        <section className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Settings size={14} /> Raffle Settings
          </h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Prize Pool</label>
              <input
                type="text"
                value={state.prizePool}
                onChange={(e) => updateState({ prizePool: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 font-bold text-white focus:border-red-500 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Total Prizes</label>
                <input
                  type="text"
                  value={state.numberOfPrizes}
                  onChange={(e) => updateState({ numberOfPrizes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 font-bold text-white focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Draw Qty</label>
                <input
                  type="number"
                  min="1"
                  value={state.drawSettings.amountToDraw}
                  onChange={(e) => updateState({ drawSettings: { ...state.drawSettings, amountToDraw: parseInt(e.target.value) || 1 } })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 font-bold text-white focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Min No.</label>
              <input
                type="number"
                value={state.numberRange.min}
                onChange={(e) => handleRangeChange(e, 'min')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 font-mono font-bold text-white focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Max No.</label>
              <input
                type="number"
                value={state.numberRange.max}
                onChange={(e) => handleRangeChange(e, 'max')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 font-mono font-bold text-white focus:border-red-500 outline-none"
              />
            </div>
          </div>

          {/* Text Size Scaling */}
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Display Scale</h3>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>TITLE SIZE</span>
                <span>{state.titleSize || 100}%</span>
              </div>
              <input
                type="range"
                min="100"
                max="300"
                step="5"
                value={state.titleSize || 100}
                onChange={(e) => updateState({ titleSize: parseInt(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>SUBTITLE SIZE</span>
                <span>{state.subtitleSize || 100}%</span>
              </div>
              <input
                type="range"
                min="100"
                max="300"
                step="5"
                value={state.subtitleSize || 100}
                onChange={(e) => updateState({ subtitleSize: parseInt(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
          </div>

          {/* Exclusions */}
          <div className="border-t border-slate-800 pt-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Exclude Numbers</label>
            <form onSubmit={handleAddExclude} className="flex gap-2 mb-3">
              <input
                type="number"
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                placeholder="e.g. 42"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 font-mono focus:border-red-500 outline-none"
              />
              <button type="submit" className="bg-slate-800 text-white px-4 rounded-xl hover:bg-red-600 transition-all flex items-center justify-center">
                <Plus size={20} />
              </button>
            </form>
            
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {state.excludedNumbers.map(num => (
                <span key={num} className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded-lg text-xs font-mono">
                  {num}
                  <button onClick={() => removeExcludedNumber(num)} className="text-slate-500 hover:text-red-500">
                    <XCircle size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {editUrl && (
              <a
                href={editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700"
              >
                <ExternalLink size={16} />
                Edit Sheet
              </a>
            )}
            <button
              onClick={downloadCSV}
              className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
