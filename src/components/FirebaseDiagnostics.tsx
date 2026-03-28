import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Shield, ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';

export default function FirebaseDiagnostics() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Basic check of env vars loaded in browser
    setConfig({
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'MISSING',
      appId: import.meta.env.VITE_FIREBASE_APP_ID ? 'LOADED' : 'MISSING',
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'LOADED' : 'MISSING',
    });
  }, []);

  const runTest = async () => {
    setStatus('testing');
    setError(null);
    try {
      // 1. Test Read
      const testDoc = doc(db, 'config', 'ads');
      await getDoc(testDoc);
      
      // 2. Test Write (to a diagnostics collection)
      const diagDoc = doc(db, 'diagnostics', 'last_test');
      await setDoc(diagDoc, {
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        location: window.location.href
      });

      setStatus('success');
    } catch (e: any) {
      console.error("Diagnostic failure:", e);
      setError(e.message || "Unknown Firestore error");
      setStatus('error');
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          {status === 'success' ? <ShieldCheck className="text-green-500" size={18} /> : 
           status === 'error' ? <ShieldAlert className="text-red-500" size={18} /> : 
           <Shield className="text-slate-400" size={18} />}
          Firebase Connection Test
        </h3>
        <button 
          onClick={runTest}
          disabled={status === 'testing'}
          className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
          title="Run Diagnostic"
        >
          <RefreshCw size={16} className={status === 'testing' ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Project ID:</span>
          <span className="font-mono font-bold text-slate-700">{config?.projectId}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Env Status:</span>
          <span className={`font-bold ${config?.apiKey === 'LOADED' ? 'text-green-600' : 'text-red-600'}`}>
            {config?.apiKey === 'LOADED' ? 'Keys Loaded' : 'Keys Missing'}
          </span>
        </div>
        
        {status === 'success' && (
          <div className="mt-4 p-2 bg-green-100 text-green-700 text-xs rounded-lg font-bold text-center">
            Connection Verified (Read/Write OK)
          </div>
        )}

        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
            <p className="font-bold mb-1">Connection Failed:</p>
            <p className="font-mono break-all">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
