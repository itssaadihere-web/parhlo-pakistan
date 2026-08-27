"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthModal from '@/app/components/AuthModal';
import { 
  X, 
  CreditCard,
  ChevronRight, 
  PlayCircle, 
  Star, 
  Globe, 
  ShieldCheck, 
  Users,
  Menu
} from 'lucide-react';

import { supabase } from '@/utils/supabase';
import { getDeterministicRating } from '@/utils/courseHelpers';
import { formatCurrency, parsePrice } from '@/utils/currencyHelpers';

export default function ParhloPakistan() {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [transactionId, setTransactionId] = useState('');
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLoginSuccess = (role) => {
    setShowAuthModal(false);
    if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'sales') {
      router.push('/sales');
    } else if (role === 'teacher') {
      router.push('/teacher');
    } else {
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAdmin = window.localStorage.getItem('parhloAdmin') === 'true';
      const storedRole = window.localStorage.getItem('parhloRole');
      const email = window.localStorage.getItem('currentUserEmail');
      if (isAdmin || storedRole === 'admin') setUserRole('admin');
      else if (storedRole === 'sales') setUserRole('sales');
      else if (storedRole === 'teacher') setUserRole('teacher');
      else if (email) setUserRole('student');

      fetchFeaturedCourses();
    }
  }, []);

  const fetchFeaturedCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('name, slug, thumbnail, price, discount, students, rating, tag')
      .limit(3)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured courses:', error);
      // Fallback to empty if DB fails
      setFeaturedCourses([]);
    } else if (data && data.length > 0) {
      const mappedCourses = data.map(course => {
        const studentsCount = parseInt(course.students) || 0;
        const originalPrice = parsePrice(course.price);
        const discountPercent = parseFloat(String(course.discount || '').replace(/[^0-9.]/g, '')) || 0;
        const salePrice = discountPercent > 0 ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice;

        return {
          title: course.name,
          slug: course.slug,
          thumbnail: course.thumbnail,
          price: originalPrice,
          salePrice: salePrice,
          discount: discountPercent > 0 ? discountPercent : 0,
          students: studentsCount >= 5 ? String(studentsCount) : null,
          rating: getDeterministicRating(course.slug),
          tag: course.tag || 'New'
        };
      });
      setFeaturedCourses(mappedCourses);
    } else {
      setFeaturedCourses([]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-green-100">
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />
      
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[2.5rem] max-w-md w-full relative shadow-2xl border border-gray-100">
            <button onClick={() => setShowPaymentModal(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors"><X /></button>
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6"><CreditCard size={28} /></div>
            <h3 className="text-2xl font-black mb-1 text-slate-900">Get {showPaymentModal.title}</h3>
            <p className="text-gray-500 mb-8 text-sm font-medium">Send <span className="font-bold text-gray-900 text-lg">{formatCurrency(showPaymentModal.price)}</span> to the details below.</p>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8">
              <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-1">EasyPaisa / JazzCash</p>
              <p className="text-xl font-mono text-gray-900 font-bold tracking-tight">03xx-xxxxxxx</p>
              <p className="text-xs text-gray-400 mt-1">Title: Syed Saad</p>
            </div>
            <input type="text" placeholder="Enter Transaction ID" className="w-full bg-white border border-gray-200 p-4 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-green-500 font-medium" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
            <button onClick={() => setShowPaymentModal(null)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-black hover:bg-green-600 transition-all shadow-xl">ACTIVATE NOW</button>
          </div>
        </div>
      )}
      
      <div className="relative w-full">
        {/* Hero Background Image */}
        <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat"></div>
        {/* Gradient overlays to ensure text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
        {/* Reduced bottom gradient length */}
        <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-gray-50 to-transparent z-0"></div>
        
        {/* Transparent Header Menu */}
        <nav className="relative flex justify-between items-center z-50 p-4">
          <div className="flex items-center gap-2">
            <button 
              className="md:hidden text-gray-200 p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            <Link href="/" className="pl-2 md:pl-8">
              <img src="/logo.png" alt="Parhlo Pakistan Logo" className="h-10 md:h-20 w-auto object-contain cursor-pointer logo-outline" />
            </Link>
          </div>
          <div className="hidden md:flex gap-10 text-sm font-bold text-gray-200">
            <Link href="/" className="text-green-400 transition-colors">Home</Link>
            <Link href="/courses" className="hover:text-green-400 transition-colors cursor-pointer">Subjects</Link>
            <Link href="/about" className="hover:text-green-400 transition-colors">About</Link>
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
                <button className="bg-green-500 text-gray-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-white hover:text-green-700 transition-all shadow-lg">
                  My Dashboard
                </button>
              </Link>
            ) : (
              <button 
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                className="bg-green-500 text-gray-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-white hover:text-green-700 transition-all shadow-lg mr-4"
              >
                Join Now
              </button>
            )}
          </div>
        </nav>

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
                  onClick={() => { setIsMobileMenuOpen(false); setAuthMode('signup'); setShowAuthModal(true); }}
                  className="w-full bg-green-500 text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-green-400 transition-all"
                >
                  Join Now
                </button>
              )}
            </div>
          </div>
        )}

        <header className="relative max-w-6xl mx-auto px-8 py-20 md:py-32 text-center z-10">
          <div className="inline-block px-5 py-2 bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-100 mb-8 shadow-sm">
            🚀 Pakistan's first ever-Gen-Z instructors Platform
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.85] text-white drop-shadow-2xl">
            LEARN SMART. <br /><span className="text-green-400">SCORE HIGH.</span>
          </h1>
          <p className="text-gray-100 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-xl">
            Complete Sindh Board preparation with visual glass board learning, expert instructors, and exam-focused content.
          </p>
          <Link href="/courses">
            <button className="bg-green-500 text-gray-900 px-12 py-5 rounded-full font-black text-lg hover:bg-white hover:text-green-700 transition-all shadow-2xl hover:-translate-y-1">
              Start Learning Now
            </button>
          </Link>
        </header>
      </div>

      <section className="max-w-6xl mx-auto px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-32">
        {[
          { label: 'Students', val: '5,000+', icon: <Users size={22}/> },
          { label: 'Subjects', val: '12+', icon: <PlayCircle size={22}/> },
          { label: 'Success Rate', val: '94%', icon: <ShieldCheck size={22}/> },
          { label: 'Global reach', val: '12', icon: <Globe size={22}/> }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 text-center shadow-sm">
            <div className="text-green-600 flex justify-center mb-3">{stat.icon}</div>
            <div className="text-xl md:text-2xl font-black text-gray-900 break-words">{stat.val}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-8 pb-40">
        <div className="mb-16">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-5xl font-black tracking-tight text-gray-900">Available Subjects</h2>
            <Link href="/courses" className="text-gray-900 font-bold flex items-center gap-2 hover:text-green-600 transition-colors">
              View All <ChevronRight size={20} />
            </Link>
          </div>
          <p className="text-gray-500 max-w-2xl font-medium">Explore our Sindh Board courses designed for clear concept building, strong exam preparation, and better academic performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {featuredCourses.map((course, i) => (
            <div key={i} className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="h-56 relative bg-gradient-to-br from-slate-900 via-slate-700 to-green-600 flex items-center justify-center overflow-hidden">
                {course.thumbnail && (
                  <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                )}
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute top-6 left-6 z-10">
                  <span className="bg-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-gray-900 shadow-sm">{course.tag}</span>
                </div>
                <PlayCircle size={60} className="text-white opacity-40 group-hover:opacity-80 transition-all group-hover:scale-110 z-10 relative" />
              </div>
              <div className="p-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={16} className="text-yellow-400" fill="currentColor" />
                  <span className="text-xs font-bold text-gray-400">
                    {course.rating} {course.students ? `• ${course.students} Students` : ''}
                  </span>
                </div>
                <h3 className="text-2xl font-black mb-10 leading-tight group-hover:text-green-600 transition-colors">{course.title}</h3>
                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                  <div className="flex flex-col">
                    {course.discount > 0 ? (
                      <>
                        <span className="text-sm font-bold text-gray-400 line-through">{formatCurrency(course.price)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-gray-900">{formatCurrency(course.salePrice)}</span>
                          <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-md">-{course.discount}%</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-2xl font-black text-gray-900">{formatCurrency(course.price)}</span>
                    )}
                  </div>
                  <Link href={`/courses/${course.slug}`}>
                    <button className="bg-gray-100 hover:bg-[#064e3b] hover:text-white px-8 py-3 rounded-2xl font-black transition-all text-gray-900 uppercase text-[10px] tracking-widest">
                      Detail
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Educational Value & Learning Methodology Section */}
      <section className="bg-slate-900 text-white py-20 mb-24 rounded-[3.5rem] max-w-6xl mx-auto px-8 relative overflow-hidden border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-900/30 via-slate-900 to-slate-900 pointer-events-none" />
        <div className="relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-green-400 text-xs font-black uppercase tracking-widest bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20 inline-block mb-4">
              Why Choose Parhlo Pakistan?
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              Concept-Based Learning Designed for Top Academic Results
            </h2>
            <p className="text-slate-300 font-medium leading-relaxed text-base">
              Parhlo Pakistan bridges the gap between traditional rote memorization and modern conceptual clarity. Our video masterclasses utilize interactive glass-board technology to make complex Board syllabus topics easy to understand and remember.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-950/80 p-8 rounded-3xl border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center font-bold mb-6">
                01
              </div>
              <h3 className="text-xl font-bold mb-3">Exam-Focused Syllabus Coverage</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Every lecture is aligned with current Board textbook chapters, past paper questions, and marking schemes to maximize your exam scores.
              </p>
            </div>

            <div className="bg-slate-950/80 p-8 rounded-3xl border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center font-bold mb-6">
                02
              </div>
              <h3 className="text-xl font-bold mb-3">Gen-Z Instructors & Mentors</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Learn from young, passionate instructors who speak your language, solve complex problems step-by-step, and share practical study hacks.
              </p>
            </div>

            <div className="bg-slate-950/80 p-8 rounded-3xl border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center font-bold mb-6">
                03
              </div>
              <h3 className="text-xl font-bold mb-3">Flexible Study & Demo Previews</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Watch free demo preview lectures before enrolling. Track your progress anytime on mobile, laptop, or tablet with lifetime access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Student FAQ Section */}
      <section className="max-w-4xl mx-auto px-8 pb-32">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Frequently Asked Questions</h2>
          <p className="text-gray-500 font-medium text-sm">Everything you need to know about learning with Parhlo Pakistan</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">What boards and subjects are covered on Parhlo Pakistan?</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              We specialize in Sindh Board and Federal Board preparation for Class 9, Class 10, Class 11, and Class 12, focusing on core science and technical subjects including Physics, Chemistry, Computer Science, Biology, Mathematics, and English grammar.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">How do I start watching free demo lectures?</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Simply click on any subject from the courses page, select &quot;Start Free Demo Lecture&quot; or click any video labeled with a free preview tag. You do not need a credit card to watch free demo lectures.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">What payment options are available for enrollment?</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Students can choose between a one-time discounted fee or a 3-month equal installment plan. Payments are accepted via EasyPaisa, JazzCash, or Bank Transfer, verified manually by our admin team.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Will I get an official completion certificate?</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Yes! Upon completing 100% of the video lectures and quizzes in a course, a verified digital Certificate of Completion is issued to your student dashboard.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 pt-16 pb-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <img src="/logo.png" alt="Logo" className="h-16 mb-6 logo-outline" loading="lazy" decoding="async" />
              <p className="text-gray-500 max-w-sm leading-relaxed font-medium">
                Helping Class 9 Sindh Board students achieve top results through concept-based digital learning. Join Parhlo Pakistan and study smarter from home.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs">Quick Links</h4>
              <ul className="space-y-3 text-gray-500 text-sm font-semibold">
                <li><Link href="/courses" className="hover:text-green-600 transition-colors">Browse Subjects</Link></li>
                <li><Link href="/about" className="hover:text-green-600 transition-colors">About Us</Link></li>
                <li><Link href="/privacy" className="hover:text-green-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-green-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-green-600 transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs">Support</h4>
              <p className="text-gray-500 text-sm font-semibold mb-2">Need help? Contact us:</p>
              <a href="mailto:parhlo.pakistan.edu@gmail.com" className="text-gray-600 hover:text-green-600 text-sm font-semibold mb-2 block">parhlo.pakistan.edu@gmail.com</a>
              <a href="https://wa.me/923302882822" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-green-600 text-sm font-semibold block">📱 WhatsApp: 0330 2882822</a>
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
    </div>
  );
}