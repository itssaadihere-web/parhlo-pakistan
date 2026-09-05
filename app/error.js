"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Next.js Page Error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-900 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl border border-gray-100">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm font-medium mb-8">
          The page encountered a temporary issue. You can try refreshing or returning to the home page.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-[#064e3b] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg active:scale-95"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full bg-gray-100 text-gray-800 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all text-sm"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
