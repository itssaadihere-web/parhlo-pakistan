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
  ShieldCheck,
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import InactivityTracker from '@/app/components/InactivityTracker';
import { formatCurrency, parsePrice } from '@/utils/currencyHelpers';

const SALES_EMAILS = [
  'faiz.ali@parhlopakistan.com.pk',
  'nabiha.irfan@parhlopakistan.com.pk'
];

export default function SalesDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState({ email: '', role: '', isSales: false, isAdmin: false });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    if (typeof window !== 'undefined') {
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
    }
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
    try {
      await supabase.from('sales_offers').insert([newOffer]);
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

  const activeOffersCount = offers.filter(o => o.status === 'active').length;
  const redeemedOffersCount = offers.filter(o => o.status === 'redeemed').length;

  const menuItems = [
    { name: 'Dashboard', icon: <BookOpen size={20} />, id: 'overview' },
    { name: 'Generate Offer', icon: <PlusCircle size={20} />, id: 'create' },
    { name: 'Active Offers', icon: <Tag size={20} />, id: 'offers' }
  ];

  const salesName = currentUser.email ? currentUser.email.split('@')[0] : 'Sales Rep';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <InactivityTracker onLogout={handleLogout} timeoutMs={15 * 60 * 1000} />

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-gray-50">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-10 cursor-pointer logo-outline" />
          </Link>
          <span className="font-bold text-green-800 text-sm bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
            Sales
          </span>
        </div>
        
        <div className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black text-xl uppercase shadow-sm border border-green-200">
            {salesName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">Welcome,</p>
            <p className="text-xs text-gray-500 font-medium truncate max-w-[120px]">{salesName}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === item.id 
                ? 'bg-[#064e3b] text-white shadow-md' 
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
            <img src="/logo.png" alt="Logo" className="h-10 logo-outline" />
            <span className="font-bold text-green-800 text-xs bg-green-50 px-2 py-0.5 rounded">Sales</span>
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
                <span className="font-bold text-green-800 text-xs bg-green-50 px-2 py-0.5 rounded">Sales</span>
              </div>
              
              <div className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black text-xl uppercase">
                  {salesName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">Welcome,</p>
                  <p className="text-xs text-gray-500 font-medium truncate max-w-[120px]">{salesName}</p>
                </div>
              </div>

              <nav className="flex-1 px-4 space-y-2 mt-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      activeTab === item.id 
                      ? 'bg-[#064e3b] text-white shadow-md' 
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

        {/* Dashboard Overview Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">Sales Representative Portal</h1>
            <p className="text-gray-500 font-medium text-sm">Issue private discount offers, 1-Month Free Access, and custom installment plans.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm">
              <ShieldCheck size={16} className="text-emerald-600" />
              {currentUser.isAdmin ? 'Admin Full Discount Rights' : 'Sales Cap: Max 5% Discount'}
            </span>
          </div>
        </header>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-600"><Tag size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Total Offers Issued</p>
              <p className="text-2xl font-black text-gray-900">{offers.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Active Offers</p>
              <p className="text-2xl font-black text-gray-900">{activeOffersCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-purple-50 text-purple-600"><Gift size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Redeemed Offers</p>
              <p className="text-2xl font-black text-gray-900">{redeemedOffersCount}</p>
            </div>
          </div>
        </div>

        {/* Action Grid: Form & Offers Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form to Create Offer */}
          <div className="lg:col-span-5 bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <PlusCircle className="text-emerald-600" size={22} />
                Create Private Student Offer
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Confidential
              </span>
            </div>

            {formMessage.text && (
              <div className={`p-4 rounded-2xl flex items-start gap-3 text-sm font-medium ${
                formMessage.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {formMessage.type === 'success' ? <CheckCircle2 className="flex-shrink-0 mt-0.5" /> : <AlertCircle className="flex-shrink-0 mt-0.5" />}
                <div>{formMessage.text}</div>
              </div>
            )}

            <form onSubmit={handleCreateOffer} className="space-y-5">
              
              {/* Target Student Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Target Student Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="e.g. student@gmail.com"
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-sm text-slate-900"
                />
              </div>

              {/* Target Course Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Target Course <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCourseSlug}
                  onChange={(e) => setSelectedCourseSlug(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-sm text-slate-900"
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
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Offer Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <button
                    type="button"
                    onClick={() => setOfferType('added_discount')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      offerType === 'added_discount'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Percent className="mb-2 text-emerald-600" size={20} />
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
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Gift className="mb-2 text-emerald-600" size={20} />
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
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="mb-2 text-emerald-600" size={20} />
                    <div>
                      <div className="font-bold text-xs">Custom Installment</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Discounted monthly plan</div>
                    </div>
                  </button>

                </div>
              </div>

              {/* Conditional Inputs based on Offer Type */}
              {offerType === 'added_discount' && (
                <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-gray-700">Additional Discount Percentage (%)</label>
                    <span className="text-emerald-700 font-mono font-bold">
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
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-slate-900 text-sm focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              )}

              {offerType === 'free_month_trial' && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <Gift size={16} /> 1-Month Free Access Protocol
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-emerald-800/90">
                    <li>Student pays <strong>Rs. 0 today</strong> to get instant trial access.</li>
                    <li>1st installment is <strong>delayed</strong> to month 2 and paid together with 2nd installment.</li>
                    <li>Student is restricted to watch up to <strong>1/12th of total course video duration per week</strong> and <strong>1/3rd total in Month 1</strong>.</li>
                    <li>Teacher panel will show <strong>0 PKR collected</strong> during the free trial period.</li>
                  </ul>
                </div>
              )}

              {offerType === 'discounted_installment' && (
                <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-700 block">Custom Monthly Installment Price (PKR)</label>
                  <input
                    type="number"
                    value={customInstallment}
                    onChange={(e) => setCustomInstallment(e.target.value)}
                    placeholder={`Default: Rs. ${Math.round(basePrice / 3)}`}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-slate-900 text-sm focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              )}

              {/* Offer Calculation Summary Card */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2 text-xs shadow-md">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Offer Breakdown Preview</div>
                <div className="flex justify-between text-slate-300">
                  <span>Standard Public Price:</span>
                  <span className="font-mono">{formatCurrency(basePrice)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold text-sm pt-2 border-t border-slate-800">
                  <span>Student Offered Price:</span>
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
                className="w-full bg-[#064e3b] hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
              >
                <Send size={18} />
                Generate & Issue Private Offer
              </button>

            </form>
          </div>

          {/* Right Column: Active Private Offers List */}
          <div className="lg:col-span-7 bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Tag className="text-emerald-600" size={22} />
                  Active Private Offers
                </h2>
                <p className="text-xs text-gray-500 mt-1">Total Offers Issued: {offers.length}</p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student email..."
                  className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            {/* List of Offers */}
            {filteredOffers.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-3">
                <Tag size={48} className="mx-auto text-gray-300" />
                <p className="text-sm font-bold text-gray-500">No private offers found matching your query.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {filteredOffers.map((offer) => {
                  const courseObj = courses.find(c => c.slug === offer.course_slug);
                  return (
                    <div
                      key={offer.id}
                      className="bg-gray-50/80 border border-gray-200/80 hover:border-emerald-500/50 p-5 rounded-2xl space-y-3 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-mono text-emerald-700 font-bold block">
                            {offer.student_email}
                          </span>
                          <span className="text-base font-bold text-slate-900">
                            {courseObj ? courseObj.name : offer.course_slug}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          offer.status === 'redeemed' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {offer.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-gray-200">
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Offer Type:</span>
                          <span className="font-bold text-slate-800 capitalize">
                            {offer.offer_type === 'added_discount' && `${offer.discount_percent}% Added Discount`}
                            {offer.offer_type === 'free_month_trial' && `1-Month Free Access (0 PKR)`}
                            {offer.offer_type === 'discounted_installment' && `Custom Monthly Installments`}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Offered Price:</span>
                          <span className="font-mono font-bold text-emerald-700 text-sm">
                            {formatCurrency(offer.custom_total_price)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                        <span>Issued by: <strong className="text-slate-800">{offer.sales_email}</strong></span>
                        <div className="flex items-center gap-3">
                          <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                          <button
                            onClick={() => handleRevokeOffer(offer.id)}
                            className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                            title="Revoke Offer"
                          >
                            <Trash2 size={16} />
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
