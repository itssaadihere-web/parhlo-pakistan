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
      let email = window.localStorage.getItem('currentUserEmail');
      const isAdmin = window.localStorage.getItem('parhloAdmin') === 'true';

      if (isAdmin) {
        router.replace('/admin');
        return;
      }

      // Check Supabase session for Google Login
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && session.user.email) {
          email = session.user.email;
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
        setStudentName(userProfile.full_name || email.split('@')[0]);
        setPhoneNumber(userProfile.phone || '');
        setIntro(userProfile.intro || '');
        setImage(userProfile.image || '');
      } else if (!profileError || profileError.code === 'PGRST116') {
        // User doesn't exist in users table (maybe Google login), let's create a stub
        await supabase.from('users').insert([{ email, full_name: email.split('@')[0], role: 'student' }]);
      }

      // Fetch all purchases for this user from Supabase
      const { data: userPurchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('student_email', email);

      if (purchasesError) {
        console.error('Error fetching student purchases:', purchasesError);
        setPendingPayments([]);
        setEnrolledCourses([]);
      } else if (userPurchases) {
        // Map pending payments
        const pending = userPurchases
          .filter(p => p.status === 'pending')
          .map(p => ({
            id: p.id,
            courseName: p.course_slug, // Ideally we join with courses table
            transactionId: 'N/A',
            date: new Date(p.created_at).toLocaleDateString(),
            status: 'pending'
          }));
        setPendingPayments(pending);

        // Fetch all courses to match with approved purchases
        const { data: adminCourses, error: coursesError } = await supabase
          .from('courses')
          .select('*');

        if (!coursesError && adminCourses) {
          const approved = userPurchases.filter(p => p.status === 'approved');
          const activeCourses = approved.map(purchase => {
            const course = adminCourses.find(c => c.slug === purchase.course_slug);
            if (!course) return null;
            
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

            return {
              title: course.name,
              slug: course.slug,
              category: course.category || 'Course',
              progress: progressPct,
              totalLectures: totalLectures,
              completedLectures: completedLectures,
              imageClass: 'from-slate-900 via-slate-700 to-green-600'
            };
          }).filter(Boolean);
          setEnrolledCourses(activeCourses);
        }
      }
    };

    initDashboard();
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
              {[
                { label: 'Active Subjects', val: enrolledCourses.length, color: 'bg-blue-50 text-blue-600' },
                { label: 'Pending Approvals', val: pendingPayments.length, color: 'bg-amber-50 text-amber-600' },
                { label: 'Study Hours', val: '0', color: 'bg-purple-50 text-purple-600' },
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
