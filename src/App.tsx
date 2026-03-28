/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import MainDisplay from './components/MainDisplay';
import RemoteControl from './components/RemoteControl';
import AdAdmin from './components/AdAdmin';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center font-sans">
          <div className="max-w-2xl w-full bg-slate-800 p-8 rounded-3xl border border-red-500/50 shadow-2xl">
            <h1 className="text-4xl font-black text-red-500 mb-4 uppercase tracking-tight">Something went wrong</h1>
            <p className="text-slate-300 mb-6 text-lg">The application crashed during render. This is likely a runtime error.</p>
            <div className="bg-black/50 p-4 rounded-xl border border-slate-700 font-mono text-sm overflow-auto max-h-60 mb-6">
              <span className="text-red-400 font-bold">{this.state.error?.name}:</span> {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<MainDisplay />} />
          <Route path="/remote" element={<RemoteControl />} />
          <Route path="/ads-admin" element={<AdAdmin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
