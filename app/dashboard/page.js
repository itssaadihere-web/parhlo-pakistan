"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  PlayCircle, 
  Award, 
  Settings, 
  LogOut, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import InactivityTracker from '@/app/components/InactivityTracker';

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [studentName, setStudentName] = useState('Student');
  const [totalStudyHours, setTotalStudyHours] = useState('0');
  const [userEmail, setUserEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [intro, setIntro] = useState('');
  const [image, setImage] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initDashboard = async () => {
      let email = (window.localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();
      const isAdmin = window.localStorage.getItem('parhloAdmin') === 'true';

      if (isAdmin) {
        router.replace('/admin');
        return;
      }

      // Check Supabase session for Google Login
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && session.user.email) {
          email = session.user.email.trim().toLowerCase();
          window.localStorage.setItem('currentUserEmail', email);
          
          if (email === "parhlo.pakistan.edu@gmail.com") {
            window.localStorage.setItem('parhloAdmin', 'true');
            router.replace('/admin');
            return;
          } else {
            window.localStorage.setItem('parhloAdmin', 'false');
          }
        }
      } catch (err) {
        console.error(err);
      }

      if (!email) {
        router.replace('/');
        return;
      }
      
      setUserEmail(email);
      setStudentName(email.split('@')[0]);
      
      // Fetch user profile from users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
      if (userProfile) {
        if (userProfile.role === 'teacher') {
          window.localStorage.setItem('parhloRole', 'teacher');
          router.replace('/teacher');
          return;
        }
        if (userProfile.role === 'admin' || email === "parhlo.pakistan.edu@gmail.com") {
          window.localStorage.setItem('parhloRole', 'admin');
          window.localStorage.setItem('parhloAdmin', 'true');
          router.replace('/admin');
          return;
        }
        setStudentName(userProfile.full_name || email.split('@')[0]);
        setPhoneNumber(userProfile.phone || '');
        setIntro(userProfile.intro || '');
        setImage(userProfile.image || '');
      } else if (!profileError || profileError.code === 'PGRST116') {
        // User doesn't exist in users table (maybe Google login), let's create a stub
        await supabase.from('users').insert([{ email, full_name: email.split('@')[0], role: 'student' }]);
      }

      // Fetch all purchases for this user from Supabase using case-insensitive ilike
      let purchasesList = [];
      try {
        const { data: userPurchases } = await supabase
          .from('purchases')
          .select('*')
          .ilike('student_email', email.trim());
        if (userPurchases && userPurchases.length > 0) {
          purchasesList = userPurchases;
        }
      } catch (e) {
        console.warn('DB purchases fetch warning:', e);
      }

      // Local storage fallback for purchases
      if (typeof window !== 'undefined') {
        try {
          const localP = JSON.parse(window.localStorage.getItem('parhlo_purchases') || '[]');
          const matched = localP.filter(p => (p.student_email || '').trim().toLowerCase() === email.trim().toLowerCase());
          matched.forEach(mp => {
            if (!purchasesList.some(p => p.id === mp.id || p.course_slug === mp.course_slug)) {
              purchasesList.push(mp);
            }
          });
        } catch (e) {}
      }

      // Check if student has any sales offers issued by sales rep (e.g. free_month_trial, added_discount)
      try {
        const { data: dbOffers } = await supabase
          .from('sales_offers')
          .select('*')
          .ilike('student_email', email.trim());
        
        let activeOffers = dbOffers || [];
        if (activeOffers.length === 0 && typeof window !== 'undefined') {
          const local = JSON.parse(window.localStorage.getItem('parhlo_sales_offers') || '[]');
          activeOffers = local.filter(o => (o.student_email || '').trim().toLowerCase() === email.trim().toLowerCase());
        }

        for (const offer of activeOffers) {
          const hasPurchase = purchasesList.some(p => (p.course_slug || '').trim().toLowerCase() === (offer.course_slug || '').trim().toLowerCase());
          if (!hasPurchase) {
            const offerCreated = new Date(offer.created_at || Date.now());
            const nextDueDate = new Date(offerCreated.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
            const autoPurchase = {
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'purchase_' + Date.now(),
              student_email: email.trim().toLowerCase(),
              course_slug: offer.course_slug,
              status: 'approved',
              payment_plan: offer.offer_type === 'free_month_trial' ? 'free_trial' : 'installment',
              amount_paid: 0,
              total_price: offer.custom_total_price || 0,
              monthly_installment_amount: offer.custom_installment_amount || 0,
              offer_id: offer.id,
              next_due_date: nextDueDate,
              created_at: offerCreated.toISOString()
            };

            try {
              await supabase.from('purchases').insert([autoPurchase]);
            } catch (e) {
              console.warn('DB auto purchase insert warning:', e);
            }
            purchasesList.push(autoPurchase);
          }
        }
      } catch (err) {
        console.error('Error auto-syncing sales offers:', err);
      }

      // Map pending payments
      const pending = purchasesList
        .filter(p => p.status === 'pending')
        .map(p => ({
          id: p.id,
          courseName: p.course_slug,
          transactionId: 'N/A',
          date: new Date(p.created_at).toLocaleDateString(),
          status: 'pending'
        }));
      setPendingPayments(pending);

      // Fetch all courses to match with approved purchases
      const DEFAULT_COURSES = [
        { id: 'mathematics-smart-pro', name: 'Mathematics Smart Pro (Class 9)', slug: 'mathematics-smart-pro', category: 'Mathematics', price: 'Rs. 9,999' },
        { id: 'mathematics-smart-lite', name: 'Mathematics Smart Lite (Class 9)', slug: 'mathematics-smart-lite', category: 'Mathematics', price: 'Rs. 7,140' },
        { id: 'biology-smart-pro', name: 'Biology Smart Pro (Class 9)', slug: 'biology-smart-pro', category: 'Biology', price: 'Rs. 9,999' },
        { id: 'chemistry-smart-pro', name: 'Chemistry Smart Pro (Class 9)', slug: 'chemistry-smart-pro', category: 'Chemistry', price: 'Rs. 9,999' },
        { id: 'physics-smart-pro', name: 'Physics Smart Pro (Class 9)', slug: 'physics-smart-pro', category: 'Physics', price: 'Rs. 9,999' },
        { id: 'computer-science-smart-pro-class-9', name: 'Computer Science Smart Pro (Class 9)', slug: 'computer-science-smart-pro-class-9', category: 'Computer Science', price: 'Rs. 7,499' },
        { id: 'english-smart-pro', name: 'English Smart Pro (Class 9)', slug: 'english-smart-pro', category: 'English', price: 'Rs. 7,499' }
      ];

      const { data: dbCourses } = await supabase.from('courses').select('*');
      const adminCourses = dbCourses && dbCourses.length > 0 ? dbCourses : DEFAULT_COURSES;

      const uniqueApprovedMap = new Map();
      purchasesList.forEach(p => {
        const isApp = (p.status || '').toLowerCase() === 'approved' || (p.status || '').toLowerCase() === 'active' || p.payment_plan === 'free_trial';
        if (isApp && p.course_slug) {
          const slugKey = p.course_slug.trim().toLowerCase();
          if (!uniqueApprovedMap.has(slugKey)) {
            uniqueApprovedMap.set(slugKey, p);
          }
        }
      });
      const approved = Array.from(uniqueApprovedMap.values());
      let totalStudySecondsAll = 0;

      const activeCourses = approved.map(purchase => {
        const course = adminCourses.find(c => 
          (c.slug || '').trim().toLowerCase() === (purchase.course_slug || '').trim().toLowerCase()
        ) || DEFAULT_COURSES.find(c => 
          (c.slug || '').trim().toLowerCase() === (purchase.course_slug || '').trim().toLowerCase()
        ) || {
          id: purchase.course_slug,
          name: (purchase.course_slug || 'Course').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          slug: purchase.course_slug,
          category: 'Class 9',
          price: 'Rs. 9,999'
        };
            
            // Read watched time per lecture from localStorage
            const key = `parhlo_watch_${email}_${course.slug}`;
            let progressData = {};
            try {
              progressData = JSON.parse(window.localStorage.getItem(key) || '{}');
              if (typeof progressData !== 'object' || progressData === null) progressData = {};
            } catch (e) {
              progressData = {};
            }
            
            let watchedSeconds = 0;
            let completedLectures = 0;
            const totalLectures = course.lectures?.length || 1;

            Object.keys(progressData).forEach(lecId => {
               watchedSeconds += progressData[lecId];
               if (progressData[lecId] >= 30) {
                 completedLectures += 1;
               }
            });

            totalStudySecondsAll += watchedSeconds;
            completedLectures = Math.min(totalLectures, completedLectures);

            let estimatedTotalSeconds = 0;
            if (course.lectures && course.lectures.length > 0) {
              course.lectures.forEach(l => {
                let max = 900;
                if (l.duration && l.duration.includes('min')) max = (parseInt(l.duration) || 15) * 60;
                estimatedTotalSeconds += max;
              });
            } else {
              estimatedTotalSeconds = totalLectures * 10 * 60;
            }

            const progressPct = Math.min(100, Math.floor((watchedSeconds / estimatedTotalSeconds) * 100));

            // Calculate weekly watched seconds
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
            const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
            const currentWeekId = `${now.getFullYear()}_W${weekNum}`;

            const weekKey = `parhlo_weekly_${email}_${course.slug}`;
            let weeklyWatchedSec = 0;
            try {
              const weeklyMap = JSON.parse(window.localStorage.getItem(weekKey) || '{}');
              weeklyWatchedSec = Number(weeklyMap[currentWeekId]) || 0;
            } catch (e) {}

            const weeklyLimitSeconds = Math.round(estimatedTotalSeconds / 12);
            const oneMonthFreeLimitSeconds = Math.round(estimatedTotalSeconds / 3);

            const isFreeTrial = purchase.payment_plan === 'free_trial';
            const rawPrice = parsePrice(course.price);
            const totalCoursePrice = purchase.total_price || rawPrice;
            const monthlyInst = purchase.monthly_installment_amount || Math.round(totalCoursePrice / 3);
            const amountPaid = purchase.amount_paid || 0;
            const remainingReceivable = isFreeTrial ? totalCoursePrice : Math.max(0, totalCoursePrice - amountPaid);

            return {
              id: purchase.id,
              title: course.name,
              slug: course.slug,
              category: course.category || 'Course',
              progress: progressPct,
              totalLectures: totalLectures,
              completedLectures: completedLectures,
              watchedSeconds: watchedSeconds,
              watchedHours: (watchedSeconds / 3600).toFixed(1),
              weeklyWatchedSec: weeklyWatchedSec,
              weeklyLimitSeconds: weeklyLimitSeconds,
              oneMonthFreeLimitSeconds: oneMonthFreeLimitSeconds,
              paymentPlan: purchase.payment_plan || 'full',
              isFreeTrial: isFreeTrial,
              totalCoursePrice: totalCoursePrice,
              monthlyInstallment: monthlyInst,
              amountPaid: amountPaid,
              remainingReceivable: remainingReceivable,
              nextDueDate: purchase.next_due_date ? new Date(purchase.next_due_date).toLocaleDateString() : null,
              imageClass: 'from-slate-900 via-slate-700 to-green-600'
            };
          }).filter(Boolean);

          setEnrolledCourses(activeCourses);
          setTotalStudyHours((totalStudySecondsAll / 3600).toFixed(1));
      };

    initDashboard();

    window.addEventListener('focus', initDashboard);
    window.addEventListener('storage', initDashboard);
    return () => {
      window.removeEventListener('focus', initDashboard);
      window.removeEventListener('storage', initDashboard);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('parhloAdmin');
      window.localStorage.removeItem('parhloRole');
      window.localStorage.removeItem('currentUserEmail');
      window.location.href = '/';
    }
  };

  const menuItems = [
    { name: 'Overview', icon: <BookOpen size={20} />, id: 'overview' },
    { name: 'My Subjects', icon: <PlayCircle size={20} />, id: 'courses' },
    { name: 'Settings', icon: <Settings size={20} />, id: 'settings' }
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <InactivityTracker onLogout={handleLogout} timeoutMs={15 * 60 * 1000} />
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-gray-50">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="h-10 cursor-pointer logo-outline" />
          </Link>
        </div>
        
        <div className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black text-xl uppercase">
            {studentName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">Welcome back,</p>
            <p className="text-xs text-gray-500 font-medium truncate max-w-[120px]">{studentName}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === item.id 
                ? 'bg-green-50 text-green-700' 
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {item.icon} {item.name}
            </button>
          ))}
        </nav>
        <button 
          onClick={handleLogout} 
          className="m-6 flex items-center gap-3 px-4 py-3 text-gray-500 font-bold text-sm hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-500 hover:text-gray-900"><Menu size={24}/></button>
            <img src="/logo.png" alt="Logo" className="h-10 md:h-10 logo-outline" />
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-600"><LogOut size={20}/></button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] flex">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full relative z-10 shadow-2xl transition-transform">
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"
              >
                <X size={24} />
              </button>
              <div className="p-6 flex items-center gap-3 border-b border-gray-50">
                <Link href="/">
                  <img src="/logo.png" alt="Logo" className="h-10 cursor-pointer logo-outline" />
                </Link>
              </div>
              
              <div className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black text-xl uppercase">
                  {studentName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">Welcome back,</p>
                  <p className="text-xs text-gray-500 font-medium truncate max-w-[120px]">{studentName}</p>
                </div>
              </div>

              <nav className="flex-1 px-4 space-y-2 mt-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      activeTab === item.id 
                      ? 'bg-green-50 text-green-700' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon} {item.name}
                  </button>
                ))}
              </nav>
              <button 
                onClick={handleLogout} 
                className="m-6 flex items-center gap-3 px-4 py-3 text-gray-500 font-bold text-sm hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
              >
                <LogOut size={20} /> Sign Out
              </button>
            </aside>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            <header className="mb-10">
              <h1 className="text-3xl font-black text-slate-900 mb-2">My Dashboard</h1>
              <p className="text-gray-500 font-medium">Track your learning progress and manage your enrollments.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
              {[
                { label: 'Active Subjects', val: enrolledCourses.length, color: 'bg-blue-50 text-blue-600' },
                { label: 'Pending Approvals', val: pendingPayments.length, color: 'bg-amber-50 text-amber-600' },
                { label: 'Study Hours Watched', val: `${totalStudyHours} hrs`, color: 'bg-purple-50 text-purple-600' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center gap-4">
                  <div className={`p-4 rounded-2xl ${stat.color}`}>
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Receivables & Free Access Status Summary */}
            {enrolledCourses.length > 0 && (
              <div className="mb-10 bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-[2.5rem] p-8 shadow-xl border border-emerald-500/30">
                <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                  <Award size={24} className="text-emerald-400" />
                  Receivable & Plan Summary
                </h2>
                <p className="text-xs text-slate-300 mb-6">Overview of your enrolled subject payment plans, remaining receivables, and watch limits.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledCourses.map(c => {
                    const isWeeklyQuotaReached = c.paymentPlan !== 'full' && c.weeklyWatchedSec >= c.weeklyLimitSeconds;
                    const isMonthlyFreeTrialEnded = c.isFreeTrial && c.watchedSeconds >= c.oneMonthFreeLimitSeconds;
                    const isLocked = isWeeklyQuotaReached || isMonthlyFreeTrialEnded;

                    return (
                      <div key={c.slug} className="bg-slate-900/90 border border-slate-700/80 p-5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-bold text-white block">{c.title}</span>
                            <span className="text-[11px] text-emerald-400 font-mono capitalize font-bold">
                              {c.isFreeTrial ? '1-Month Free Access (0 PKR Initial)' : `${c.paymentPlan} Plan`}
                            </span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isLocked ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {c.paymentPlan === 'full' ? 'Full Access' : isMonthlyFreeTrialEnded ? 'Month 1 Trial Ended' : isWeeklyQuotaReached ? 'Weekly Quota Met' : 'Active'}
                          </span>
                        </div>

                        {c.paymentPlan !== 'full' && (
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                            <div className="flex justify-between text-slate-300">
                              <span>Weekly Pace Quota (1/12th):</span>
                              <span className="font-mono text-emerald-400">
                                {Math.round(c.weeklyWatchedSec / 60)}m / {Math.round(c.weeklyLimitSeconds / 60)}m this week
                              </span>
                            </div>

                            {c.isFreeTrial && (
                              <>
                                <div className="flex justify-between text-slate-300">
                                  <span>1-Month Free Quota (1/3rd):</span>
                                  <span className="font-mono text-amber-400">
                                    {Math.round(c.watchedSeconds / 60)}m / {Math.round(c.oneMonthFreeLimitSeconds / 60)}m quota
                                  </span>
                                </div>
                                <div className="flex justify-between text-slate-300 text-[11px] pt-1 border-t border-slate-800">
                                  <span>Next Due (1st + 2nd Inst.):</span>
                                  <span className="font-bold text-amber-300">Rs. {(c.monthlyInstallment * 2).toLocaleString()}</span>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-400">Total Watched: <strong className="text-white">{c.watchedHours} hrs</strong></span>
                          <Link href={`/courses/${c.slug}`}>
                            <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition-colors">
                              {isMonthlyFreeTrialEnded ? 'Pay to Unlock' : isWeeklyQuotaReached ? 'Weekly Limit Reached' : 'Study Now'}
                            </button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pendingPayments.length > 0 && (
              <div className="mb-10 bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8">
                <h2 className="text-xl font-black text-amber-900 mb-4 flex items-center gap-2">
                  <AlertCircle size={24} /> Pending Approvals
                </h2>
                <div className="space-y-4">
                  {pendingPayments.map(payment => (
                    <div key={payment.id} className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-bold text-gray-900">{payment.courseName}</p>
                        <p className="text-xs text-gray-500">TID: {payment.transactionId} • Submitted on {payment.date}</p>
                      </div>
                      <span className="text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full">Pending</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enrolledCourses.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-black text-slate-900 mb-6">Continue Learning</h2>
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 flex flex-col md:flex-row gap-8 items-center shadow-sm">
                  <div className={`w-full md:w-64 h-40 rounded-3xl bg-gradient-to-br ${enrolledCourses[0].imageClass || 'from-slate-900 to-green-600'} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                    {enrolledCourses[0].thumbnail && (
                      <img src={enrolledCourses[0].thumbnail} alt={enrolledCourses[0].title} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/30" />
                    <PlayCircle size={48} className="text-white opacity-50 relative z-10" />
                  </div>
                  <div className="flex-1 w-full">
                    <span className="text-[10px] uppercase font-black text-green-600 tracking-widest">{enrolledCourses[0].category}</span>
                    <h3 className="text-2xl font-black text-gray-900 mt-2 mb-4">{enrolledCourses[0].title}</h3>
                    
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-gray-500">Progress</span>
                      <span className="text-sm font-black text-green-600">{enrolledCourses[0].progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden">
                      <div className="bg-green-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${enrolledCourses[0].progress}%` }}></div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Link href={`/courses/${enrolledCourses[0].slug}`}>
                        <button className="bg-gray-900 text-white px-8 py-3 rounded-full font-black text-sm hover:bg-green-600 transition-all">
                          Resume Subject
                        </button>
                      </Link>
                      <span className="text-xs font-bold text-gray-400 flex items-center gap-2">
                        <Clock size={14}/> {enrolledCourses[0].completedLectures} / {enrolledCourses[0].totalLectures} Lectures
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'courses' && (
          <>
            <header className="mb-10">
              <h1 className="text-3xl font-black text-slate-900 mb-2">My Subjects</h1>
              <p className="text-gray-500 font-medium">All the subjects you are currently enrolled in with full access.</p>
            </header>

            {enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {enrolledCourses.map((course, i) => (
                  <div key={i} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className={`h-48 bg-gradient-to-br ${course.imageClass || 'from-slate-900 to-green-600'} flex items-center justify-center relative overflow-hidden`}>
                       {course.thumbnail && (
                         <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                       )}
                       <div className="absolute inset-0 bg-black/30" />
                       <PlayCircle size={48} className="text-white opacity-40 group-hover:scale-110 transition-transform relative z-10" />
                    </div>
                    <div className="p-8">
                      <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{course.category}</span>
                      <h3 className="text-xl font-black text-gray-900 mt-2 mb-6 h-14 line-clamp-2">{course.title}</h3>
                      
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold text-gray-400">{course.completedLectures}/{course.totalLectures} Lectures</span>
                        <span className="text-xs font-black text-green-600">{course.progress}%</span>
                      </div>

                      <Link href={`/courses/${course.slug}`}>
                        <button className="w-full bg-gray-50 text-gray-900 py-3 rounded-xl font-black text-sm hover:bg-green-600 hover:text-white transition-all">
                          Continue Learning
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen size={32} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No subjects yet</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">You don't have any approved subjects. Browse our catalog to start your learning journey.</p>
                <Link href="/courses">
                  <button className="bg-green-600 text-white px-8 py-4 rounded-full font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">
                    Browse Catalog
                  </button>
                </Link>
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm max-w-2xl">
            <h3 className="text-2xl font-black text-gray-900 mb-8">Account Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <input type="email" value={userEmail} disabled className="w-full bg-gray-100 border border-gray-200 p-4 rounded-xl outline-none text-gray-400 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number (WhatsApp)</label>
                <input 
                  type="text" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="Enter your WhatsApp number"
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Intro/Bio</label>
                <textarea 
                  value={intro} 
                  onChange={(e) => setIntro(e.target.value)} 
                  placeholder="Tell us a little about yourself"
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Profile Image URL</label>
                <input 
                  type="text" 
                  value={image} 
                  onChange={(e) => setImage(e.target.value)} 
                  placeholder="https://example.com/my-pic.jpg"
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium" 
                />
              </div>
              <button 
                onClick={async () => {
                  const { error } = await supabase
                    .from('users')
                    .update({ full_name: studentName, phone: phoneNumber, intro: intro, image: image })
                    .eq('email', userEmail);
                    
                  if (error) {
                    alert("Error updating profile.");
                  } else {
                    alert("Profile settings saved successfully!");
                  }
                }}
                className="bg-gray-900 text-white px-8 py-4 rounded-full font-black text-sm hover:bg-green-600 transition-all mt-4 w-fit"
              >
                Save Profile Details
              </button>
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-lg font-bold text-gray-900 mb-6">Change Password</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium" 
                    />
                  </div>

                  {passwordMessage && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${passwordMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {passwordMessage}
                    </div>
                  )}

                  <button 
                    onClick={async () => {
                      if (!newPassword) {
                        setPasswordMessage("Password cannot be empty.");
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        setPasswordMessage("Passwords do not match.");
                        return;
                      }
                      
                      const { error } = await supabase
                        .from('users')
                        .update({ password: newPassword })
                        .eq('email', userEmail);
                        
                      if (error) {
                        setPasswordMessage("Error updating password.");
                      } else {
                        setPasswordMessage("Password successfully updated!");
                        setNewPassword('');
                        setConfirmPassword('');
                        setTimeout(() => setPasswordMessage(''), 3000);
                      }
                    }}
                    className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black text-sm hover:bg-green-600 transition-all mt-4 w-full md:w-auto"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
