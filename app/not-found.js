import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-900 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl border border-gray-100">
        <h1 className="text-6xl font-black text-[#064e3b] mb-4">404</h1>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Page Not Found</h2>
        <p className="text-gray-500 text-sm font-medium mb-8">
          The page you are looking for might have been moved, removed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-[#064e3b] text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg text-sm"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
