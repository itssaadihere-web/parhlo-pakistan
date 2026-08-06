"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Tag,
  Gift,
  Clock,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  Search,
  Trash2,
  PlusCircle,
  Percent,
  CreditCard,
  Building2,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { formatCurrency, parsePrice } from '@/utils/currencyHelpers';

const SALES_EMAILS = [
  'faiz.ali@parhlopakistan.com.pk',
  'nabiha.irfan@parhlopakistan.com.pk'
];

export default function SalesDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState({ email: '', role: '', isSales: false, isAdmin: false });
  const [loading, setLoading] = useState(true);

  // Form State
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedCourseSlug, setSelectedCourseSlug] = useState('');
  const [offerType, setOfferType] = useState('added_discount'); // 'added_discount' | 'free_month_trial' | 'discounted_installment'
  const [discountPercent, setDiscountPercent] = useState('5');
  const [customInstallment, setCustomInstallment] = useState('');
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Data
  const [courses, setCourses] = useState([]);
  const [offers, setOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const email = (window.localStorage.getItem('currentUserEmail') || '').toLowerCase().trim();
    const role = window.localStorage.getItem('parhloRole');
    const isAdmin = window.localStorage.getItem('parhloAdmin') === 'true' || role === 'admin';
    const isSales = SALES_EMAILS.includes(email) || role === 'sales';

    if (!isAdmin && !isSales) {
      alert("Access Denied: Sales Portal is restricted to authorized Sales personnel and Admin.");
      router.replace('/');
      return;
    }

    setCurrentUser({ email, role: isAdmin ? 'admin' : 'sales', isSales, isAdmin });
    fetchCoursesAndOffers();
  }, []);

  const fetchCoursesAndOffers = async () => {
    setLoading(true);

    // Fetch courses
    const { data: coursesData } = await supabase.from('courses').select('*').order('name');
    setCourses(coursesData || []);

    if (coursesData && coursesData.length > 0 && !selectedCourseSlug) {
      setSelectedCourseSlug(coursesData[0].slug);
    }

    // Fetch sales offers from Supabase (with fallback to localStorage)
    let fetchedOffers = [];
    try {
      const { data: dbOffers, error } = await supabase.from('sales_offers').select('*').order('created_at', { ascending: false });
      if (!error && dbOffers) {
        fetchedOffers = dbOffers;
      } else {
        const local = window.localStorage.getItem('parhlo_sales_offers');
        if (local) fetchedOffers = JSON.parse(local);
      }
    } catch (e) {
      const local = window.localStorage.getItem('parhlo_sales_offers');
      if (local) fetchedOffers = JSON.parse(local);
    }

    setOffers(fetchedOffers);
    setLoading(false);
  };

  const selectedCourse = courses.find(c => c.slug === selectedCourseSlug);
  const rawPrice = selectedCourse ? parsePrice(selectedCourse.price) : 0;
  const standardDiscount = selectedCourse ? (parseFloat(String(selectedCourse.discount || '0').replace(/[^0-9.]/g, '')) || 0) : 0;
  const basePrice = standardDiscount > 0 ? Math.round(rawPrice * (1 - standardDiscount / 100)) : rawPrice;

  // Calculate pricing preview for offer
  let calculatedDiscountedPrice = basePrice;
  let calculatedMonthlyInstallment = Math.round(basePrice / 3);

  if (offerType === 'added_discount') {
    const extraDisc = Math.min(currentUser.isAdmin ? 100 : 5, parseFloat(discountPercent) || 0);
    calculatedDiscountedPrice = Math.max(0, Math.round(basePrice * (1 - extraDisc / 100)));
    calculatedMonthlyInstallment = Math.round(calculatedDiscountedPrice / 3);
  } else if (offerType === 'free_month_trial') {
    calculatedDiscountedPrice = basePrice;
    calculatedMonthlyInstallment = Math.round(basePrice / 3);
  } else if (offerType === 'discounted_installment') {
    calculatedMonthlyInstallment = parseFloat(customInstallment) || Math.round(basePrice / 3);
    calculatedDiscountedPrice = calculatedMonthlyInstallment * 3;
  }

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    if (!studentEmail.trim() || !studentEmail.includes('@')) {
      setFormMessage({ type: 'error', text: 'Please enter a valid student email address.' });
      return;
    }

    if (!selectedCourseSlug) {
      setFormMessage({ type: 'error', text: 'Please select a course.' });
      return;
    }

    // Validate discount cap for Sales Team
    const extraDisc = parseFloat(discountPercent) || 0;
    if (!currentUser.isAdmin && offerType === 'added_discount' && extraDisc > 5) {
      setFormMessage({ type: 'error', text: 'Sales Team limit exceeded: You can offer up to a maximum of 5% additional discount.' });
      return;
    }

    const newOffer = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'offer_' + Date.now(),
      sales_email: currentUser.email,
      student_email: studentEmail.trim().toLowerCase(),
      course_slug: selectedCourseSlug,
      offer_type: offerType,
      discount_percent: offerType === 'added_discount' ? extraDisc : 0,
      custom_installment_amount: offerType === 'discounted_installment' ? calculatedMonthlyInstallment : 0,
      custom_total_price: calculatedDiscountedPrice,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // Try DB insertion
    let dbSuccess = false;
    try {
      const { error } = await supabase.from('sales_offers').insert([newOffer]);
      if (!error) dbSuccess = true;
    } catch (err) {
      console.warn("DB insert fallback to local storage:", err);
    }

    // Always update local storage sync as well
    const updatedLocal = [newOffer, ...offers];
    setOffers(updatedLocal);
    window.localStorage.setItem('parhlo_sales_offers', JSON.stringify(updatedLocal));

    setFormMessage({
      type: 'success',
      text: `Private offer successfully created for ${studentEmail}! The student will see this custom offer upon logging in.`
    });

    setStudentEmail('');
    setDiscountPercent('5');
    setCustomInstallment('');
  };

  const handleRevokeOffer = async (offerId) => {
    if (!confirm("Are you sure you want to revoke this private offer?")) return;

    try {
      await supabase.from('sales_offers').delete().eq('id', offerId);
    } catch (e) {}

    const updated = offers.filter(o => o.id !== offerId);
    setOffers(updated);
    window.localStorage.setItem('parhlo_sales_offers', JSON.stringify(updated));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    window.localStorage.removeItem('parhloAdmin');
    window.localStorage.removeItem('parhloRole');
    window.localStorage.removeItem('currentUserEmail');
    router.push('/');
  };

  const filteredOffers = offers.filter(o => 
    o.student_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.course_slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Header Navigation */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
                P
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                PARHLO <span className="text-emerald-400">SALES</span>
              </span>
            </Link>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {currentUser.isAdmin ? 'Admin Sales Portal' : 'Sales Representative'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-200">{currentUser.email}</span>
              <span className="text-xs text-slate-400 capitalize">{currentUser.role} Account</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-700 hover:bg-rose-600/80 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome & Notice Banner */}
        <div className="bg-gradient-to-r from-emerald-900/40 via-slate-800 to-teal-900/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="space-y-2 relative z-10">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Sparkles className="text-emerald-400" />
              Sales Representative Command Center
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Create customized, private offers for prospective students. Discounts generated here remain strictly confidential and will only be displayed directly to the targeted student upon login.
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
            <ShieldAlert className="text-amber-400 flex-shrink-0" size={24} />
            <div>
              <span className="font-bold text-amber-300 block">Sales Discount Policy:</span>
              Sales Reps can offer max 5% added discount or 1-Month Free Access (delayed 1st installment). Admin has unlimited discount rights.
            </div>
          </div>
        </div>

        {/* Action Grid: Offer Form & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form to Create Offer */}
          <div className="lg:col-span-6 bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PlusCircle className="text-emerald-400" />
                Generate Private Student Offer
              </h2>
              <span className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full font-mono">
                Privately Targeted
              </span>
            </div>

            {formMessage.text && (
              <div className={`p-4 rounded-2xl flex items-start gap-3 text-sm font-medium ${
                formMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {formMessage.type === 'success' ? <CheckCircle2 className="flex-shrink-0 mt-0.5" /> : <AlertCircle className="flex-shrink-0 mt-0.5" />}
                <div>{formMessage.text}</div>
              </div>
            )}

            <form onSubmit={handleCreateOffer} className="space-y-5">
              
              {/* Target Student Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Target Student Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="e.g. student@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              {/* Target Course Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Target Course <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedCourseSlug}
                  onChange={(e) => setSelectedCourseSlug(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                >
                  {courses.map(c => (
                    <option key={c.id || c.slug} value={c.slug}>
                      {c.name} ({formatCurrency(parsePrice(c.price))})
                    </option>
                  ))}
                </select>
              </div>

              {/* Offer Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Offer Type <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <button
                    type="button"
                    onClick={() => setOfferType('added_discount')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      offerType === 'added_discount'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Percent className="mb-2 text-emerald-400" size={20} />
                    <div>
                      <div className="font-bold text-xs">Added Discount</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Up to {currentUser.isAdmin ? '100%' : '5%'} extra</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOfferType('free_month_trial')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      offerType === 'free_month_trial'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Gift className="mb-2 text-emerald-400" size={20} />
                    <div>
                      <div className="font-bold text-xs">1-Month Free Access</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Delayed 1st Inst. (1/12th limit)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOfferType('discounted_installment')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      offerType === 'discounted_installment'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <CreditCard className="mb-2 text-emerald-400" size={20} />
                    <div>
                      <div className="font-bold text-xs">Custom Installment</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Discounted monthly plan</div>
                    </div>
                  </button>

                </div>
              </div>

              {/* Conditional Inputs based on Offer Type */}
              {offerType === 'added_discount' && (
                <div className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-300">Additional Discount Percentage (%)</label>
                    <span className="text-emerald-400 font-mono font-bold">
                      {currentUser.isAdmin ? 'Admin (Unlimited)' : 'Sales Cap: Max 5%'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={currentUser.isAdmin ? 100 : 5}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="Enter percentage (e.g. 5)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {offerType === 'free_month_trial' && (
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30 text-xs text-slate-300 space-y-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Gift size={16} /> 1-Month Free Access Protocol
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Student pays <strong>Rs. 0 today</strong> to get instant trial access.</li>
                    <li>1st installment is <strong>delayed</strong> to month 2 and paid together with the 2nd installment.</li>
                    <li>Student is restricted to watch up to <strong>1/12th of total course video duration</strong> during the trial.</li>
                    <li>Teacher panel will show <strong>0 PKR collected</strong> during the free trial period.</li>
                  </ul>
                </div>
              )}

              {offerType === 'discounted_installment' && (
                <div className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                  <label className="text-xs font-bold text-slate-300">Custom Monthly Installment Price (PKR)</label>
                  <input
                    type="number"
                    value={customInstallment}
                    onChange={(e) => setCustomInstallment(e.target.value)}
                    placeholder={`Default: Rs. ${Math.round(basePrice / 3)}`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Offer Calculation Summary Card */}
              <div className="bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-2xl space-y-2 text-xs">
                <div className="text-slate-400 font-semibold uppercase tracking-wider">Offer Breakdown Preview</div>
                <div className="flex justify-between text-slate-300">
                  <span>Standard Public Price:</span>
                  <span className="font-mono">{formatCurrency(basePrice)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold text-sm pt-1 border-t border-slate-700">
                  <span>Student Offerd Price:</span>
                  <span>{formatCurrency(calculatedDiscountedPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Monthly Installment Plan:</span>
                  <span className="font-mono">{formatCurrency(calculatedMonthlyInstallment)} / month (3 months)</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
              >
                <Send size={18} />
                Generate & Issue Private Offer
              </button>

            </form>
          </div>

          {/* Right Column: Active Private Offers List */}
          <div className="lg:col-span-6 bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-700 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Tag className="text-emerald-400" />
                  Active Private Student Offers
                </h2>
                <p className="text-xs text-slate-400 mt-1">Total Offers Issued: {offers.length}</p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student email..."
                  className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* List of Offers */}
            {filteredOffers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <Tag size={40} className="mx-auto text-slate-600" />
                <p className="text-sm font-medium">No private offers found matching criteria.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredOffers.map((offer) => {
                  const courseObj = courses.find(c => c.slug === offer.course_slug);
                  return (
                    <div
                      key={offer.id}
                      className="bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 p-4 rounded-2xl space-y-3 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-mono text-emerald-400 font-bold block">
                            {offer.student_email}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {courseObj ? courseObj.name : offer.course_slug}
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          offer.status === 'redeemed' 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {offer.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Offer Type:</span>
                          <span className="font-semibold text-slate-200 capitalize">
                            {offer.offer_type === 'added_discount' && `${offer.discount_percent}% Added Discount`}
                            {offer.offer_type === 'free_month_trial' && `1-Month Free Access (0 PKR)`}
                            {offer.offer_type === 'discounted_installment' && `Custom Installments`}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Offered Price:</span>
                          <span className="font-bold font-mono text-emerald-400">
                            {formatCurrency(offer.custom_total_price)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Issued by: <strong className="text-slate-300">{offer.sales_email}</strong></span>
                        <div className="flex items-center gap-2">
                          <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                          <button
                            onClick={() => handleRevokeOffer(offer.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            title="Revoke Offer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
