"use client";

import React, { useState } from 'react'; // Added useState
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthModal from '@/app/components/AuthModal'; // Import your AuthModal component
import { 
  Users, 
  Target, 
  Rocket, 
  ShieldCheck, 
  Heart, 
  Award,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export default function AboutPage() {
  // State to control the visibility of the login/signup popup
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAdmin = window.localStorage.getItem('parhloAdmin') === 'true';
      const storedRole = window.localStorage.getItem('parhloRole');
      const email = window.localStorage.getItem('currentUserEmail');
      if (isAdmin || storedRole === 'admin') setUserRole('admin');
      else if (storedRole === 'teacher') setUserRole('teacher');
      else if (email) setUserRole('student');
    }
  }, []);
  
  const handleJoin = () => {
    setShowAuthModal(true); // Triggers the modal to open
  };

  const handleLoginSuccess = (role) => {
    setShowAuthModal(false);
    if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'teacher') {
      router.push('/teacher');
    } else {
      router.push('/dashboard');
    }
  };

  const LandingNav = () => (
    <nav className="border-b border-gray-100 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-50 p-4">
      <div className="flex items-center gap-2">
        <button 
          className="md:hidden text-gray-900 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        <Link href="/" className="pl-2 md:pl-8">
          <img 
            src="/logo.png" 
            alt="Parhlo Pakistan Logo" 
            className="h-10 md:h-20 w-auto object-contain cursor-pointer logo-outline" 
          />
        </Link>
      </div>
      
      <div className="hidden md:flex gap-10 text-sm font-bold text-gray-600">
        <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
        <Link href="/courses" className="hover:text-green-600 transition-colors cursor-pointer">Subjects</Link>
        <Link href="/about" className="text-green-600 transition-colors">About</Link>
      </div>
      
      <div className="hidden md:block">
        {userRole === 'admin' ? (
          <Link href="/admin" className="mr-4">
            <button className="bg-[#064e3b] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-green-600 transition-all shadow-lg">
              Admin Panel
            </button>
          </Link>
        ) : userRole === 'teacher' ? (
          <Link href="/teacher" className="mr-4">
            <button className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-lg">
              Teacher Panel
            </button>
          </Link>
        ) : userRole === 'student' ? (
          <Link href="/dashboard" className="mr-4">
            <button className="bg-green-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-green-700 transition-all shadow-lg">
              My Dashboard
            </button>
          </Link>
        ) : (
          <button 
            onClick={handleJoin}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-green-600 transition-all shadow-lg mr-4"
          >
            Join Now
          </button>
        )}
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-24 left-4 right-4 bg-white rounded-3xl p-6 shadow-2xl z-50 flex flex-col gap-6">
          <Link href="/" className="text-gray-900 font-bold hover:text-green-600 text-lg" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link href="/courses" className="text-gray-900 font-bold hover:text-green-600 text-lg" onClick={() => setIsMobileMenuOpen(false)}>Subjects</Link>
          <Link href="/about" className="text-gray-900 font-bold hover:text-green-600 text-lg" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
          <div className="pt-4 border-t border-gray-100">
            {userRole === 'admin' ? (
              <Link href="/admin">
                <button className="w-full bg-[#064e3b] text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all">
                  Admin Panel
                </button>
              </Link>
            ) : userRole === 'teacher' ? (
              <Link href="/teacher">
                <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                  Teacher Panel
                </button>
              </Link>
            ) : userRole === 'student' ? (
              <Link href="/dashboard">
                <button className="w-full bg-green-500 text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-green-400 transition-all">
                  My Dashboard
                </button>
              </Link>
            ) : (
              <button 
                onClick={() => { setIsMobileMenuOpen(false); handleJoin(); }}
                className="w-full bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all"
              >
                Join Now
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );

  const Footer = () => (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-10">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <img src="/logo.png" alt="Logo" className="h-16 mb-6 logo-outline" />
            <p className="text-gray-500 max-w-sm leading-relaxed font-medium">
              Helping Class 9 Sindh Board students achieve top results through concept-based digital learning. Join Parhlo Pakistan and study smarter from home.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs">Quick Links</h4>
            <ul className="space-y-4 text-gray-500 text-sm font-semibold">
              <li><Link href="/courses" className="hover:text-green-600 cursor-pointer">Browse Subjects</Link></li>
              <li className="hover:text-green-600 cursor-pointer">Privacy Policy</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs">Support</h4>
            <p className="text-gray-500 text-sm font-semibold mb-2">Need help? Contact us:</p>
            <p className="text-gray-500 text-sm font-semibold mb-2">parhlo.pakistan.edu@gmail.com</p>
            <p className="text-gray-500 text-sm font-semibold">📱 WhatsApp: 0330 2882822</p>
          </div>
        </div>
        <div className="pt-10 border-t border-gray-100 text-center">
          <p className="text-gray-600 font-bold mb-6">Trusted by students across Karachi for Class 9 Board Preparation</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Designed & Developed by</p>
          <a href="https://mockup.media" target="_blank" rel="noopener noreferrer" className="inline-block text-gray-400 hover:text-green-600 transition-all font-light text-base mb-4">
            Mockup Media (SMC-Private) Limited
          </a>
          <div className="flex justify-center items-center flex-col gap-2">
            <p className="text-black text-[10px] font-bold">© 2026 Parhlo Pakistan. All Rights Reserved.</p>
            <p className="text-black text-[10px] font-bold">Concepts Clear Hain Boss 🚀</p>
          </div>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-green-100">
      <LandingNav />

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-8 py-20 md:py-32 text-center">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-tight">
          OUR <span className="text-green-600">MISSION.</span>
        </h1>
        <p className="text-xl text-gray-500 font-medium leading-relaxed">
          We are a movement dedicated to bridging the gap between traditional education and the digital education for the youth of Pakistan.
        </p>
      </section>

      {/* Core Values Grid */}
      <section className="max-w-6xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
        {[
          { 
            title: "Expert Mentorship", 
            desc: "Learn directly from leading digital instructors who have already paved the way in edtech.",
            icon: <Users className="text-green-600" size={32} />
          },
          { 
            title: "Result Oriented", 
            desc: "Our subjects are designed to help you ace your board exams, using digital learning.",
            icon: <Target className="text-green-600" size={32} />
          },
          { 
            title: "Innovation First", 
            desc: "We stay ahead of the curve, teaching using latest methodology such as visually glass board teaching by gen z instructors.",
            icon: <Rocket className="text-green-600" size={32} />
          }
        ].map((value, i) => (
          <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500">
            <div className="mb-6 bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center">
              {value.icon}
            </div>
            <h3 className="text-2xl font-black mb-4">{value.title}</h3>
            <p className="text-gray-500 font-medium leading-relaxed">{value.desc}</p>
          </div>
        ))}
      </section>

      {/* Story Section */}
      <section className="bg-white py-32 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="aspect-square bg-gray-100 rounded-[4rem] overflow-hidden relative">
               <img src="/about-hq.png" alt="Parhlo Pakistan HQ" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-green-600 text-white p-10 rounded-[2.5rem] hidden md:block">
              <p className="text-4xl font-black italic">5,000+</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Students Empowered</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-5xl font-black tracking-tight mb-8">Why We Started</h2>
            <div className="space-y-6 text-gray-500 font-medium leading-relaxed">
              <p>
                With rising inflation, the cost of travelling to academies has significantly increased, making traditional learning more difficult for many families. Students often have to attend classes regardless of their focus or readiness, which affects their ability to understand concepts effectively.
              </p>
              <p>
                Parhlo Pakistan was created to solve this problem by introducing smart digital learning, allowing students to study from home with better focus, flexibility, and clear concept-based understanding through modern teaching methods.
              </p>
              
              <h3 className="text-2xl font-black text-gray-900 mt-8 mb-4">Secure Learning</h3>
              <p>
                We provide a reliable and student-friendly platform where students can access high-quality lectures anytime, ensuring a safe, flexible, and effective learning experience without the burden of travel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-4xl mx-auto px-8 py-32 text-center">
        <Heart className="mx-auto text-red-500 mb-8" size={48} fill="currentColor" />
        <h2 className="text-4xl font-black mb-8">Ready to grow with us?</h2>
        <button 
          onClick={handleJoin}
          className="bg-gray-900 text-white px-12 py-5 rounded-full font-black text-lg hover:bg-green-600 transition-all shadow-2xl"
        >
          Join the Community
        </button>
      </section>

      <Footer />

      {/* ACTUAL MODAL RENDERING: This is what was missing */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}