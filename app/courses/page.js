"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthModal from '@/app/components/AuthModal';
import { 
  PlayCircle, 
  Star, 
  Search,
  Filter,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { getDeterministicRating } from '@/utils/courseHelpers';
import { formatCurrency, parsePrice } from '@/utils/currencyHelpers';
import { supabase } from '@/utils/supabase';

export default function AllCourses() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const [courses, setCourses] = useState([]);
  const [coursesError, setCoursesError] = useState(null);

  const parseStudentCount = (value) => {
    if (value === undefined || value === null) return 0;
    const str = String(value).trim().toLowerCase();
    const match = str.match(/^([0-9,.]+)([km]?)$/);
    if (!match) {
      return parseFloat(str.replace(/,/g, '')) || 0;
    }
    const amount = parseFloat(match[1].replace(/,/g, '')) || 0;
    const suffix = match[2];
    if (suffix === 'k') return amount * 1000;
    if (suffix === 'm') return amount * 1000000;
    return amount;
  };

  const shouldShowRating = (rating) => {
    const parsed = parseFloat(String(rating).replace(/,/g, '.'));
    return !Number.isNaN(parsed) && parsed >= 2;
  };

  const shouldShowStudents = (students) => {
    return parseStudentCount(students) >= 5;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isAdmin = window.localStorage.getItem('parhloAdmin') === 'true';
    const storedRole = window.localStorage.getItem('parhloRole');
    const email = window.localStorage.getItem('currentUserEmail');
    if (isAdmin || storedRole === 'admin') setUserRole('admin');
    else if (storedRole === 'teacher') setUserRole('teacher');
    else if (email) setUserRole('student');

    fetchAllCourses();
  }, []);

  const fetchAllCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      setCoursesError(error.message || JSON.stringify(error));
      setCourses([]);
    } else if (data) {
      setCoursesError(null);
      const persistedCourses = data.map((course) => {
        const studentsCount = parseInt(course.students) || 0;
        const originalPrice = parsePrice(course.price);
        const discountPercent = parseFloat(String(course.discount || '').replace(/[^0-9.]/g, '')) || 0;
        const salePrice = discountPercent > 0 ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice;
        
        return {
          title: course.name,
          price: originalPrice,
          salePrice: salePrice,
          discount: discountPercent > 0 ? discountPercent : 0,
          students: studentsCount >= 5 ? String(studentsCount) : null,
          rating: getDeterministicRating(course.slug),
          tag: course.tag || 'New',
          slug: course.slug,
          thumbnail: course.thumbnail,
          instructorImage: course.instructorImage,
          imageClass: 'from-slate-900 via-slate-700 to-green-600',
          description: course.category ? `${course.category} course` : 'New course content available now.',
        };
      });
      setCourses(persistedCourses);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-green-100">
      <nav className="border-b border-gray-100 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-50 p-4">
        <div className="flex items-center gap-2">
          <button 
            className="md:hidden text-gray-900 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          <Link href="/" className="pl-2 md:pl-8">
            <img src="/logo.png" alt="Parhlo Pakistan Logo" className="h-10 md:h-20 w-auto object-contain cursor-pointer logo-outline" />
          </Link>
        </div>
        <div className="hidden md:flex gap-10 text-sm font-bold text-gray-600">
          <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
          <Link href="/courses" className="text-green-600 transition-colors cursor-pointer">Subjects</Link>
          <Link href="/about" className="hover:text-green-600 transition-colors">About</Link>
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
              onClick={() => setShowAuthModal(true)}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-green-600 transition-all shadow-lg mr-4"
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
                onClick={() => { setIsMobileMenuOpen(false); setShowAuthModal(true); }}
                className="w-full bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all"
              >
                Join Now
              </button>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="mb-16">
          <h2 className="text-5xl font-black tracking-tight text-gray-900 mb-4">Available Subjects</h2>
          <p className="text-gray-500 font-medium max-w-xl">Explore our Sindh Board courses designed for clear concept building, strong exam preparation, and better academic performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
          {coursesError ? (
            <div className="col-span-full rounded-[3rem] border border-red-200 bg-red-50 p-16 text-center text-red-500">
              Error fetching courses: {coursesError}
            </div>
          ) : loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-200"></div>
                <div className="p-10 pt-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
                  <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-10 bg-gray-200 rounded-2xl w-1/3"></div>
                  </div>
                </div>
              </div>
            ))
          ) : courses.length > 0 ? courses.map((course, i) => {
            const meta = [];
            if (course.rating) meta.push(course.rating);
            if (course.students) meta.push(`${course.students} Students`);
            return (
              <div key={i} className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className={`h-56 overflow-hidden relative bg-gradient-to-br ${course.imageClass}`}>
                  {course.thumbnail && (
                    <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                  )}
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute top-6 left-6 z-10">
                    <span className="bg-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-gray-900 shadow-sm">{course.tag}</span>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <h3 className="text-2xl font-black text-white leading-tight">{course.title}</h3>
                  </div>
                </div>
                <div className="p-10 pt-6 relative">
                  {course.instructorImage && (
                    <div className="absolute -top-6 right-8 w-12 h-12 rounded-full border-4 border-white shadow-md overflow-hidden bg-white z-20">
                      <img src={course.instructorImage} alt="Instructor" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                  )}
                  {meta.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Star size={16} className="text-yellow-400" fill="currentColor" />
                      <span className="text-xs font-bold text-gray-400">{meta.join(' • ')}</span>
                    </div>
                  )}
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
                        View Subject
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full rounded-[3rem] border border-gray-200 bg-white p-16 text-center text-gray-500">
              No subjects are currently available. Admin-managed subjects will appear here.
            </div>
          )}
        </div>
      </main>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      <footer className="bg-white border-t border-gray-200 pt-16 pb-10 mt-20">
        <div className="max-w-6xl mx-auto px-8 text-center">
           <img src="/logo.png" alt="Logo" className="h-16 mb-6 mx-auto logo-outline" loading="lazy" decoding="async" />
           
           <div className="flex flex-wrap justify-center items-center gap-6 mb-6 text-sm font-semibold text-gray-500">
             <Link href="/about" className="hover:text-green-600 transition-colors">About Us</Link>
             <Link href="/privacy" className="hover:text-green-600 transition-colors">Privacy Policy</Link>
             <Link href="/terms" className="hover:text-green-600 transition-colors">Terms of Service</Link>
             <Link href="/contact" className="hover:text-green-600 transition-colors">Contact Us</Link>
           </div>

           <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Designed & Developed by</p>
            <a href="https://mockup.media" target="_blank" rel="noopener noreferrer" className="inline-block text-gray-400 hover:text-green-600 transition-all font-light text-base mb-6">
              Mockup Media (SMC-Private) Limited
            </a>
            <p className="text-black text-[10px] font-bold">© 2026 Parhlo Pakistan. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
