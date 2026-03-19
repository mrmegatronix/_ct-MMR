import React, { useState } from 'react';
import { useRaffleSocket } from '../hooks/useRaffleSocket';
import { Settings, Play, Square, RotateCcw, Download, XCircle, Plus } from 'lucide-react';

export default function RemoteControl() {
  const { state, isConnected, updateState, drawNumber, resetDraw, excludeNumber, removeExcludedNumber } = useRaffleSocket();
  const [excludeInput, setExcludeInput] = useState('');

  if (!state) {
    return <div className="p-8 text-center text-slate-500">Connecting to server...</div>;
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
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 font-sans max-w-md mx-auto shadow-2xl">
      <header className="flex items-center justify-between mb-6 pb-4 border-b border-slate-300">
        <h1 className="text-2xl font-black text-red-700 uppercase tracking-tight flex items-center gap-2">
          <span>🥩</span> Remote
        </h1>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isConnected ? 'Connected' : 'Offline'}
        </div>
      </header>

      <div className="space-y-6 pb-20">
        {/* Status & Main Controls */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Status</h2>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium capitalize">
              {state.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={toggleBuildup}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${
                state.status === 'buildup' 
                  ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {state.status === 'buildup' ? <Square size={18} /> : <Play size={18} />}
              {state.status === 'buildup' ? 'Stop Slides' : 'Start Slides'}
            </button>
            <button
              onClick={resetDraw}
              className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors"
            >
              <RotateCcw size={18} />
              Reset All
            </button>
          </div>
        </section>

        {/* Draw Actions */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <button
            onClick={handleDraw}
            disabled={state.status === 'drawing'}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-black text-xl uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all active:scale-95"
          >
            {state.status === 'drawing' ? 'Drawing...' : 'Draw Number'}
          </button>
          
          <button
            onClick={handleSecondChanceDraw}
            disabled={state.status === 'drawing'}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold text-lg uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all active:scale-95"
          >
            Second Chance Draw
          </button>
        </section>

        {/* Settings */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Settings size={16} /> Settings
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Min Number</label>
              <input
                type="number"
                value={state.numberRange.min}
                onChange={(e) => handleRangeChange(e, 'min')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-lg font-mono font-bold text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Max Number</label>
              <input
                type="number"
                value={state.numberRange.max}
                onChange={(e) => handleRangeChange(e, 'max')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-lg font-mono font-bold text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Amount to Draw</label>
            <input
              type="number"
              min="1"
              max="100"
              value={state.drawSettings.amountToDraw}
              onChange={(e) => updateState({ drawSettings: { ...state.drawSettings, amountToDraw: parseInt(e.target.value) || 1 } })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-lg font-mono font-bold text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          {/* Exclusions */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Exclude Numbers</label>
            <form onSubmit={handleAddExclude} className="flex gap-2 mb-3">
              <input
                type="number"
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                placeholder="e.g. 42"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-red-500 outline-none"
              />
              <button type="submit" className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center">
                <Plus size={20} />
              </button>
            </form>
            
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {state.excludedNumbers.map(num => (
                <span key={num} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-md text-sm font-mono">
                  {num}
                  <button onClick={() => removeExcludedNumber(num)} className="text-slate-400 hover:text-red-500">
                    <XCircle size={14} />
                  </button>
                </span>
              ))}
              {state.excludedNumbers.length === 0 && (
                <span className="text-xs text-slate-400 italic">No numbers excluded</span>
              )}
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Data</h2>
            <div className="text-xs font-mono text-slate-400">
              {state.drawnNumbers.length} drawn
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Drawn Numbers</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {state.drawnNumbers.map(num => (
                <span key={`drawn-${num}`} className="inline-flex items-center gap-1 bg-red-100 border border-red-200 text-red-700 px-2 py-1 rounded-md text-sm font-mono">
                  {num}
                  <button 
                    onClick={() => {
                      excludeNumber(num);
                      // We also need to remove it from drawnNumbers on the server
                      updateState({ drawnNumbers: state.drawnNumbers.filter(n => n !== num) });
                    }} 
                    className="text-red-400 hover:text-red-600 ml-1"
                    title="Move to Excluded"
                  >
                    <XCircle size={14} />
                  </button>
                </span>
              ))}
              {state.drawnNumbers.length === 0 && (
                <span className="text-xs text-slate-400 italic">No numbers drawn yet</span>
              )}
            </div>
          </div>

          <button
            onClick={downloadCSV}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors"
          >
            <Download size={18} />
            Download Results CSV
          </button>
        </section>
      </div>
    </div>
  );
}
