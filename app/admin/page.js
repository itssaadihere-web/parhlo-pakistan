"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  CreditCard,
  ChevronRight,
  PlayCircle,
  Star,
  Globe,
  ShieldCheck,
  Users,
  User,
  Plus,
  BookOpen,
  CheckCircle2,
  LogOut,
  Clock,
  Menu,
  BarChart,
  Tag,
  FileSpreadsheet,
  Trash2,
  Search,
  PhoneCall,
  UserCheck,
  TrendingUp,
  Phone,
  MessageSquare,
  History,
  Gift,
  Percent,
  Copy,
  PlusCircle,
  Sparkles,
  AlertCircle,
  Filter,
  Check
} from 'lucide-react';

import { supabase } from '@/utils/supabase';
import InactivityTracker from '@/app/components/InactivityTracker';
import { formatCurrency, parsePrice } from '@/utils/currencyHelpers';
import LeadExcelImporter from '@/app/components/crm/LeadExcelImporter';
import LeadKanbanBoard from '@/app/components/crm/LeadKanbanBoard';
import LeadDetailModal from '@/app/components/crm/LeadDetailModal';


export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminCourses, setAdminCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pendingDeleteCourse, setPendingDeleteCourse] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [editingProfile, setEditingProfile] = useState(null);
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '' });
  const [teacherMessage, setTeacherMessage] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  
  const [adminPhone, setAdminPhone] = useState('');

  // CRM State Variables
  const [crmLeads, setCrmLeads] = useState([]);
  const [crmSearch, setCrmSearch] = useState('');
  const [crmRepFilter, setCrmRepFilter] = useState('all');
  const [salesReps, setSalesReps] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [allActivities, setAllActivities] = useState([]);

  // Sales Rep Management State
  const [newSalesRep, setNewSalesRep] = useState({ name: '', email: '', password: '' });
  const [salesRepMsg, setSalesRepMsg] = useState('');
  const [bulkAssignTarget, setBulkAssignTarget] = useState('round_robin');

  // Private Offers State
  const [salesOffers, setSalesOffers] = useState([]);
  const [offerSearch, setOfferSearch] = useState('');
  const [offerRepFilter, setOfferRepFilter] = useState('all');
  const [offerStatusFilter, setOfferStatusFilter] = useState('all');
  const [offerTypeFilter, setOfferTypeFilter] = useState('all');
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);
  const [newOfferData, setNewOfferData] = useState({
    studentEmail: '',
    courseSlug: '',
    offerType: 'added_discount',
    discountPercent: '5',
    customInstallment: ''
  });
  const [offerFormMsg, setOfferFormMsg] = useState({ type: '', text: '' });
  const [copiedOfferId, setCopiedOfferId] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const admin = window.localStorage.getItem('parhloAdmin') === 'true';
    if (!admin) {
      router.replace('/');
      return;
    }
    setIsAdmin(true);

    fetchData();
    
    // Fetch admin phone from users table
    const fetchAdminProfile = async () => {
      const { data } = await supabase.from('users').select('phone').eq('email', 'parhlo.pakistan.edu@gmail.com').single();
      if (data && data.phone) {
        setAdminPhone(data.phone);
      }
    };
    fetchAdminProfile();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch courses from Supabase
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
    } else {
      setAdminCourses(courses || []);
    }

    // Fetch payments from Supabase 'purchases' table
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (purchasesError) {
      console.error('Error fetching payments:', purchasesError);
    } else if (purchases) {
      // Map purchases to include course names for display
      const mappedPayments = purchases.map(p => {
        const course = (courses || []).find(c => c.slug === p.course_slug);
        
        const originalPrice = parsePrice(course?.price);
        const discountPercent = parseFloat(String(course?.discount || '0').replace(/[^0-9.]/g, '')) || 0;
        const finalPrice = discountPercent > 0 ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice;

        return {
          id: p.id,
          userEmail: p.student_email,
          courseSlug: p.course_slug,
          courseName: course ? course.name : p.course_slug,
          coursePrice: finalPrice,
          status: p.status,
          receiptImage: p.payment_screenshot_url,
          date: new Date(p.created_at).toLocaleDateString(),
          transactionId: 'N/A', // Not explicitly in schema, but can be added
          paymentPlan: p.payment_plan || 'full',
          installmentsPaid: p.installments_paid ?? 1,
          nextDueDate: p.next_due_date || null
        };
      });
      setPayments(mappedPayments);
    }

    // Fetch teachers
    const { data: teachersData, error: teachersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false });
    
    const DEFAULT_TEACHERS = [
      { email: 'farazsohail18@gmail.com', full_name: 'Dr. M Faraz Sohail', role: 'teacher', intro: 'Dr. M. Faraz Sohail — Biology Instructor (Class 9 Sindh Board)' },
      { email: 'vaniya.ahmed.18@gmail.com', full_name: 'Dr. Vaniya Ahmed', role: 'teacher', intro: 'Dr. Vaniya Ahmed — Chemistry Instructor (Class 9 Sindh Board)' },
      { email: 'khadijaaqeelahmed20@gmail.com', full_name: 'Dr. Khadija Aqeel Ahmed', role: 'teacher', intro: 'Dr. Khadija Aqeel — Physics Instructor (Class 9 Sindh Board)' },
      { email: 'muhammadzubair6879@gmail.com', full_name: 'M. Zubair Yousif', role: 'teacher', intro: 'Muhammad Zubair — English Instructor (Class 9 Sindh Board)' },
      { email: 'syedshafaathussain@gmail.com', full_name: 'Syed Shafaat Hussain', role: 'teacher', intro: 'Syed Shafaat Hussain — Mathematics Instructor (Class 9 Sindh Board)' },
      { email: 'abdulrehman@parhlopakistan.com.pk', full_name: 'Abdul Rehman', role: 'teacher', intro: 'Abdul Rehman — Computer Science Instructor (Class 9 Sindh Board)' }
    ];

    let mergedTeachers = teachersData || [];
    for (const dt of DEFAULT_TEACHERS) {
      if (!mergedTeachers.some(t => t.email?.toLowerCase() === dt.email.toLowerCase())) {
        mergedTeachers.push(dt);
      }
    }

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError);
      setTeachers(mergedTeachers);
    } else {
      setTeachers(mergedTeachers);
    }

    // Fetch students
    const { data: studentsData, error: studentsError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    } else {
      setStudents(studentsData || []);
    }

    // Fetch CRM Leads
    let fetchedLeads = [];
    try {
      const { data: dbLeads, error: leadsErr } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (!leadsErr) {
        fetchedLeads = dbLeads || [];
        if (fetchedLeads.length === 0) {
          window.localStorage.removeItem('parhlo_leads');
        }
      } else {
        fetchedLeads = JSON.parse(window.localStorage.getItem('parhlo_leads') || '[]');
      }
    } catch (e) {
      fetchedLeads = JSON.parse(window.localStorage.getItem('parhlo_leads') || '[]');
    }
    setCrmLeads(fetchedLeads);

    // Fetch Sales Reps
    const { data: repsData } = await supabase.from('users').select('*').eq('role', 'sales');
    const defaultReps = [
      { email: 'faiz.ali@parhlopakistan.com.pk', full_name: 'Faiz Ali' },
      { email: 'nabiha.irfan@parhlopakistan.com.pk', full_name: 'Nabiha Irfan' }
    ];
    setSalesReps(repsData && repsData.length > 0 ? repsData : defaultReps);

    // Fetch all Lead Activities for Sales Performance report
    let fetchedActivities = [];
    try {
      const { data: dbAct, error: actErr } = await supabase.from('lead_activities').select('*').order('created_at', { ascending: false });
      if (!actErr && dbAct) {
        fetchedActivities = dbAct;
      }
    } catch (e) {}
    setAllActivities(fetchedActivities);

    // Fetch Private Sales Offers
    let fetchedOffers = [];
    try {
      const { data: dbOffers, error: offerErr } = await supabase
        .from('sales_offers')
        .select('*')
        .order('created_at', { ascending: false });
      if (!offerErr && dbOffers) {
        fetchedOffers = dbOffers;
      } else {
        const local = JSON.parse(window.localStorage.getItem('parhlo_sales_offers') || '[]');
        fetchedOffers = local;
      }
    } catch (e) {
      const local = JSON.parse(window.localStorage.getItem('parhlo_sales_offers') || '[]');
      fetchedOffers = local;
    }

    const localOffers = JSON.parse(typeof window !== 'undefined' ? window.localStorage.getItem('parhlo_sales_offers') || '[]' : '[]');
    const combinedOffersMap = new Map();
    fetchedOffers.forEach(o => combinedOffersMap.set(o.id, o));
    localOffers.forEach(o => {
      if (!combinedOffersMap.has(o.id)) {
        combinedOffersMap.set(o.id, o);
      }
    });
    const finalOffers = Array.from(combinedOffersMap.values()).sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));
    setSalesOffers(finalOffers);

    setLoading(false);
  };

  const handleReassignLead = async (leadId, newRepEmail) => {
    try {
      await supabase.from('leads').update({ assigned_to: newRepEmail, updated_at: new Date().toISOString() }).eq('id', leadId);
    } catch (e) {}
    const updated = crmLeads.map(l => l.id === leadId ? { ...l, assigned_to: newRepEmail } : l);
    setCrmLeads(updated);
    window.localStorage.setItem('parhlo_leads', JSON.stringify(updated));
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await supabase.from('leads').delete().eq('id', leadId);
    } catch (e) {}
    const updated = crmLeads.filter(l => l.id !== leadId);
    setCrmLeads(updated);
    window.localStorage.setItem('parhlo_leads', JSON.stringify(updated));
  };

  const handleClearAllLeads = async () => {
    if (!confirm("Are you sure you want to PURGE ALL LEADS and all activity logs? This action will permanently remove all leads for fresh imports!")) return;

    try {
      await supabase.from('lead_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {}

    setCrmLeads([]);
    setAllActivities([]);
    window.localStorage.removeItem('parhlo_leads');
  };

  const handleRevokeOffer = async (offerId) => {
    if (!confirm("Are you sure you want to revoke/expire this private offer?")) return;
    try {
      await supabase.from('sales_offers').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', offerId);
    } catch (e) {}

    const updated = salesOffers.map(o => o.id === offerId ? { ...o, status: 'expired' } : o);
    setSalesOffers(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('parhlo_sales_offers', JSON.stringify(updated));
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!confirm("Are you sure you want to PERMANENTLY DELETE this offer record?")) return;
    try {
      await supabase.from('sales_offers').delete().eq('id', offerId);
    } catch (e) {}

    const updated = salesOffers.filter(o => o.id !== offerId);
    setSalesOffers(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('parhlo_sales_offers', JSON.stringify(updated));
    }
  };

  const handleCreateAdminOffer = async (e) => {
    e.preventDefault();
    setOfferFormMsg({ type: '', text: '' });

    const { studentEmail, courseSlug, offerType, discountPercent, customInstallment } = newOfferData;

    if (!studentEmail.trim() || !studentEmail.includes('@')) {
      setOfferFormMsg({ type: 'error', text: 'Please enter a valid student email address.' });
      return;
    }

    const effectiveSlug = courseSlug || adminCourses[0]?.slug;
    if (!effectiveSlug) {
      setOfferFormMsg({ type: 'error', text: 'Please select a valid course.' });
      return;
    }

    const selectedCourse = adminCourses.find(c => c.slug === effectiveSlug);
    const rawPrice = selectedCourse ? parsePrice(selectedCourse.price) : 0;
    const standardDiscount = selectedCourse ? (parseFloat(String(selectedCourse.discount || '0').replace(/[^0-9.]/g, '')) || 0) : 0;
    const basePrice = standardDiscount > 0 ? Math.round(rawPrice * (1 - standardDiscount / 100)) : rawPrice;

    let calculatedDiscountedPrice = basePrice;
    let calculatedMonthlyInstallment = Math.round(basePrice / 3);

    if (offerType === 'added_discount') {
      const extraDisc = parseFloat(discountPercent) || 0;
      calculatedDiscountedPrice = Math.max(0, Math.round(basePrice * (1 - extraDisc / 100)));
      calculatedMonthlyInstallment = Math.round(calculatedDiscountedPrice / 3);
    } else if (offerType === 'free_month_trial') {
      calculatedDiscountedPrice = basePrice;
      calculatedMonthlyInstallment = Math.round(basePrice / 3);
    } else if (offerType === 'discounted_installment') {
      calculatedMonthlyInstallment = parseFloat(customInstallment) || Math.round(basePrice / 3);
      calculatedDiscountedPrice = calculatedMonthlyInstallment * 3;
    }

    const newOffer = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'offer_' + Date.now(),
      sales_email: 'admin@parhlopakistan.com.pk (Admin)',
      student_email: studentEmail.trim().toLowerCase(),
      course_slug: effectiveSlug,
      offer_type: offerType,
      discount_percent: offerType === 'added_discount' ? parseFloat(discountPercent) || 0 : 0,
      custom_installment_amount: offerType === 'discounted_installment' ? calculatedMonthlyInstallment : 0,
      custom_total_price: calculatedDiscountedPrice,
      status: 'active',
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('sales_offers').insert([newOffer]);
      if (offerType === 'free_month_trial') {
        const nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const autoPurchase = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'purchase_' + Date.now(),
          student_email: studentEmail.trim().toLowerCase(),
          course_slug: effectiveSlug,
          status: 'approved',
          payment_plan: 'free_trial',
          amount_paid: 0,
          total_price: calculatedDiscountedPrice,
          monthly_installment_amount: calculatedMonthlyInstallment,
          offer_id: newOffer.id,
          next_due_date: nextDueDate,
          created_at: new Date().toISOString()
        };
        await supabase.from('purchases').insert([autoPurchase]);
      }
    } catch (err) {
      console.warn("DB insert fallback to local storage:", err);
    }

    const updatedLocal = [newOffer, ...salesOffers];
    setSalesOffers(updatedLocal);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('parhlo_sales_offers', JSON.stringify(updatedLocal));
    }

    setOfferFormMsg({
      type: 'success',
      text: `Private offer successfully issued to ${studentEmail}!`
    });

    setTimeout(() => {
      setIsCreateOfferModalOpen(false);
      setOfferFormMsg({ type: '', text: '' });
      setNewOfferData({
        studentEmail: '',
        courseSlug: adminCourses[0]?.slug || '',
        offerType: 'added_discount',
        discountPercent: '5',
        customInstallment: ''
      });
    }, 1200);
  };

  const filteredOffers = salesOffers.filter(offer => {
    const matchesSearch =
      !offerSearch ||
      offer.student_email?.toLowerCase().includes(offerSearch.toLowerCase()) ||
      offer.course_slug?.toLowerCase().includes(offerSearch.toLowerCase()) ||
      offer.sales_email?.toLowerCase().includes(offerSearch.toLowerCase());

    const matchesRep =
      offerRepFilter === 'all' ||
      (offerRepFilter === 'admin'
        ? offer.sales_email?.toLowerCase().includes('admin')
        : offer.sales_email?.toLowerCase() === offerRepFilter.toLowerCase());

    const matchesStatus =
      offerStatusFilter === 'all' ||
      (offerStatusFilter === 'active' ? (offer.status === 'active' || !offer.status) : offer.status === offerStatusFilter);

    const matchesType =
      offerTypeFilter === 'all' || offer.offer_type === offerTypeFilter;

    return matchesSearch && matchesRep && matchesStatus && matchesType;
  });

  const handleBulkAssignUnassigned = async () => {
    const unassignedLeads = crmLeads.filter(l => !l.assigned_to);
    if (unassignedLeads.length === 0) {
      alert("No unassigned leads found to assign.");
      return;
    }

    if (!confirm(`Are you sure you want to assign ${unassignedLeads.length} unassigned leads?`)) return;

    let updatedLeads = [...crmLeads];
    const activeReps = salesReps.length > 0 ? salesReps.map(r => r.email) : ['faiz.ali@parhlopakistan.com.pk', 'nabiha.irfan@parhlopakistan.com.pk'];

    if (bulkAssignTarget === 'round_robin') {
      let repIdx = 0;
      for (let lead of unassignedLeads) {
        const assignedTo = activeReps[repIdx % activeReps.length];
        repIdx++;
        try {
          await supabase.from('leads').update({ assigned_to: assignedTo, updated_at: new Date().toISOString() }).eq('id', lead.id);
        } catch (e) {}
        updatedLeads = updatedLeads.map(l => l.id === lead.id ? { ...l, assigned_to: assignedTo } : l);
      }
    } else {
      try {
        const unassignedIds = unassignedLeads.map(l => l.id);
        await supabase.from('leads').update({ assigned_to: bulkAssignTarget, updated_at: new Date().toISOString() }).in('id', unassignedIds);
      } catch (e) {}
      updatedLeads = updatedLeads.map(l => !l.assigned_to ? { ...l, assigned_to: bulkAssignTarget } : l);
    }

    setCrmLeads(updatedLeads);
    window.localStorage.setItem('parhlo_leads', JSON.stringify(updatedLeads));
    alert(`Successfully assigned ${unassignedLeads.length} leads!`);
  };

  const handleAddSalesRep = async () => {
    if (!newSalesRep.name || !newSalesRep.email || !newSalesRep.password) {
      setSalesRepMsg('Please fill all fields.');
      return;
    }

    setSalesRepMsg('Creating Sales Representative account...');

    const emailClean = newSalesRep.email.trim().toLowerCase();

    // 1. Sign up in Supabase Auth
    try {
      await supabase.auth.signUp({
        email: emailClean,
        password: newSalesRep.password,
        options: {
          data: {
            full_name: newSalesRep.name,
            role: 'sales'
          }
        }
      });
    } catch (e) {}

    // 2. Upsert in public.users
    const newRepObj = {
      email: emailClean,
      full_name: newSalesRep.name,
      role: 'sales',
      password: newSalesRep.password
    };

    try {
      await supabase.from('users').upsert([newRepObj], { onConflict: 'email' });
    } catch (dbErr) {
      console.warn("DB update fallback:", dbErr);
    }

    const updatedReps = [...salesReps.filter(r => r.email !== emailClean), newRepObj];
    setSalesReps(updatedReps);

    setSalesRepMsg('Sales Representative successfully created!');
    setNewSalesRep({ name: '', email: '', password: '' });
    setTimeout(() => setSalesRepMsg(''), 4000);
  };

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

  const handleDeleteCourse = (course) => {
    setPendingDeleteCourse(course);
  };

  const confirmDeleteCourse = async () => {
    if (!pendingDeleteCourse) return;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('slug', pendingDeleteCourse.slug);

    if (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course from database.');
    } else {
      setAdminCourses(adminCourses.filter((course) => course.slug !== pendingDeleteCourse.slug));
    }

    setPendingDeleteCourse(null);
  };

  const cancelDeleteCourse = () => {
    setPendingDeleteCourse(null);
  };

  const handleApprovePayment = async (paymentId) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    let updatePayload = { status: 'approved' };
    let newInstallmentsPaid = payment.installmentsPaid;
    let newNextDueDate = payment.nextDueDate;

    if (payment.paymentPlan === 'installment') {
      newInstallmentsPaid += 1;
      if (newInstallmentsPaid < 3) {
        // Set next due date to 30 days from now
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30);
        newNextDueDate = nextDate.toISOString();
      } else {
        newNextDueDate = null; // Fully paid
      }
      updatePayload.installments_paid = newInstallmentsPaid;
      updatePayload.next_due_date = newNextDueDate;
    }

    const { error } = await supabase
      .from('purchases')
      .update(updatePayload)
      .eq('id', paymentId);

    if (error) {
      console.error('Error approving payment:', error);
      alert('Failed to approve payment in database.');
      return;
    } 

    if (payment.courseSlug) {
      // Fetch current course student count
      const { data: courseData } = await supabase
        .from('courses')
        .select('students')
        .eq('slug', payment.courseSlug)
        .single();
        
      if (courseData) {
        const currentStudents = parseInt(courseData.students) || 0;
        await supabase
          .from('courses')
          .update({ students: String(currentStudents + 1) })
          .eq('slug', payment.courseSlug);
      }
    }

    const updatedPayments = payments.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'approved',
          installmentsPaid: newInstallmentsPaid,
          nextDueDate: newNextDueDate
        };
      }
      return p;
    });
    setPayments(updatedPayments);
  };

  const handleToggleAccess = async (paymentId, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'suspended' : 'approved';
    const action = newStatus === 'suspended' ? 'suspend' : 'resume';
    if (!window.confirm(`Are you sure you want to ${action} this student's access to this course?`)) return;

    const { error } = await supabase
      .from('purchases')
      .update({ status: newStatus })
      .eq('id', paymentId);

    if (error) {
      alert(`Failed to ${action} access`);
      return;
    }

    const updatedPayments = payments.map(p => p.id === paymentId ? { ...p, status: newStatus } : p);
    setPayments(updatedPayments);

    setViewingStudent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        activeCourses: prev.activeCourses.map(c => c.id === paymentId ? { ...c, status: newStatus } : c)
      };
    });
  };

  const handleRevokeAccess = async (paymentId) => {
    if (!window.confirm("Are you sure you want to completely remove this student's access to this course?")) return;

    const payment = payments.find(p => p.id === paymentId);
    
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', paymentId);

    if (error) {
      alert("Failed to remove access");
      return;
    }

    // Do not decrement the course student count as requested by the user.

    const updatedPayments = payments.filter(p => p.id !== paymentId);
    setPayments(updatedPayments);
    
    // Update viewingStudent state live
    setViewingStudent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        activeCourses: prev.activeCourses.filter(c => c.id !== paymentId)
      };
    });
  };

  if (!isAdmin) return null;

  const pendingApprovals = payments.filter(p => p.status === 'pending');
  const approvedPayments = payments.filter(p => p.status === 'approved');

  const getEnrollments = () => {
    let studentEmails = [...new Set(payments.filter(p => ['approved', 'suspended'].includes(p.status)).map(p => p.userEmail))];
    studentEmails = studentEmails.filter(email => email !== 'parhlo.pakistan.edu@gmail.com');
    return studentEmails.map(email => {
      const studentPayments = payments.filter(p => p.userEmail === email);
      return {
        email,
        activeCourses: studentPayments.filter(p => ['approved', 'suspended'].includes(p.status)),
        pendingCourses: studentPayments.filter(p => p.status === 'pending')
      };
    });
  };

  const menuItems = [
    { name: 'Dashboard', icon: <Globe size={20} />, id: 'dashboard' },
    { name: 'CRM Kanban & Leads', icon: <FileSpreadsheet size={20} />, id: 'crm' },
    { name: 'Sales Team & Reps', icon: <UserCheck size={20} />, id: 'sales_team' },
    { name: 'Sales Performance', icon: <TrendingUp size={20} />, id: 'sales_performance' },
    { name: 'Private Offers', icon: <Tag size={20} />, id: 'sales' },
    { name: 'Study Analytics', icon: <BarChart size={20} />, id: 'analytics' },
    { name: 'Teachers', icon: <User size={20} />, id: 'teachers' },
    { name: 'Students', icon: <Users size={20} />, id: 'students' },
    { name: 'Subjects', icon: <PlayCircle size={20} />, id: 'courses' },
    { name: 'Enrollments', icon: <BookOpen size={20} />, id: 'enrollments' },
    { name: 'Payments', icon: <CreditCard size={20} />, id: 'payments' },
    { name: 'Settings', icon: <ShieldCheck size={20} />, id: 'settings' }
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <InactivityTracker onLogout={handleLogout} timeoutMs={15 * 60 * 1000} />
      
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="h-10 logo-outline" />
          </Link>
          <span className="font-bold text-green-800">Admin</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setAdminTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${adminTab === item.id ? 'bg-[#064e3b] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {item.icon} {item.name}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="m-6 flex items-center gap-3 px-4 py-3 text-gray-500 font-bold text-sm hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={20} /> Sign Out
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen relative">
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
              <div className="p-6 flex items-center gap-3">
                <Link href="/">
                  <img src="/logo.png" alt="Logo" className="h-10 logo-outline" />
                </Link>
                <span className="font-bold text-green-800">Admin</span>
              </div>
              <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setAdminTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${adminTab === item.id ? 'bg-[#064e3b] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {item.icon} {item.name}
                  </button>
                ))}
              </nav>
              <button onClick={handleLogout} className="m-6 flex items-center gap-3 px-4 py-3 text-gray-500 font-bold text-sm hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut size={20} /> Sign Out
              </button>
            </aside>
          </div>
        )}
        {adminTab === 'dashboard' && (
          <>
            <header className="mb-10">
              <h1 className="text-3xl font-black text-slate-900">Dashboard Overview</h1>
              <p className="text-gray-500 font-medium">Welcome back. Here's what's happening today.</p>
            </header>

            <div className="grid grid-cols-4 gap-6 mb-10">
              {[
                { label: 'Total Revenue', val: formatCurrency(approvedPayments.reduce((sum, p) => sum + (p.coursePrice || 0), 0)), color: 'bg-green-50 text-green-600' },
                { label: 'Total Students', val: approvedPayments.length, color: 'bg-blue-50 text-blue-600' },
                { label: 'Active Subjects', val: String(adminCourses.length), color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Pending Approvals', val: String(pendingApprovals.length), color: 'bg-amber-50 text-amber-600' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm">
                  <div className={`p-4 rounded-2xl ${stat.color}`}><CreditCard size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{stat.label}</p>
                    <p className="text-xl font-black text-gray-900">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="bg-[#064e3b] rounded-[2.5rem] p-10 text-white flex flex-col justify-between">
                <div>
                  <PlayCircle size={40} className="mb-6 opacity-80" />
                  <h2 className="text-xl font-bold mb-2">Pending Approvals</h2>
                  <p className="text-5xl font-black mb-4">{pendingApprovals.length}</p>
                  <p className="text-emerald-200/60 text-sm font-medium">Payments waiting for verification.</p>
                </div>
                <button onClick={() => setAdminTab('payments')} className="w-full bg-white text-[#064e3b] py-4 rounded-2xl font-black mt-8 hover:bg-emerald-50 transition-all">
                  Review Payments
                </button>
              </div>

              <div className="col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                <h3 className="text-xl font-black mb-6">Recent Activity</h3>
                <div className="space-y-6">
                  {payments.slice(-4).reverse().map((activity, i) => (
                    <div key={i} className="flex justify-between items-center pb-6 border-b border-gray-50 last:border-0">
                      <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {activity.status === 'approved' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">
                            {activity.status === 'approved' ? 'Payment Approved' : `Payment Pending — TID: ${activity.transactionId}`}
                          </p>
                          <p className="text-xs text-gray-400">{activity.userEmail} • {activity.courseName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-gray-400">{activity.date}</span>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No recent activity found.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {adminTab === 'crm' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900">CRM Kanban Board & Lead Management</h1>
                <p className="text-gray-500 mt-1 text-sm">Upload Excel student lead sheets, manage visual pipeline stages, and reassign leads across sales representatives.</p>
              </div>
              <button
                onClick={handleClearAllLeads}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-md flex items-center gap-2 self-start uppercase tracking-wider"
              >
                <Trash2 size={16} /> Purge All System Leads
              </button>
            </div>

            {/* Excel Sheet Importer Component */}
            <LeadExcelImporter
              salesReps={salesReps}
              onImportSuccess={(newLeads) => setCrmLeads([...newLeads, ...crmLeads])}
            />

            {/* Bulk Unassigned Leads Assignment Tool */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
                    <UserCheck className="text-amber-600" size={24} />
                    Assign Unassigned Leads ({crmLeads.filter(l => !l.assigned_to).length} Pending)
                  </h2>
                  <p className="text-xs text-amber-800 mt-1">Bulk-assign all pending unassigned leads to any active sales representative or equal round-robin.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-5 rounded-2xl border border-amber-200">
                <div className="flex-1 w-full">
                  <label className="font-bold text-gray-700 text-xs block mb-1">Target Representative / Strategy:</label>
                  <select
                    value={bulkAssignTarget}
                    onChange={(e) => setBulkAssignTarget(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-slate-900 font-bold"
                  >
                    <option value="round_robin">Equal Round-Robin Auto-Distribute across all reps</option>
                    {salesReps.map((r, i) => (
                      <option key={i} value={r.email}>Assign all unassigned to: {r.full_name || r.email} ({r.email})</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleBulkAssignUnassigned}
                  disabled={crmLeads.filter(l => !l.assigned_to).length === 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-3.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 self-end w-full sm:w-auto justify-center"
                >
                  <UserCheck size={16} /> Assign {crmLeads.filter(l => !l.assigned_to).length} Unassigned Leads
                </button>
              </div>
            </div>

            {/* Visual Sales Pipeline Kanban Board */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={24} />
                Visual Sales Pipeline (Kanban Board)
              </h2>

              <LeadKanbanBoard
                leads={crmLeads}
                currentUser={{ role: 'admin', isAdmin: true }}
                salesReps={salesReps}
                onSelectLead={(lead) => setSelectedLead(lead)}
                onOpenImporter={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
            </div>

            {/* Sales Rep Workload Distribution Cards */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Users className="text-emerald-600" size={24} />
                Sales Representative Workload & Distribution Summary
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
                  <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider mb-1">Total System Leads</div>
                  <div className="text-3xl font-black text-emerald-950">{crmLeads.length}</div>
                </div>

                {salesReps.map((rep, idx) => {
                  const repCount = crmLeads.filter(l => l.assigned_to?.toLowerCase() === rep.email.toLowerCase()).length;
                  return (
                    <div key={idx} className="bg-gray-50 border border-gray-200 p-5 rounded-2xl">
                      <div className="text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1">
                        {rep.full_name || rep.email.split('@')[0]}
                      </div>
                      <div className="text-2xl font-black text-slate-900">{repCount} Leads</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">{rep.email}</div>
                    </div>
                  );
                })}

                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                  <div className="text-[10px] font-black uppercase text-amber-800 tracking-wider mb-1">Unassigned Leads Pool</div>
                  <div className="text-2xl font-black text-amber-950">
                    {crmLeads.filter(l => !l.assigned_to).length} Leads
                  </div>
                </div>
              </div>
            </div>

            {/* All Leads Management & Re-assignment Table */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Users className="text-emerald-600" size={24} />
                  Re-assign & Manage Leads ({crmLeads.length})
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={crmSearch}
                      onChange={(e) => setCrmSearch(e.target.value)}
                      placeholder="Search leads..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    />
                  </div>

                  <select
                    value={crmRepFilter}
                    onChange={(e) => setCrmRepFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                  >
                    <option value="all">All Sales Reps</option>
                    <option value="unassigned">Unassigned Only</option>
                    {salesReps.map((r, i) => (
                      <option key={i} value={r.email}>{r.full_name || r.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Lead Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Stage</th>
                      <th className="p-3">Assigned Sales Rep</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-900 font-medium">
                    {crmLeads
                      .filter(l => {
                        const matchSearch = l.name?.toLowerCase().includes(crmSearch.toLowerCase()) ||
                          l.phone?.includes(crmSearch) ||
                          l.email?.toLowerCase().includes(crmSearch.toLowerCase());
                        if (!matchSearch) return false;

                        if (crmRepFilter === 'unassigned') return !l.assigned_to;
                        if (crmRepFilter !== 'all') return l.assigned_to?.toLowerCase() === crmRepFilter.toLowerCase();
                        return true;
                      })
                      .map((lead, idx) => (
                        <tr key={lead.id || `admin_lead_${idx}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                          <td className="p-3 font-mono text-gray-400">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{lead.name}</td>
                          <td className="p-3 font-mono text-emerald-700">{lead.phone}</td>
                          <td className="p-3 font-mono text-gray-500">{lead.email || '—'}</td>
                          <td className="p-3 capitalize">
                            <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              {lead.status || 'new'}
                            </span>
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.assigned_to || ''}
                              onChange={(e) => handleReassignLead(lead.id, e.target.value)}
                              className="bg-white border border-gray-200 rounded-lg p-1.5 text-xs text-slate-900 font-medium focus:border-emerald-600"
                            >
                              <option value="">Unassigned</option>
                              {salesReps.map((r, i) => (
                                <option key={i} value={r.email}>{r.full_name || r.email}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                              title="Delete Lead"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SALES TEAM & REPS MANAGEMENT */}
        {adminTab === 'sales_team' && (
          <div className="space-y-8">
            <header className="mb-6">
              <h1 className="text-3xl font-black text-slate-900 mb-1">Sales Team & Representatives</h1>
              <p className="text-gray-500 font-medium text-xs">Create new Sales Representative login credentials, manage active reps, and monitor assigned lead workloads.</p>
            </header>

            {/* Add New Sales Representative Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="text-emerald-600" size={22} />
                Add New Sales Representative Account
              </h2>

              {salesRepMsg && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
                  salesRepMsg.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <div>{salesRepMsg}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newSalesRep.name}
                    onChange={(e) => setNewSalesRep({ ...newSalesRep, name: e.target.value })}
                    placeholder="e.g. Faiz Ali"
                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newSalesRep.email}
                    onChange={(e) => setNewSalesRep({ ...newSalesRep, email: e.target.value })}
                    placeholder="e.g. faiz.ali@parhlopakistan.com.pk"
                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    value={newSalesRep.password}
                    onChange={(e) => setNewSalesRep({ ...newSalesRep, password: e.target.value })}
                    placeholder="Enter login password"
                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                onClick={handleAddSalesRep}
                className="bg-[#064e3b] hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Create Sales Representative Account
              </button>
            </div>

            {/* Active Sales Representatives List */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-emerald-600" size={22} />
                Active Sales Representatives ({salesReps.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-4">Sales Representative</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Assigned Leads</th>
                      <th className="p-4 text-right">Role Badge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-900 font-medium">
                    {salesReps.map((rep, idx) => {
                      const repLeadsCount = crmLeads.filter(l => l.assigned_to?.toLowerCase() === rep.email.toLowerCase()).length;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-slate-900 text-sm">
                            {rep.full_name || rep.email.split('@')[0]}
                          </td>
                          <td className="p-4 font-mono text-emerald-700">{rep.email}</td>
                          <td className="p-4 font-bold font-mono text-slate-900">{repLeadsCount} Leads</td>
                          <td className="p-4 text-right">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
                              Sales Representative
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SALES PERFORMANCE REPORT */}
        {adminTab === 'sales_performance' && (
          <div className="space-y-8">
            <header className="mb-6">
              <h1 className="text-3xl font-black text-slate-900 mb-1">Sales Team Performance & Activity Audit</h1>
              <p className="text-gray-500 font-medium text-xs">Monitor lead conversion rates, calls logged, WhatsApp messages, and activity audit trails per sales representative.</p>
            </header>

            {/* Performance Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-blue-50 text-blue-600"><Users size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Total System Leads</p>
                  <p className="text-2xl font-black text-slate-900">{crmLeads.length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600"><Phone size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Total Activities Logged</p>
                  <p className="text-2xl font-black text-slate-900">{allActivities.length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-purple-50 text-purple-600"><CheckCircle2 size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Converted Students</p>
                  <p className="text-2xl font-black text-slate-900">
                    {crmLeads.filter(l => l.status === 'converted').length}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-amber-50 text-amber-600"><TrendingUp size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Overall Conversion Rate</p>
                  <p className="text-2xl font-black text-slate-900">
                    {crmLeads.length > 0 ? ((crmLeads.filter(l => l.status === 'converted').length / crmLeads.length) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
              </div>
            </div>

            {/* Sales Rep Detailed Performance Matrix Table */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-emerald-600" size={24} />
                Sales Representative Performance Breakdown
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-4">Sales Representative</th>
                      <th className="p-4">Assigned Leads</th>
                      <th className="p-4">Contacted</th>
                      <th className="p-4">Interested</th>
                      <th className="p-4">Demo / Trial</th>
                      <th className="p-4">Converted</th>
                      <th className="p-4">Calls / WhatsApp Logged</th>
                      <th className="p-4 text-right">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-900 font-medium">
                    {salesReps.map((rep, idx) => {
                      const repLeads = crmLeads.filter(l => l.assigned_to?.toLowerCase() === rep.email.toLowerCase());
                      const contactedCount = repLeads.filter(l => l.status === 'contacted').length;
                      const interestedCount = repLeads.filter(l => l.status === 'interested').length;
                      const demoCount = repLeads.filter(l => l.status === 'demo_scheduled').length;
                      const convertedCount = repLeads.filter(l => l.status === 'converted').length;
                      const repActs = allActivities.filter(a => a.sales_email?.toLowerCase() === rep.email.toLowerCase());
                      const rate = repLeads.length > 0 ? ((convertedCount / repLeads.length) * 100).toFixed(1) : '0.0';

                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-4 font-bold">
                            <span className="block text-slate-900 text-sm">{rep.full_name || rep.email.split('@')[0]}</span>
                            <span className="text-[11px] text-gray-400 font-mono">{rep.email}</span>
                          </td>
                          <td className="p-4 font-bold font-mono text-slate-900">{repLeads.length}</td>
                          <td className="p-4 text-amber-700 font-bold">{contactedCount}</td>
                          <td className="p-4 text-indigo-700 font-bold">{interestedCount}</td>
                          <td className="p-4 text-purple-700 font-bold">{demoCount}</td>
                          <td className="p-4 text-emerald-700 font-bold">{convertedCount}</td>
                          <td className="p-4 font-mono text-gray-600">{repActs.length} Activities</td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-700 text-sm">{rate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Activity Audit Trail Stream */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <History className="text-emerald-600" size={24} />
                Live Sales Activity Stream & Audit Trail ({allActivities.length})
              </h2>

              {allActivities.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-6">No call logs or sales activities recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {allActivities.slice(0, 10).map((act) => (
                    <div key={act.id} className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="capitalize text-emerald-700 font-mono font-bold">{act.activity_type}</span>
                          {act.call_status && <span className="text-gray-400">({act.call_status})</span>}
                          <span className="text-gray-400 font-normal">by</span>
                          <span className="text-slate-800">{act.sales_email}</span>
                        </div>
                        <p className="text-gray-600 font-medium mt-1">{act.notes}</p>
                      </div>
                      <div className="text-right font-mono text-[10px] text-gray-400">
                        {new Date(act.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {adminTab === 'sales' && (
          <div className="space-y-8">
            {/* Top Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-slate-900">Sales & Private Offers</h1>
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold">
                    {salesOffers.length} Total Issued
                  </span>
                </div>
                <p className="text-gray-500 mt-1">
                  Audit trail and control panel for private student discounts generated by Sales Reps (Faiz & Nabiha) and Admin.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <button
                  onClick={() => {
                    setNewOfferData(prev => ({ ...prev, courseSlug: adminCourses[0]?.slug || '' }));
                    setIsCreateOfferModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  <PlusCircle size={18} /> Issue Admin Private Offer
                </button>
                <Link
                  href="/sales"
                  target="_blank"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-md flex items-center gap-2 transition-all"
                >
                  <Tag size={18} /> Open Sales Portal
                </Link>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Tag size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Offers</p>
                  <h3 className="text-2xl font-black text-slate-900">{salesOffers.length}</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Issued across all channels</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                  <Sparkles size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Offers</p>
                  <h3 className="text-2xl font-black text-blue-600">
                    {salesOffers.filter(o => o.status === 'active' || !o.status).length}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">Ready for student checkout</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                  <Gift size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Redeemed Offers</p>
                  <h3 className="text-2xl font-black text-purple-600">
                    {salesOffers.filter(o => o.status === 'redeemed').length}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">Converted into enrollments</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                  <Percent size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Issuers</p>
                  <h3 className="text-2xl font-black text-amber-600">
                    {Array.from(new Set(salesOffers.map(o => o.sales_email?.toLowerCase()))).filter(Boolean).length} Issuers
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">Faiz Ali, Nabiha & Admin</p>
                </div>
              </div>
            </div>

            {/* Sales Team Discount Controls Info Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
                <div className="p-3 bg-emerald-600 text-white rounded-xl"><Tag size={24} /></div>
                <div>
                  <h3 className="font-bold text-emerald-950 text-sm">Sales Team Policy & Limits</h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Authorized Sales Representatives (Faiz Ali & Nabiha Irfan) can issue up to 5% added discount, 1-Month Free Access (delayed 1st installment), or custom installment rates. Admin can issue custom discounts without limits.
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={offerSearch}
                    onChange={(e) => setOfferSearch(e.target.value)}
                    placeholder="Search by student email, course, or sales rep..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Rep Filter */}
                  <select
                    value={offerRepFilter}
                    onChange={(e) => setOfferRepFilter(e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Sales Issuers (Who)</option>
                    <option value="faiz.ali@parhlopakistan.com.pk">Faiz Ali</option>
                    <option value="nabiha.irfan@parhlopakistan.com.pk">Nabiha Irfan</option>
                    <option value="admin">Admin Issued Only</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={offerStatusFilter}
                    onChange={(e) => setOfferStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="redeemed">Redeemed Only</option>
                    <option value="expired">Expired / Revoked</option>
                  </select>

                  {/* Type Filter */}
                  <select
                    value={offerTypeFilter}
                    onChange={(e) => setOfferTypeFilter(e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Offer Types (How)</option>
                    <option value="added_discount">Added Discount (%)</option>
                    <option value="free_month_trial">1-Month Free Access</option>
                    <option value="discounted_installment">Discounted Installment</option>
                  </select>
                </div>
              </div>

              {/* Main Detailed Offers Table: Whom, Which, Who, When, How Issued */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] uppercase font-black text-gray-400 bg-gray-50/50">
                      <th className="py-3.5 px-4 rounded-l-xl">WHOM (Student Recipient)</th>
                      <th className="py-3.5 px-4">WHICH (Course Target)</th>
                      <th className="py-3.5 px-4">WHO (Issued By)</th>
                      <th className="py-3.5 px-4">WHEN (Date & Time)</th>
                      <th className="py-3.5 px-4">HOW ISSUED (Offer Details)</th>
                      <th className="py-3.5 px-4 text-center">STATUS</th>
                      <th className="py-3.5 px-4 text-right rounded-r-xl">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredOffers.map((offer) => {
                      const matchedCourse = adminCourses.find(c => c.slug === offer.course_slug);
                      const courseTitle = matchedCourse ? matchedCourse.name : offer.course_slug;
                      const rawPrice = matchedCourse ? parsePrice(matchedCourse.price) : 0;
                      
                      const isFaiz = offer.sales_email?.toLowerCase().includes('faiz');
                      const isNabiha = offer.sales_email?.toLowerCase().includes('nabiha');
                      const isAdminIssuer = offer.sales_email?.toLowerCase().includes('admin');

                      const issuerName = isFaiz ? 'Faiz Ali' : isNabiha ? 'Nabiha Irfan' : isAdminIssuer ? 'Admin Portal' : offer.sales_email;

                      const createdDate = new Date(offer.created_at || Date.now());
                      const dateFormatted = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      const timeFormatted = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <tr key={offer.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* WHOM */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                                {offer.student_email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block font-mono text-xs">{offer.student_email}</span>
                                {(() => {
                                  const isRegistered = students.some(s => s.email?.toLowerCase() === offer.student_email?.toLowerCase());
                                  const hasPaid = payments.some(p => 
                                    p.userEmail?.toLowerCase() === offer.student_email?.toLowerCase() && 
                                    (p.courseSlug || '').trim().toLowerCase() === (offer.course_slug || '').trim().toLowerCase() && 
                                    (p.amount_paid > 0 || (p.status === 'approved' && p.paymentPlan !== 'free_trial'))
                                  );

                                  if (isRegistered && hasPaid) {
                                    return <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">Enrolled (Paid)</span>;
                                  } else if (isRegistered) {
                                    return <span className="text-[10px] text-cyan-800 font-bold bg-cyan-100 px-1.5 py-0.5 rounded">Signed In</span>;
                                  } else {
                                    return <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">Prospect Lead</span>;
                                  }
                                })()}
                              </div>
                            </div>
                          </td>

                          {/* WHICH */}
                          <td className="py-4 px-4">
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">{courseTitle}</span>
                              <span className="text-[11px] text-gray-500 font-mono">
                                Base: {formatCurrency(rawPrice)}
                              </span>
                            </div>
                          </td>

                          {/* WHO */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                                isFaiz ? 'bg-blue-100 text-blue-800' : isNabiha ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                <User size={12} />
                                {issuerName}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 block font-mono mt-0.5">{offer.sales_email}</span>
                          </td>

                          {/* WHEN */}
                          <td className="py-4 px-4">
                            <div className="text-xs">
                              <span className="font-bold text-slate-900 block">{dateFormatted}</span>
                              <span className="text-gray-400 font-mono text-[11px] block">{timeFormatted}</span>
                            </div>
                          </td>

                          {/* HOW ISSUED */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {offer.offer_type === 'added_discount' && (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-xs">
                                    <Percent size={12} /> {offer.discount_percent}% Extra Discount
                                  </span>
                                  <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                    Offer Price: <span className="text-emerald-600 font-black">{formatCurrency(offer.custom_total_price)}</span>
                                  </span>
                                </div>
                              )}

                              {offer.offer_type === 'free_month_trial' && (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-black text-xs">
                                    <Gift size={12} /> 1-Month Free Access
                                  </span>
                                  <span className="block text-[11px] text-gray-500 font-medium mt-0.5">
                                    Pay 1st installment after 30 days
                                  </span>
                                </div>
                              )}

                              {offer.offer_type === 'discounted_installment' && (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-xs">
                                    <CreditCard size={12} /> Discounted Monthly Installment
                                  </span>
                                  <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                    Rate: <span className="text-blue-600 font-black">Rs. {offer.custom_installment_amount?.toLocaleString()} / mo</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="py-4 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              offer.status === 'redeemed' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              offer.status === 'expired' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {offer.status || 'active'}
                            </span>
                          </td>

                          {/* ACTIONS */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  const text = `Private Offer Details:\nTarget Student: ${offer.student_email}\nCourse: ${courseTitle}\nIssued By: ${issuerName}\nOffer Details: ${
                                    offer.offer_type === 'added_discount' ? `${offer.discount_percent}% Discount (Rs. ${offer.custom_total_price})` :
                                    offer.offer_type === 'free_month_trial' ? '1-Month Free Access' :
                                    `Rs. ${offer.custom_installment_amount}/mo Installments`
                                  }`;
                                  navigator.clipboard.writeText(text);
                                  setCopiedOfferId(offer.id);
                                  setTimeout(() => setCopiedOfferId(null), 2000);
                                }}
                                title="Copy offer details"
                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
                              >
                                {copiedOfferId === offer.id ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
                              </button>

                              {offer.status !== 'expired' && offer.status !== 'redeemed' && (
                                <button
                                  onClick={() => handleRevokeOffer(offer.id)}
                                  title="Revoke / Expire Offer"
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition-colors"
                                >
                                  Revoke
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteOffer(offer.id)}
                                title="Delete Record"
                                className="p-2 hover:bg-rose-50 rounded-xl text-rose-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredOffers.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-gray-400">
                          <Tag size={36} className="mx-auto mb-2 opacity-30" />
                          <p className="font-bold text-slate-700">No private offers found matching criteria.</p>
                          <p className="text-xs text-gray-400 mt-1">Offers generated by Faiz Ali, Nabiha Irfan, or Admin will appear here.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'analytics' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900">Student Study Performance & Watch Analytics</h1>
              <p className="text-gray-500 mt-1">Monitor study hours, completion rates, and free trial 1/12th watch limits for all enrolled students.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase font-black text-gray-400">
                      <th className="pb-4">Student Email</th>
                      <th className="pb-4">Enrolled Course</th>
                      <th className="pb-4">Plan Type</th>
                      <th className="pb-4">Hours Watched</th>
                      <th className="pb-4">1/12th Trial Status</th>
                      <th className="pb-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                    {payments.filter(p => p.status === 'approved').map(p => {
                      const key = `parhlo_watch_${p.userEmail}_${p.courseSlug}`;
                      let watchMap = {};
                      try {
                        watchMap = JSON.parse(window.localStorage.getItem(key) || '{}');
                      } catch (e) {}
                      const totalSec = Object.values(watchMap).reduce((a, b) => a + (Number(b) || 0), 0);
                      const hrs = (totalSec / 3600).toFixed(1);
                      const mins = Math.round(totalSec / 60);

                      const now = new Date();
                      const startOfYear = new Date(now.getFullYear(), 0, 1);
                      const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
                      const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
                      const currentWeekId = `${now.getFullYear()}_W${weekNum}`;

                      const weekKey = `parhlo_weekly_${p.userEmail}_${p.courseSlug}`;
                      let weeklySec = 0;
                      try {
                        const weeklyMap = JSON.parse(window.localStorage.getItem(weekKey) || '{}');
                        weeklySec = Number(weeklyMap[currentWeekId]) || 0;
                      } catch (e) {}

                      const courseObj = adminCourses.find(c => c.slug === p.courseSlug);
                      const totalLectures = courseObj?.lectures?.length || 1;
                      const estimatedCourseSec = totalLectures * 25 * 60;
                      const weeklyLimitSec = Math.round(estimatedCourseSec / 12);
                      const oneMonthLimitSec = Math.round(estimatedCourseSec / 3);

                      const isFreeTrial = p.paymentPlan === 'free_trial';
                      const isFullPlan = p.paymentPlan === 'full';
                      const isWeeklyQuotaMet = !isFullPlan && weeklySec >= weeklyLimitSec;
                      const isMonthTrialEnded = isFreeTrial && totalSec >= oneMonthLimitSec;

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="py-4 font-bold text-slate-900">{p.userEmail}</td>
                          <td className="py-4 text-gray-600">{p.courseName}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isFreeTrial ? 'bg-purple-100 text-purple-800' : isFullPlan ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isFreeTrial ? '1-Month Free Access' : `${p.paymentPlan} Plan`}
                            </span>
                          </td>
                          <td className="py-4 font-mono font-bold text-slate-900">{hrs} hrs ({mins} mins)</td>
                          <td className="py-4">
                            {isFullPlan ? (
                              <span className="text-xs font-bold text-emerald-600">Full Unrestricted Access</span>
                            ) : (
                              <div className="space-y-0.5 text-xs">
                                <span className={`block font-bold ${isWeeklyQuotaMet ? 'text-amber-600' : 'text-slate-700'}`}>
                                  Weekly: {Math.round(weeklySec / 60)}m / {Math.round(weeklyLimitSec / 60)}m {isWeeklyQuotaMet && '(Pace Met)'}
                                </span>
                                {isFreeTrial && (
                                  <span className={`block font-bold ${isMonthTrialEnded ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    Free Trial 1/3rd: {mins}m / {Math.round(oneMonthLimitSec / 60)}m {isMonthTrialEnded && '(Ended)'}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-4 text-right font-bold text-emerald-600 uppercase text-xs">
                            {p.status}
                          </td>
                        </tr>
                      );
                    })}
                    {payments.filter(p => p.status === 'approved').length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-400">No approved student enrollments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'courses' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900">Course Manager</h1>
                <p className="text-gray-500 mt-2">Manage all courses listed on the site, add new entries, or remove outdated ones.</p>
              </div>
              <Link
                href="/admin/add-course"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full font-black hover:bg-green-700 transition-all"
              >
                <Plus size={16} /> Add New Course
              </Link>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
              <div className="grid grid-cols-12 gap-4 bg-gray-50 px-6 py-4 text-xs uppercase tracking-[0.2em] text-gray-500">
                <div className="col-span-3">Course</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Instructor</div>
                <div className="col-span-1">Level</div>
                <div className="col-span-2 text-right">Action</div>
              </div>
              {adminCourses.map((course) => (
                <div key={course.slug} className="grid grid-cols-12 gap-4 px-6 py-5 border-t border-gray-100 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-3 font-bold text-slate-900">{course.name}</div>
                  <div className="col-span-2 text-gray-500">{course.category}</div>
                  <div className="col-span-2 text-gray-500">{formatCurrency(course.price)}</div>
                  <div className="col-span-2 text-gray-500">{course.instructor}</div>
                  <div className="col-span-1 text-gray-500">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{course.level}</span>
                  </div>
                  <div className="col-span-2 text-right flex gap-3 justify-end items-center">
                    <Link
                      href={`/admin/edit-course/${course.slug}`}
                      className="text-blue-600 font-bold hover:text-blue-800 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteCourse(course)}
                      className="text-red-600 font-bold hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {adminCourses.length === 0 && (
                <div className="p-8 text-center text-gray-500">No courses available. Add one above.</div>
              )}
            </div>

            {pendingDeleteCourse && (
              <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8">
                  <h2 className="text-2xl font-black text-slate-900 mb-3">Confirm delete</h2>
                  <p className="text-gray-500 mb-8">Do you want to delete <span className="font-bold text-slate-900">{pendingDeleteCourse.name}</span> from the course list?</p>
                  <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
                    <button
                      onClick={cancelDeleteCourse}
                      className="w-full sm:w-auto px-6 py-3 rounded-full border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      No
                    </button>
                    <button
                      onClick={confirmDeleteCourse}
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-red-600 text-white font-black hover:bg-red-700 transition-all"
                    >
                      Yes, delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'payments' && (
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Payment Approvals</h1>
            <p className="text-gray-500 mb-8">Review submitted receipts and approve access for students.</p>

            <div className="space-y-4">
              {pendingApprovals.map(payment => (
                <div key={payment.id} className="bg-white rounded-[2rem] border border-amber-200 p-6 flex flex-col md:flex-row justify-between items-center shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-400"></div>
                  <div className="pl-4">
                    <h3 className="text-xl font-black text-gray-900">
                      {payment.courseName}
                      {payment.paymentPlan === 'installment' && (
                        <span className="ml-3 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                          Installment {payment.installmentsPaid + 1} of 3
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-500 font-medium">Student: <span className="font-bold text-gray-900">{payment.userEmail}</span></p>
                    <p className="text-gray-500 text-sm mt-2">Transaction ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">{payment.transactionId}</span></p>
                    <p className="text-xs text-gray-400 mt-2">Submitted: {payment.date}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <button
                      onClick={() => {
                        const student = students.find(s => s.email === payment.userEmail);
                        if (student) {
                          setEditingProfile(student);
                        } else {
                          alert('Student profile not found in database.');
                        }
                      }}
                      className="text-sm font-bold underline text-blue-600 hover:text-blue-800"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => payment.receiptImage ? setViewingReceipt(payment.receiptImage) : alert('No receipt was attached to this older payment.')}
                      className={`text-sm font-bold underline ${payment.receiptImage ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}
                    >
                      View Receipt
                    </button>
                    <button
                      onClick={() => handleApprovePayment(payment.id)}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl font-black hover:bg-green-700 transition-all shadow-lg"
                    >
                      Approve Access
                    </button>
                  </div>
                </div>
              ))}

              {pendingApprovals.length === 0 && (
                <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 p-16 text-center">
                  <CheckCircle2 size={40} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-gray-900 mb-2">All Caught Up!</h3>
                  <p className="text-gray-500">There are no pending payment approvals at the moment.</p>
                </div>
              )}
            </div>

            {approvedPayments.length > 0 && (
              <div className="mt-16">
                <h2 className="text-xl font-black text-slate-900 mb-6">Recently Approved</h2>
                <div className="bg-white rounded-[2rem] border border-gray-100 p-6">
                  {approvedPayments.map(payment => (
                    <div key={payment.id} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-bold text-gray-900">{payment.courseName}</p>
                        <p className="text-xs text-gray-500">{payment.userEmail} • TID: {payment.transactionId}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            const student = students.find(s => s.email === payment.userEmail);
                            if (student) {
                              setEditingProfile(student);
                            } else {
                              alert('Student profile not found in database.');
                            }
                          }}
                          className="text-xs font-bold text-gray-500 hover:text-gray-900 underline"
                        >
                          View Profile
                        </button>
                        <span className="text-xs font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">Approved</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'enrollments' && (
          <div>
            <h1 className="text-3xl font-black mb-6">Enrollments</h1>
            <p className="text-gray-500 mb-10">Manage active students and their course access.</p>
            
            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              {getEnrollments().length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No active students enrolled yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getEnrollments().map(student => (
                    <div key={student.email} className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewingStudent(student)}>
                      <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black text-xl mb-4 uppercase">
                        {student.email.charAt(0)}
                      </div>
                      <h3 className="font-bold text-gray-900 truncate mb-1" title={student.email}>{student.email.split('@')[0]}</h3>
                      <p className="text-xs text-gray-500 truncate mb-4">{student.email}</p>
                      <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full">{student.activeCourses.length} Active</span>
                        {student.pendingCourses.length > 0 && <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">{student.pendingCourses.length} Pending</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {adminTab === 'teachers' && (
          <div>
            <h1 className="text-3xl font-black mb-6">Manage Teachers</h1>
            <p className="text-gray-500 mb-10">Add new teacher accounts and view registered instructors.</p>

            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User size={24} className="text-green-600" /> Create Teacher Account
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                    placeholder="E.g. Sir Ali"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                    placeholder="teacher@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                  <input 
                    type="password" 
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                    placeholder="Set a password"
                  />
                </div>
              </div>
              {teacherMessage && (
                <div className={`p-4 mb-4 rounded-xl text-sm font-medium ${teacherMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {teacherMessage}
                </div>
              )}
              <button 
                onClick={async () => {
                  if (!newTeacher.name || !newTeacher.email || !newTeacher.password) {
                    setTeacherMessage('Please fill all fields');
                    return;
                  }
                  
                  setTeacherMessage('Creating teacher account...');
                  
                  // 1. Sign up the teacher in Supabase Auth so they have login credentials
                  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: newTeacher.email,
                    password: newTeacher.password,
                    options: {
                      data: {
                        full_name: newTeacher.name,
                        role: 'teacher'
                      }
                    }
                  });
                  
                  if (signUpError) {
                    setTeacherMessage('Error creating Auth account: ' + signUpError.message);
                    return;
                  }
                  
                  // 2. Re-fetch or update the created user's password in public.users
                  // (the database trigger handle_new_user automatically copies them to public.users on signUp)
                  const { error: dbError } = await supabase
                    .from('users')
                    .update({ password: newTeacher.password })
                    .eq('email', newTeacher.email);
                  
                  if (dbError) {
                    setTeacherMessage('Auth account created, but failed to sync password: ' + dbError.message);
                  } else {
                    setTeacherMessage('Teacher created successfully!');
                    fetchData(); // refresh list
                    setNewTeacher({ name: '', email: '', password: '' });
                    setTimeout(() => setTeacherMessage(''), 3000);
                  }
                }}
                className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black hover:bg-green-600 transition-all shadow-lg w-full md:w-auto"
              >
                Add Teacher
              </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Registered Teachers</h2>
              {teachers.length === 0 ? (
                <p className="text-gray-500 italic">No teachers found. Add one above.</p>
              ) : (
                <div className="space-y-4">
                  {teachers.map(teacher => (
                    <div key={teacher.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-900">{teacher.full_name}</p>
                        <p className="text-xs text-gray-500">{teacher.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Teacher</span>
                        <button
                          onClick={() => setEditingProfile(teacher)}
                          className="text-gray-600 hover:text-gray-900 font-bold text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete ${teacher.full_name}?`)) {
                              const { error } = await supabase.from('users').delete().eq('id', teacher.id);
                              if (error) alert("Error deleting teacher: " + error.message);
                              else {
                                alert("Teacher deleted successfully.");
                                fetchData();
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-800 font-bold text-sm bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {adminTab === 'students' && (
          <div className="max-w-4xl">
            <h1 className="text-3xl font-black mb-6">All Students</h1>
            <p className="text-gray-500 mb-10">View and manage all registered students, regardless of enrollment status.</p>

            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Registered Students</h2>
              {students.length === 0 ? (
                <p className="text-gray-500 italic">No students found.</p>
              ) : (
                <div className="space-y-4">
                  {students.map(student => (
                    <div key={student.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0">
                          {student.image ? (
                            <img src={student.image} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20} /></div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{student.full_name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Student</span>
                        <button
                          onClick={() => setEditingProfile(student)}
                          className="text-gray-600 hover:text-gray-900 font-bold text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {adminTab === 'settings' && (
          <div className="max-w-2xl">
            <h1 className="text-3xl font-black mb-6">Settings</h1>
            <p className="text-gray-500 mb-10">Manage your administrative settings and security.</p>

            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Globe size={24} className="text-green-600" /> Profile Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number (WhatsApp)</label>
                  <input 
                    type="text" 
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                    placeholder="Enter admin WhatsApp number"
                  />
                </div>
                <button 
                  onClick={async () => {
                    const { error } = await supabase.from('users').update({ phone: adminPhone }).eq('email', 'parhlo.pakistan.edu@gmail.com');
                    if (error) {
                      alert("Error updating phone. Ensure 'users' table exists.");
                    } else {
                      alert("Admin phone number updated successfully!");
                    }
                  }}
                  className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black hover:bg-green-600 transition-all shadow-lg w-full md:w-auto"
                >
                  Save Profile
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShieldCheck size={24} className="text-green-600" /> Security
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                    placeholder="Enter new admin password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                    placeholder="Confirm new password"
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
                    
                    const { error } = await supabase.from('users').update({ password: newPassword }).eq('email', 'parhlo.pakistan.edu@gmail.com');
                    if (error) {
                      setPasswordMessage("Error updating password.");
                    } else {
                      setPasswordMessage("Password successfully updated!");
                      setNewPassword('');
                      setConfirmPassword('');
                      setTimeout(() => setPasswordMessage(''), 3000);
                    }
                  }}
                  className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black hover:bg-green-600 transition-all shadow-lg w-full md:w-auto"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setEditingProfile(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingProfile(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-black mb-6">Edit Profile</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingProfile.full_name || ''}
                  onChange={(e) => setEditingProfile({...editingProfile, full_name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="text"
                  value={editingProfile.email || ''}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 p-3 rounded-xl outline-none cursor-not-allowed text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingProfile.phone || ''}
                  onChange={(e) => setEditingProfile({...editingProfile, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Intro/Bio</label>
                <textarea
                  value={editingProfile.intro || ''}
                  onChange={(e) => setEditingProfile({...editingProfile, intro: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-green-500 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Profile Image URL</label>
                <input
                  type="text"
                  value={editingProfile.image || ''}
                  onChange={(e) => setEditingProfile({...editingProfile, image: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-green-500"
                  placeholder="https://example.com/image.png"
                />
              </div>
              <div className="pt-4">
                <button
                  onClick={async () => {
                    const updateData = {
                      full_name: editingProfile.full_name,
                      phone: editingProfile.phone,
                      intro: editingProfile.intro,
                      image: editingProfile.image,
                    };
                    const { error } = await supabase.from('users').update(updateData).eq('id', editingProfile.id);
                    if (error) {
                      alert("Error updating profile: " + error.message);
                    } else {
                      alert("Profile updated successfully!");
                      setEditingProfile(null);
                      fetchData();
                    }
                  }}
                  className="w-full bg-green-600 text-white font-bold py-4 rounded-full hover:bg-green-700 transition-colors shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-4 rounded-3xl max-w-2xl w-full relative">
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute -top-4 -right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
            >
              <X size={24} />
            </button>
            <div className="w-full flex justify-center bg-gray-50 rounded-2xl overflow-hidden min-h-[300px]">
              <img src={viewingReceipt} alt="Student Receipt" className="max-h-[80vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-[150] bg-gray-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <button
              onClick={() => setViewingStudent(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black text-2xl uppercase">
                {viewingStudent.email.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 truncate">{viewingStudent.email.split('@')[0]}</h3>
                <p className="text-gray-500">{viewingStudent.email}</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Active Courses */}
              <div>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Active Courses</h4>
                {viewingStudent.activeCourses.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No active courses.</p>
                ) : (
                  <div className="space-y-3">
                    {viewingStudent.activeCourses.map(course => (
                      <div key={course.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                          <p className="font-bold text-gray-900">
                            {course.courseName}
                            {course.status === 'suspended' && <span className="ml-2 text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Suspended</span>}
                            {course.paymentPlan === 'installment' && <span className="ml-2 text-[10px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Installment {course.installmentsPaid}/3</span>}
                          </p>
                          <p className="text-xs text-gray-500">
                            Approved on {course.date}
                            {course.nextDueDate && ` • Next Due: ${new Date(course.nextDueDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleToggleAccess(course.id, course.status)}
                            className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${course.status === 'approved' ? 'text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100' : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'}`}
                          >
                            {course.status === 'approved' ? 'Suspend Access' : 'Resume Access'}
                          </button>
                          <button 
                            onClick={() => handleRevokeAccess(course.id)}
                            className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                          >
                            Remove Permanently
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Courses */}
              {viewingStudent.pendingCourses.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Pending Courses</h4>
                  <div className="space-y-3">
                    {viewingStudent.pendingCourses.map(course => (
                      <div key={course.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 opacity-70">
                        <div>
                          <p className="font-bold text-gray-900">{course.courseName}</p>
                          <p className="text-xs text-gray-500">Requested on {course.date}</p>
                        </div>
                        <span className="text-xs font-bold text-yellow-600 uppercase tracking-widest">Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal for Admin */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          currentUser={{ email: 'admin@parhlopakistan.com.pk', role: 'admin', isAdmin: true }}
          salesReps={salesReps}
          onClose={() => setSelectedLead(null)}
          onUpdateLead={(updatedLead) => {
            const updated = crmLeads.map(l => l.id === updatedLead.id ? updatedLead : l);
            setCrmLeads(updated);
          }}
          onConvertToOffer={(lead) => {
            setAdminTab('sales');
            setNewOfferData(prev => ({
              ...prev,
              studentEmail: lead.email || '',
              courseSlug: adminCourses[0]?.slug || ''
            }));
            setIsCreateOfferModalOpen(true);
          }}
        />
      )}

      {/* Admin Create Private Offer Modal */}
      {isCreateOfferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                  <Gift size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Issue Admin Private Offer</h3>
                  <p className="text-xs text-gray-500">Create a personalized offer for a student</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOfferModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {offerFormMsg.text && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                offerFormMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {offerFormMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {offerFormMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateAdminOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Whom: Student Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newOfferData.studentEmail}
                  onChange={(e) => setNewOfferData({ ...newOfferData, studentEmail: e.target.value })}
                  placeholder="student@gmail.com"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Which: Target Course <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newOfferData.courseSlug}
                  onChange={(e) => setNewOfferData({ ...newOfferData, courseSlug: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {adminCourses.map(c => (
                    <option key={c.id || c.slug} value={c.slug}>
                      {c.name} ({formatCurrency(parsePrice(c.price))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  How Issued: Offer Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newOfferData.offerType}
                  onChange={(e) => setNewOfferData({ ...newOfferData, offerType: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="added_discount">Percentage Discount (Extra % Off)</option>
                  <option value="free_month_trial">1-Month Free Access (Delayed 1st Installment)</option>
                  <option value="discounted_installment">Discounted Monthly Installment Rate</option>
                </select>
              </div>

              {newOfferData.offerType === 'added_discount' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newOfferData.discountPercent}
                    onChange={(e) => setNewOfferData({ ...newOfferData, discountPercent: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    placeholder="e.g. 10"
                  />
                </div>
              )}

              {newOfferData.offerType === 'discounted_installment' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Custom Monthly Rate (Rs / month)
                  </label>
                  <input
                    type="number"
                    value={newOfferData.customInstallment}
                    onChange={(e) => setNewOfferData({ ...newOfferData, customInstallment: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    placeholder="e.g. 3500"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOfferModalOpen(false)}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all"
                >
                  Issue Offer Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
