"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function GlobalErrorBoundary({ error, reset }) {
  const [retried, setRetried] = useState(false);
  const [autoRetrying, setAutoRetrying] = useState(false);

  useEffect(() => {
    // Log the error for diagnostics
    console.error("Caught error in Next.js error boundary:", error);

    // If it's a chunk loading failure or transient network fetch error, attempt 1 auto-retry seamlessly
    const isChunkOrFetchError = 
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Failed to fetch") ||
      error?.name === "ChunkLoadError";

    if (!retried && isChunkOrFetchError) {
      setRetried(true);
      setAutoRetrying(true);
      const timer = setTimeout(() => {
        setAutoRetrying(false);
        try {
          reset();
        } catch (e) {
          console.warn("Auto-retry failed:", e);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [error, reset, retried]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-10 text-center shadow-2xl border border-slate-100">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-600 shadow-inner">
          <AlertTriangle size={32} />
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">
          Temporary Hiccup
        </h1>

        <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">
          {autoRetrying
            ? "Reconnecting and reloading the view..."
            : "We encountered a temporary issue loading this section. You can try refreshing or returning home."}
        </p>

        {error?.message && process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 text-xs font-mono rounded-xl text-left overflow-auto max-h-32 border border-red-100">
            {error.message}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setAutoRetrying(true);
              setTimeout(() => {
                reset();
                setAutoRetrying(false);
              }, 300);
            }}
            disabled={autoRetrying}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#064e3b] text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 text-sm"
          >
            <RefreshCw size={16} className={autoRetrying ? "animate-spin" : ""} />
            {autoRetrying ? "Retrying..." : "Try Again"}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
          >
            <RefreshCw size={16} />
            Reload Page
          </button>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 py-2 font-semibold text-xs transition-colors"
          >
            <Home size={14} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
