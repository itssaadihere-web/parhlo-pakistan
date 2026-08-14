"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ShareModal from '@/app/components/ShareModal';
import AuthModal from '@/app/components/AuthModal';
import {
  PlayCircle,
  Lock,
  ChevronLeft,
  Clock,
  BarChart,
  User,
  CheckCircle2,
  Share2,
  X,
  CreditCard,
  Upload,
  Star,
  Users
} from 'lucide-react';

import { supabase } from '@/utils/supabase';
import { getDeterministicRating } from '@/utils/courseHelpers';
import { formatCurrency, parsePrice } from '@/utils/currencyHelpers';

const parsePriceValue = (value) => {
  return parsePrice(value);
};

export default function DynamicCourseDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals & User State
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Payment Form State
  const [transactionId, setTransactionId] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('full');
  const fileInputRef = React.useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Access Control State
  const [userEmail, setUserEmail] = useState('');
  const [dashboardUrl, setDashboardUrl] = useState('/dashboard');
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'pending' | 'approved' | 'suspended'
  const [purchaseRecord, setPurchaseRecord] = useState(null);
  const [isInstallmentDue, setIsInstallmentDue] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);
  
  // Video Player State
  const [previewLecture, setPreviewLecture] = useState(null);
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false);
  const [showAllLectures, setShowAllLectures] = useState(false);

  const previewItem = previewLecture !== null ? courseData?.curriculum?.[previewLecture] : null;
  const previewUrl = previewItem?.videoId
    ? `https://www.youtube-nocookie.com/embed/${previewItem.videoId}?autoplay=1&rel=0&modestbranding=1&controls=0&showinfo=0&iv_load_policy=3&disablekb=1&playsinline=1&playlist=${previewItem.videoId}`
    : null;

  const checkUserAccess = async () => {
    if (typeof window !== 'undefined') {
      const email = window.localStorage.getItem('currentUserEmail');
      const isAdmin = window.localStorage.getItem('parhloAdmin') === 'true';
      const storedRole = window.localStorage.getItem('parhloRole');
      setUserEmail(email || '');
      
      if (isAdmin || storedRole === 'admin') {
        setDashboardUrl('/admin');
      } else if (storedRole === 'teacher') {
        setDashboardUrl('/teacher');
      } else {
        setDashboardUrl('/dashboard');
      }
      
      if (isAdmin) {
        setPaymentStatus('approved');
        return;
      }

      const cleanEmail = (email || window.localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();
      if (cleanEmail && slug) {
        // Fetch purchase status from Supabase using ilike without .single() crash
        const { data: purchases, error } = await supabase
          .from('purchases')
          .select('*')
          .ilike('student_email', cleanEmail)
          .eq('course_slug', slug);

        let purchasesList = purchases && purchases.length > 0 ? [...purchases] : [];

        if (typeof window !== 'undefined') {
          try {
            const localP = JSON.parse(window.localStorage.getItem('parhlo_purchases') || '[]');
            const matched = localP.filter(p => 
              (p.student_email || '').trim().toLowerCase() === cleanEmail &&
              (p.course_slug || '').trim().toLowerCase() === (slug || '').trim().toLowerCase()
            );
            matched.forEach(mp => {
              if (!purchasesList.some(p => p.id === mp.id)) {
                purchasesList.push(mp);
              }
            });
          } catch (e) {}
        }

        const purchase = purchasesList.length > 0 
          ? (purchasesList.find(p => (p.status || '').toLowerCase() === 'approved' || (p.status || '').toLowerCase() === 'active') || purchasesList[0])
          : null;

        if (purchase) {
          setPurchaseRecord(purchase);
          
          let isDue = false;
          if (purchase.payment_plan === 'installment' && purchase.status === 'approved' && purchase.next_due_date) {
            const dueDate = new Date(purchase.next_due_date);
            if (dueDate < new Date()) {
              isDue = true;
            }
          }

          setIsInstallmentDue(isDue);
          setPaymentStatus(isDue ? 'suspended' : purchase.status);
        } else {
          setPaymentStatus(null);
          setPurchaseRecord(null);
          setIsInstallmentDue(false);
        }

        // Fetch active/redeemed sales offer for this student & course
        let foundOffer = null;
        try {
          const { data: dbOffers } = await supabase
            .from('sales_offers')
            .select('*')
            .ilike('student_email', cleanEmail)
            .eq('course_slug', slug);
          if (dbOffers && dbOffers.length > 0) foundOffer = dbOffers[0];
        } catch (e) {}

        if (!foundOffer) {
          try {
            const localOffers = JSON.parse(window.localStorage.getItem('parhlo_sales_offers') || '[]');
            foundOffer = localOffers.find(o => 
              o.student_email?.toLowerCase() === email.toLowerCase() && 
              o.course_slug === slug && 
              o.status === 'active'
            );
          } catch (e) {}
        }
        setActiveOffer(foundOffer || null);

        // Fetch user profile to pre-fill payment modal
        const { data: userProfile } = await supabase.from('users').select('full_name, phone').eq('email', email).single();
        if (userProfile) {
          setProfileName(userProfile.full_name && userProfile.full_name !== email.split('@')[0] ? userProfile.full_name : '');
          setProfilePhone(userProfile.phone || '');
        }

        // Fetch & sync user video progress with Supabase
        try {
          const { data: dbProgress } = await supabase
            .from('user_video_progress')
            .select('*')
            .ilike('student_email', cleanEmail)
            .eq('course_slug', slug);

          const keyTotal = `parhlo_watch_${cleanEmail}_${slug}`;
          let localProgress = {};
          try {
            localProgress = JSON.parse(window.localStorage.getItem(keyTotal) || '{}');
            if (typeof localProgress !== 'object' || localProgress === null) localProgress = {};
          } catch (e) {}

          const dbMap = {};
          if (dbProgress && dbProgress.length > 0) {
            dbProgress.forEach(row => {
              dbMap[String(row.lecture_id)] = Number(row.watched_seconds) || 0;
            });
          }

          // 1. Migrate local history to Supabase if local has higher or unsaved seconds
          const upsertRows = [];
          Object.keys(localProgress).forEach(lecId => {
            const localSec = Number(localProgress[lecId]) || 0;
            const dbSec = dbMap[lecId] || 0;
            if (localSec > dbSec) {
              upsertRows.push({
                student_email: cleanEmail,
                course_slug: slug,
                lecture_id: lecId,
                watched_seconds: localSec,
                last_watched_at: new Date().toISOString()
              });
              dbMap[lecId] = localSec;
            }
          });

          if (upsertRows.length > 0) {
            await supabase.from('user_video_progress').upsert(upsertRows, { onConflict: 'student_email,course_slug,lecture_id' });
          }

          // 2. Sync Supabase data into local storage if Supabase has data local device doesn't have
          let updatedLocal = false;
          Object.keys(dbMap).forEach(lecId => {
            if ((localProgress[lecId] || 0) < dbMap[lecId]) {
              localProgress[lecId] = dbMap[lecId];
              updatedLocal = true;
            }
          });
          if (updatedLocal) {
            window.localStorage.setItem(keyTotal, JSON.stringify(localProgress));
          }
        } catch (e) {
          console.warn('Video progress sync error:', e);
        }
      }
    }
  };

  useEffect(() => {
    checkUserAccess();
    
    // Add event listener to re-check when storage changes (e.g. from AuthModal)
    window.addEventListener('storage', checkUserAccess);
    return () => window.removeEventListener('storage', checkUserAccess);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const fetchCourseDetail = async () => {
      setLoading(true);
      const { data: adminCourse, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !adminCourse) {
        console.error('Error fetching course detail:', error);
        setCourseData(null);
      } else {
        const originalPrice = parsePriceValue(adminCourse.price);
        const discountPercent = parseFloat(String(adminCourse.discount || '').replace(/[^0-9.]/g, '')) || 0;
        const salePriceValue = discountPercent > 0 ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice;
        const savings = discountPercent > 0 ? originalPrice - salePriceValue : 0;
        const studentsCount = parseInt(adminCourse.students) || 0;

        setCourseData({
          title: adminCourse.name || 'New Course',
          slug: adminCourse.slug,
          category: adminCourse.category || 'New Course',
          price: adminCourse.price || '0',
          originalPrice: formatCurrency(originalPrice),
          salePrice: formatCurrency(salePriceValue),
          rawOriginalPrice: originalPrice,
          rawSalePrice: salePriceValue,
          discount: discountPercent > 0 ? discountPercent : 0,
          savings: savings > 0 ? formatCurrency(savings) : null,
          students: studentsCount >= 5 ? String(studentsCount) : null,
          rating: getDeterministicRating(adminCourse.slug),
          instructor: adminCourse.instructor || 'Admin Instructor',
          instructorImage: adminCourse.instructorImage,
          instructorIntro: adminCourse.instructorIntro || `Learn ${adminCourse.name} with practical video lectures and real examples.`,
          level: adminCourse.level || 'All Levels',
          duration: `${adminCourse.lectures?.length || 0} Lectures`,
          description: adminCourse.description || `Learn ${adminCourse.name} with practical video lectures and real examples.`,
          curriculum: adminCourse.lectures?.map((lecture, idx) => ({
            id: idx + 1,
            title: lecture.title || `Lecture ${idx + 1}`,
            duration: (!lecture.duration || lecture.duration === 'Unknown' || lecture.duration === 'N/A') 
              ? (lecture.type === 'quiz' ? 'Quiz' : '15 min') 
              : lecture.duration,
            isFree: lecture.type === 'demo',
            videoId: lecture.videoId || '',
            url: lecture.url || '',
            type: lecture.type || 'lecture',
            sub: lecture.type === 'quiz' 
              ? 'Complete this quiz to test your knowledge.'
              : lecture.type === 'demo'
                ? 'Free demo preview available for every student.'
                : 'Paid lecture content available after approval.',
          })) || []
        });
      }
      setLoading(false);
    };

    fetchCourseDetail();
  }, [slug]);

  // Security measures to deter simple URL extraction
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
      }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLoginSuccess = (isAdmin) => {
    setShowAuthModal(false);
    checkUserAccess();
  };

  const handleEnrollClick = () => {
    if (!userEmail) {
      setShowAuthModal(true);
    } else {
      setShowPaymentModal(true);
    }
  };

  const submitPayment = async () => {
    if (!profileName.trim() || !profilePhone.trim()) {
      alert("Please provide your Full Name and WhatsApp Number.");
      return;
    }
    if (!transactionId.trim()) {
      alert("Please enter a Transaction ID");
      return;
    }
    if (!receiptImage) {
      alert("Please upload the receipt proof");
      return;
    }

    setLoading(true);

    try {
      // Update user's profile with provided name and phone
      await supabase.from('users').update({ full_name: profileName, phone: profilePhone }).eq('email', userEmail);

      if (isInstallmentDue && purchaseRecord) {
        // Upload next installment
        const currentHistory = Array.isArray(purchaseRecord.payment_history) ? purchaseRecord.payment_history : [];
        currentHistory.push({
          receiptUrl: purchaseRecord.payment_screenshot_url,
          date: new Date().toISOString()
        });

        const { error } = await supabase
          .from('purchases')
          .update({
            status: 'pending',
            payment_screenshot_url: receiptImage,
            payment_history: currentHistory
          })
          .eq('id', purchaseRecord.id);

        if (error) throw error;
        alert("Next installment payment submitted! Admin will review it shortly.");
      } else {
        // New purchase
        const cleanEmail = (userEmail || window.localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();
        const newP = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'purchase_' + Date.now(),
          student_email: cleanEmail,
          course_slug: courseData.slug,
          status: 'pending',
          payment_screenshot_url: receiptImage,
          payment_plan: paymentMode,
          installments_paid: paymentMode === 'installment' ? 0 : 1,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('purchases')
          .insert([newP]);
  
        if (error) throw error;

        // Local storage fallback for purchases
        try {
          const localP = JSON.parse(window.localStorage.getItem('parhlo_purchases') || '[]');
          const filtered = localP.filter(p => !((p.course_slug || '').trim().toLowerCase() === (courseData.slug || '').trim().toLowerCase() && (p.student_email || '').trim().toLowerCase() === cleanEmail));
          filtered.push(newP);
          window.localStorage.setItem('parhlo_purchases', JSON.stringify(filtered));
        } catch (e) {}

        alert("Payment submitted! An admin will review and approve your access shortly.");
      }

      setPaymentStatus('pending');
      setIsInstallmentDue(false);
      setShowPaymentModal(false);
    } catch (err) {
      console.error('Error submitting payment:', err);
      const errMsg = typeof err === 'object' ? (err.message || err.details || JSON.stringify(err)) : String(err);
      alert(`Failed to submit payment. Database Error: ${errMsg}. Please check your purchases table schema or RLS policies.`);
    } finally {
      setLoading(false);
    }
  };

  const submitFreeTrialActivation = async () => {
    setLoading(true);
    try {
      const cleanEmail = (userEmail || window.localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();
      const origPrice = courseData?.rawOriginalPrice || 7000;
      const monthlyInst = Math.round(origPrice / 3);

      const newPurchase = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'purchase_' + Date.now(),
        student_email: cleanEmail,
        course_slug: courseData.slug,
        status: 'approved',
        payment_plan: 'free_trial',
        amount_paid: 0,
        total_price: origPrice,
        monthly_installment_amount: monthlyInst,
        installments_paid: 0,
        next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        offer_id: activeOffer?.id,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from('purchases').insert([newPurchase]);
      } catch (e) {
        console.warn("Supabase insert warning:", e);
      }

      // Local storage fallback for purchases
      try {
        const localP = JSON.parse(window.localStorage.getItem('parhlo_purchases') || '[]');
        if (!localP.some(p => p.course_slug === newPurchase.course_slug && p.student_email === cleanEmail)) {
          localP.push(newPurchase);
          window.localStorage.setItem('parhlo_purchases', JSON.stringify(localP));
        }
      } catch (e) {}

      // Redeem offer
      if (activeOffer?.id) {
        try {
          await supabase.from('sales_offers').update({ status: 'redeemed' }).eq('id', activeOffer.id);
        } catch (e) {}
        try {
          const local = JSON.parse(window.localStorage.getItem('parhlo_sales_offers') || '[]');
          const updated = local.map(o => o.id === activeOffer.id ? { ...o, status: 'redeemed' } : o);
          window.localStorage.setItem('parhlo_sales_offers', JSON.stringify(updated));
        } catch (e) {}
      }

      setPaymentStatus('approved');
      setPurchaseRecord(newPurchase);
      setShowPaymentModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }

      alert("1-Month Free Access Activated! You can watch up to 1/3rd of total course video duration during your trial. Your 1st & 2nd month installments will be due after 30 days.");
    } catch (err) {
      console.error("Free trial error:", err);
      alert("Failed to activate 1-Month Free Access. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekKey = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now - start) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((dayOfYear + start.getDay() + 1) / 7);
    return `${now.getFullYear()}_W${weekNum}`;
  };

  const openPreview = (index) => {
    const item = courseData.curriculum[index];
    if (!item.isFree && paymentStatus !== 'approved') {
      alert("You need to purchase this course to view this lecture.");
      return;
    }

    const plan = purchaseRecord?.payment_plan || 'full';

    // Full Payment plan has UNRESTRICTED full access with NO limits
    if (plan !== 'full') {
      const totalCourseSeconds = (courseData?.curriculum || []).reduce((acc, lec) => {
        if (lec.duration && lec.duration.includes('min')) {
          return acc + (parseInt(lec.duration) || 15) * 60;
        }
        return acc + 900;
      }, 0);

      const weeklyLimitSeconds = Math.max(300, Math.round(totalCourseSeconds / 12)); // 1/12th per week
      const monthlyFreeLimitSeconds = Math.max(900, Math.round(totalCourseSeconds / 3)); // 1/3rd in 1-month free trial

      // Calculate total watched seconds
      const keyTotal = `parhlo_watch_${userEmail}_${courseData.slug}`;
      let totalWatched = 0;
      try {
        const watchMap = JSON.parse(window.localStorage.getItem(keyTotal) || '{}');
        totalWatched = Object.values(watchMap).reduce((a, b) => a + (Number(b) || 0), 0);
      } catch (e) {}

      // Calculate weekly watched seconds
      const weekKey = `parhlo_weekly_${userEmail}_${courseData.slug}`;
      const currentWeekId = getCurrentWeekKey();
      let weeklyWatched = 0;
      try {
        const weeklyMap = JSON.parse(window.localStorage.getItem(weekKey) || '{}');
        weeklyWatched = Number(weeklyMap[currentWeekId]) || 0;
      } catch (e) {}

      // 1. Check 1-Month Free Access Total Quota (1/3rd limit)
      if (plan === 'free_trial' && totalWatched >= monthlyFreeLimitSeconds) {
        alert(
          `🚀 1-Month Free Access Quota Completed!\n\n` +
          `You have completed your 1-Month Free Access allowance (${Math.round(totalWatched / 60)} min / ${Math.round(monthlyFreeLimitSeconds / 60)} min quota).\n\n` +
          `Your 1st month free access period is complete! To unlock your remaining course modules for Month 2 & 3, please complete your 1st & 2nd month installment payments in your dashboard.`
        );
        return;
      }

      // 2. Check Weekly Pace Quota (1/12th limit per week)
      if (weeklyWatched >= weeklyLimitSeconds) {
        alert(
          `📚 Weekly Study Quota Completed!\n\n` +
          `"Learning is a marathon, not a sprint."\n\n` +
          `You have successfully finished your recommended weekly study quota (${Math.round(weeklyWatched / 60)} min / ${Math.round(weeklyLimitSeconds / 60)} min limit) for this week.\n\n` +
          `To optimize retention and match your brain's natural cognitive learning curve, take time to digest this week's material and return next week to continue your learning journey!`
        );
        return;
      }
    }

    setPreviewLecture(index);
    setShowPreviewOverlay(true);
  };

  const closePreview = () => {
    setShowPreviewOverlay(false);
    setPreviewLecture(null);
  };

  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });

  useEffect(() => {
    if (showPreviewOverlay) {
      const interval = setInterval(() => {
        setWatermarkPos({
          top: `${Math.floor(Math.random() * 80) + 10}%`,
          left: `${Math.floor(Math.random() * 80) + 10}%`
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showPreviewOverlay]);

  useEffect(() => {
    let interval;
    if (showPreviewOverlay && userEmail && courseData && previewItem) {
      interval = setInterval(() => {
        const plan = purchaseRecord?.payment_plan || 'full';
        
        const keyTotal = `parhlo_watch_${userEmail}_${courseData.slug}`;
        let progressData = {};
        try {
          progressData = JSON.parse(window.localStorage.getItem(keyTotal) || '{}');
          if (typeof progressData !== 'object' || progressData === null) progressData = {};
        } catch (e) {
          progressData = {};
        }

        const lectureId = String(previewItem.id);
        const currentSeconds = progressData[lectureId] || 0;
        
        let maxSeconds = 900;
        if (previewItem.duration && previewItem.duration.includes('min')) {
           maxSeconds = (parseInt(previewItem.duration) || 15) * 60;
        }

        if (currentSeconds < maxSeconds) {
           const newSeconds = currentSeconds + 10;
           progressData[lectureId] = newSeconds;
           window.localStorage.setItem(keyTotal, JSON.stringify(progressData));

           if (plan !== 'full') {
             const weekKey = `parhlo_weekly_${userEmail}_${courseData.slug}`;
             const currentWeekId = getCurrentWeekKey();
             let weeklyMap = {};
             try {
               weeklyMap = JSON.parse(window.localStorage.getItem(weekKey) || '{}');
             } catch (e) {}
             const currentWeeklySec = Number(weeklyMap[currentWeekId]) || 0;
             weeklyMap[currentWeekId] = currentWeeklySec + 10;
             window.localStorage.setItem(weekKey, JSON.stringify(weeklyMap));
           }

           // Upsert watched time to Supabase user_video_progress
           supabase
             .from('user_video_progress')
             .upsert([{
               student_email: userEmail.trim().toLowerCase(),
               course_slug: courseData.slug,
               lecture_id: lectureId,
               watched_seconds: newSeconds,
               last_watched_at: new Date().toISOString()
             }], { onConflict: 'student_email,course_slug,lecture_id' })
             .then(({ error }) => {
               if (error) console.error('Error saving video progress to Supabase:', error);
             });
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [showPreviewOverlay, userEmail, courseData, previewItem, purchaseRecord]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-8 py-24 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-4">Course Not Found</p>
          <h1 className="text-4xl font-black text-slate-900 mb-6">That course does not exist yet.</h1>
          <p className="text-gray-500 mb-10">Make sure the admin created the course and the slug matches the URL exactly.</p>
          <Link href="/courses" className="inline-flex items-center gap-2 rounded-full bg-[#064e3b] px-8 py-4 text-white font-black hover:bg-green-600 transition-all">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode="login"
        onLoginSuccess={handleLoginSuccess}
      />

      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] max-w-4xl w-full relative shadow-2xl border border-gray-100 flex flex-col md:flex-row gap-10 my-8">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-gray-400 hover:text-gray-900 transition-colors z-10"><X /></button>
            
            {/* Left Column - Payment Details */}
            <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 pb-8 md:pb-0 md:pr-10">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6"><CreditCard size={28} /></div>
              
              {activeOffer && (
                <div className="bg-emerald-900 text-white p-5 rounded-2xl mb-6 shadow-lg border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full">
                      Private Offer
                    </span>
                    <span className="text-xs text-emerald-200">Issued by {activeOffer.sales_email}</span>
                  </div>
                  <h4 className="font-black text-lg text-white">Special Private Offer Just For You!</h4>
                  {activeOffer.offer_type === 'independenceday_14' && (
                    <p className="text-xs text-emerald-100">
                      🇵🇰 <strong>14% Independence Day Special Discount Applied!</strong> Discounted Total: <strong>Rs. {activeOffer.custom_total_price?.toLocaleString()}</strong> | Monthly Installment: <strong>Rs. {activeOffer.custom_installment_amount?.toLocaleString()} / mo</strong>
                    </p>
                  )}
                  {activeOffer.offer_type === 'added_discount' && (
                    <p className="text-xs text-emerald-100">
                      You have received an additional <strong>{activeOffer.discount_percent}% discount</strong> on this course.
                    </p>
                  )}
                  {activeOffer.offer_type === 'free_month_trial' && (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs text-emerald-100">
                        Get <strong>1-Month Free Access</strong> with <strong>Rs. 0 initial payment today</strong>. Your 1st installment is delayed to month 2 and will be paid together with your 2nd installment. 
                      </p>
                      <button
                        onClick={submitFreeTrialActivation}
                        className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black py-3 rounded-xl shadow-md transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                      >
                        Claim 1-Month Free Access Now (Rs. 0)
                      </button>
                    </div>
                  )}
                  {activeOffer.offer_type === 'discounted_installment' && (
                    <p className="text-xs text-emerald-100">
                      Special Monthly Installment Rate: <strong>Rs. {activeOffer.custom_installment_amount?.toLocaleString()} / month</strong>
                    </p>
                  )}
                </div>
              )}

              {isInstallmentDue ? (
                <>
                  <h3 className="text-2xl font-black mb-1 text-slate-900">Pay Next Installment</h3>
                  <p className="text-gray-500 mb-8 text-sm font-medium">Send <span className="font-bold text-gray-900 text-lg">Rs. {Math.round(courseData.rawOriginalPrice / 3).toLocaleString()}</span> to the details below to resume your course.</p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-black mb-1 text-slate-900">Buy {courseData.title}</h3>
                  
                  <div className="mb-6 grid grid-cols-2 gap-4 mt-6">
                    <div 
                      onClick={() => setPaymentMode('full')} 
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMode === 'full' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}
                    >
                      <p className="text-sm font-bold text-gray-900 mb-1">Pay in Full</p>
                      <p className="text-xs text-green-600 font-bold">
                        {(activeOffer?.offer_type === 'added_discount' || activeOffer?.offer_type === 'independenceday_14') ? formatCurrency(activeOffer.custom_total_price) : courseData.salePrice}
                      </p>
                    </div>
                    <div 
                      onClick={() => setPaymentMode('installment')} 
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMode === 'installment' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}
                    >
                      <p className="text-sm font-bold text-gray-900 mb-1">3 Installments</p>
                      <p className="text-xs text-green-600 font-bold">
                        Rs. {(activeOffer?.offer_type === 'discounted_installment' || activeOffer?.offer_type === 'independenceday_14') ? activeOffer.custom_installment_amount?.toLocaleString() : Math.round(courseData.rawOriginalPrice / 3).toLocaleString()} /mo
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-500 mb-8 text-sm font-medium">
                    Send <span className="font-bold text-gray-900 text-lg">
                      {paymentMode === 'full' 
                        ? ((activeOffer?.offer_type === 'added_discount' || activeOffer?.offer_type === 'independenceday_14') ? formatCurrency(activeOffer.custom_total_price) : courseData.salePrice)
                        : `Rs. ${(activeOffer?.offer_type === 'discounted_installment' || activeOffer?.offer_type === 'independenceday_14') ? activeOffer.custom_installment_amount?.toLocaleString() : Math.round(courseData.rawOriginalPrice / 3).toLocaleString()}`
                      }
                    </span> to the details below.
                  </p>
                </>
              )}

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">Bank Transfer (Bank Alfalah)</p>
                <p className="text-lg font-mono text-gray-900 font-bold tracking-tight">55295001809451</p>
                <p className="text-xs text-gray-400 mt-1">Title: Muhammad Faraz Sohail</p>
              </div>
            </div>

            {/* Right Column - User Inputs */}
            <div className="flex-1 flex flex-col pt-2 md:pt-0">
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="Enter your WhatsApp number"
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Transaction ID / TID</label>
                <input 
                  type="text" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium" 
                />
              </div>

              <div className="mb-8 flex-1">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Upload Receipt Proof</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <div 
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col justify-center text-center cursor-pointer transition-colors overflow-hidden min-h-[100px] ${receiptImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {receiptImage ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle2 size={24} className="text-green-600 mb-2"/>
                      <span className="text-green-600 font-bold text-sm">Receipt Uploaded Successfully</span>
                      <img src={receiptImage} alt="Receipt preview" className="mt-3 h-16 object-contain rounded-lg border border-green-200" />
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm font-medium flex flex-col items-center gap-2"><Upload size={20} className="text-gray-400"/> Click to browse & upload receipt</span>
                  )}
                </div>
              </div>

              <button onClick={submitPayment} className="w-full bg-gray-900 text-white py-4 rounded-xl font-black hover:bg-green-600 transition-all shadow-xl mt-auto">SUBMIT PAYMENT</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="border-b border-gray-100 p-4 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <Link href="/courses" className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-bold transition-colors">
            <ChevronLeft size={20} /> Back to Courses
          </Link>
          <div className="flex gap-4 items-center">
            {userEmail ? (
              <Link href={dashboardUrl} className="text-sm font-bold text-gray-600 hover:text-green-600">Dashboard</Link>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="text-sm font-bold text-gray-600 hover:text-green-600">Login</button>
            )}
            <button onClick={() => setShowShareModal(true)} className="p-2 text-gray-400 hover:text-gray-900"><Share2 size={20} /></button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#064e3b] text-white pt-16 pb-24 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-20" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
          <div className="lg:col-span-2">
            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
              {courseData.category}
            </span>
            <h1 className="text-5xl md:text-6xl font-black mt-6 mb-8 tracking-tighter leading-tight">
              {courseData.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                <Star size={16} className="text-yellow-400" fill="currentColor" />
                <span className="font-bold text-sm">{courseData.rating}</span>
              </div>
              {courseData.students && (
                <div className="flex items-center gap-2 text-emerald-100 font-medium text-sm">
                  <Users size={16} />
                  {courseData.students} Students Enrolled
                </div>
              )}
            </div>

            {isInstallmentDue && (
              <div className="bg-orange-500 text-white p-4 rounded-xl mb-6 flex items-start gap-3">
                <AlertCircle size={24} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Installment Due</h4>
                  <p className="text-sm text-white/90">Please pay your next installment to view and attempt the rest of the lectures/quizzes.</p>
                </div>
              </div>
            )}

            <p className="text-emerald-100/80 text-lg md:text-xl font-medium max-w-xl leading-relaxed mb-10">
              {courseData.description}
            </p>

            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><PlayCircle size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-black opacity-50 tracking-widest">Content</p>
                  <p className="font-bold text-sm">{courseData.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><BarChart size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-black opacity-50 tracking-widest">Level</p>
                  <p className="font-bold text-sm">{courseData.level}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><User size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-black opacity-50 tracking-widest">Instructor</p>
                  <p className="font-bold text-sm">{courseData.instructor}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:absolute lg:right-0 lg:top-0">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 text-slate-900 w-full lg:w-[380px] hover:translate-y-[-4px] transition-transform duration-500">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex flex-col">
                    <p className="text-4xl font-black tracking-tighter text-gray-900 font-mono">{courseData.salePrice}</p>
                    {courseData.discount > 0 && (
                      <p className="text-sm text-gray-500 line-through mt-1">{courseData.originalPrice}</p>
                    )}
                  </div>
                  {courseData.discount > 0 && (
                    <span className="bg-green-100 text-green-700 font-black text-[10px] px-3 py-1 rounded-md mt-2 md:mt-0 uppercase tracking-widest">
                      Save {courseData.discount}%{courseData.savings ? ` · ${courseData.savings}` : ''}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm font-medium">One-time payment for lifetime access</p>
              </div>

              {/* Added Installment Note */}
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-8 flex items-start gap-4">
                <div className="text-amber-500 mt-1"><CreditCard size={24} /></div>
                <div>
                  <h4 className="text-amber-900 font-bold mb-1">New: Pay in 3 Monthly Installments</h4>
                  <p className="text-amber-700/80 text-sm font-medium">You can now split the cost of this course into 3 equal monthly payments. Note that the original price will apply when paying in installments.</p>
                </div>
              </div>

              {!userEmail ? (
                <button onClick={handleEnrollClick} className="w-full bg-[#064e3b] text-white py-5 rounded-2xl font-black text-lg hover:bg-green-600 transition-all shadow-xl shadow-green-900/10 mb-6">
                  Sign In to Enroll
                </button>
              ) : paymentStatus === 'approved' ? (
                <button disabled className="w-full bg-green-100 text-green-800 py-5 rounded-2xl font-black text-lg mb-6 flex justify-center items-center gap-2">
                  <CheckCircle2 size={24} /> Course Purchased
                </button>
              ) : paymentStatus === 'pending' ? (
                <button disabled className="w-full bg-amber-100 text-amber-800 py-5 rounded-2xl font-black text-lg mb-6 flex justify-center items-center gap-2">
                  <Clock size={24} /> Payment Pending Approval
                </button>
              ) : isInstallmentDue ? (
                <button onClick={handleEnrollClick} className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-900/10 mb-6">
                  Pay Next Installment
                </button>
              ) : (
                <button onClick={handleEnrollClick} className="w-full bg-[#064e3b] text-white py-5 rounded-2xl font-black text-lg hover:bg-green-600 transition-all shadow-xl shadow-green-900/10 mb-6">
                  Buy Now
                </button>
              )}

              <div className="space-y-4 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <CheckCircle2 size={18} className="text-green-600" /> Full Lifetime Access
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <CheckCircle2 size={18} className="text-green-600" /> Certificate of Completion
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <CheckCircle2 size={18} className="text-green-600" /> Support from Instructor
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 py-24">
        <div className="lg:w-2/3">
          <div className="flex gap-8 border-b border-gray-100 mb-12">
            <button className="pb-4 border-b-4 border-green-600 text-lg font-black tracking-tight flex items-center">
              Course Content <span className="ml-2 text-sm text-slate-600 font-bold px-2 py-0.5 bg-slate-100 rounded-lg">{courseData.curriculum.length} Lectures</span>
            </button>
          </div>

          {previewLecture !== null && courseData.curriculum[previewLecture] && (
            <div className="mb-10 rounded-[2rem] border border-green-200 bg-green-50 p-8">
              <h3 className="text-xl font-black text-green-900">Playing Lecture</h3>
              <p className="mt-3 text-base font-bold text-slate-900">{courseData.curriculum[previewLecture].title}</p>
              <button type="button" onClick={closePreview} className="mt-6 rounded-full border border-green-200 bg-white px-6 py-3 text-green-700 font-bold hover:bg-green-100 transition-all">
                Close Video
              </button>
            </div>
          )}

          <div className="space-y-4">
            {(showAllLectures ? courseData.curriculum : courseData.curriculum.slice(0, 10)).map((item, idx) => {
              const hasAccess = item.isFree || paymentStatus === 'approved';
              
              return (
                <div
                  key={item.id}
                  className={`group flex items-start gap-6 p-6 rounded-3xl transition-all duration-300 border ${idx === 0 ? 'bg-gray-50 border-gray-100 shadow-sm' : 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50/50'}`}
                >
                  <div className={`mt-1 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${hasAccess ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-white'}`}>
                    {hasAccess ? <PlayCircle size={24} /> : <Lock size={20} />}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-lg font-bold text-gray-900 tracking-tight">
                        {idx + 1}. {item.title}
                      </h4>
                      <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                        <Clock size={12} /> {(!item.duration || item.duration === 'Unknown' || item.duration === 'N/A') ? (item.type === 'quiz' ? 'Quiz' : '15 min') : item.duration}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-md">{item.sub}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (item.type === 'quiz' && item.url) {
                        if (!hasAccess) {
                          alert("You need to purchase this course to take this quiz.");
                          return;
                        }
                        window.open(item.url, '_blank');
                      } else if (item.videoId) {
                        openPreview(idx);
                      }
                    }}
                    disabled={(!item.videoId && item.type !== 'quiz') || (item.type === 'quiz' && !item.url) || !hasAccess}
                    className={`bg-white border px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-gray-900 shadow-sm transition-colors ${hasAccess ? 'border-green-200 hover:border-green-600' : 'border-gray-200'} ${(!item.videoId && item.type !== 'quiz') || (item.type === 'quiz' && !item.url) || !hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {item.type === 'quiz' 
                      ? (!item.url ? 'Unavailable' : hasAccess ? 'Take Quiz' : 'Enroll to Unlock')
                      : (!item.videoId ? 'Unavailable' : hasAccess ? 'Play Video' : 'Enroll to Unlock')
                    }
                  </button>
                </div>
              );
            })}
          </div>

          {!showAllLectures && courseData.curriculum.length > 10 && (
            <div className="mt-12 text-center">
              <button 
                onClick={() => setShowAllLectures(true)}
                className="bg-green-50 text-green-700 hover:bg-green-100 font-bold py-4 px-10 rounded-full transition-colors border border-green-200"
              >
                See all {courseData.curriculum.length} lectures
              </button>
            </div>
          )}

          <div className="mt-20 p-10 bg-gray-50 rounded-[3rem] flex flex-col md:flex-row gap-10 items-center border border-gray-100">
            <div className="w-32 h-32 bg-gray-200 rounded-full shrink-0 overflow-hidden border-4 border-white shadow-lg">
              {courseData.instructorImage ? (
                <img src={courseData.instructorImage} alt={courseData.instructor} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={40} /></div>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-green-600 tracking-[0.2em] mb-2">Taught by</p>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">{courseData.instructor}</h3>
              <p className="text-gray-500 font-medium leading-relaxed italic">
                {courseData.instructorIntro}
              </p>
            </div>
          </div>
        </div>
      </section>

      {showPreviewOverlay && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl">
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-4 top-4 z-30 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-slate-900 shadow-lg hover:bg-white"
            >
              Close
            </button>
            <div className="aspect-video bg-black relative overflow-hidden">
              {userEmail && (
                <div 
                  className="absolute pointer-events-none opacity-20 text-white font-mono text-sm font-bold z-10 transition-all duration-[5000ms] ease-in-out px-3 py-1 bg-black/50 rounded-lg"
                  style={{ top: watermarkPos.top, left: watermarkPos.left }}
                >
                  {userEmail}
                </div>
              )}
              {/* Invisible blockers to prevent hovering/clicking YouTube's native links */}
              <div className="absolute top-0 left-0 w-full h-[70px] z-20" /> {/* Blocks Title and Share/Copy Link */}
              <div className="absolute bottom-0 right-0 w-[150px] h-[60px] z-20" /> {/* Blocks YouTube Logo */}
              <div className="absolute bottom-0 left-0 w-[150px] h-[60px] z-20" /> {/* Blocks Watch on YouTube button if it appears */}
              
              <iframe
                src={previewUrl}
                title="Course preview"
                className="h-full w-full relative z-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={courseData.title}
          description={courseData.description}
        />
      )}

      <footer className="py-12 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">© 2026 Parhlo Pakistan</p>
      </footer>
    </div>
  );
}
