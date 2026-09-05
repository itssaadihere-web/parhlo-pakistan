"use client";

import React, { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global Error caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-900 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            ⚠️
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Application Error</h2>
          <p className="text-gray-500 text-sm font-medium mb-8">
            An unexpected error occurred. Please click below to reload the application.
          </p>
          <button
            onClick={() => reset()}
            className="w-full bg-[#064e3b] text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
