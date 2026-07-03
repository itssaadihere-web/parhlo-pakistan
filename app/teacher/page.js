"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe,
  PlayCircle,
  CreditCard,
  Users,
  LogOut,
  Menu,
  X,
  Settings,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { parsePrice } from '@/utils/currencyHelpers';

export default function TeacherDashboard() {
  const router = useRouter();
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Profile Edit State
  const [phone, setPhone] = useState('');
  const [intro, setIntro] = useState('');
  const [image, setImage] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = window.localStorage.getItem('parhloRole');
    const email = window.localStorage.getItem('currentUserEmail');
    
    if (role !== 'teacher' || !email) {
      router.replace('/');
      return;
    }
    setIsTeacher(true);
    fetchTeacherData(email);
  }, []);

  const fetchTeacherData = async (email) => {
    setLoading(true);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('full_name, email, phone, intro, image, password')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      setLoading(false);
      return;
    }
    setTeacherProfile(user);
    setPhone(user.phone || '');
    setIntro(user.intro || '');
    setImage(user.image || '');

    const { data: myCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .ilike('instructor', user.full_name);

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      setLoading(false);
      return;
    }

    const courseSlugs = (myCourses || []).map(c => c.slug);
    
    let totalRev = 0;
    let studentsCount = 0;
    const enrichedCourses = [...(myCourses || [])];

    if (courseSlugs.length > 0) {
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .in('course_slug', courseSlugs)
        .eq('status', 'approved');
        
      if (!purchasesError && purchases) {
        enrichedCourses.forEach(course => {
          const coursePurchases = purchases.filter(p => p.course_slug === course.slug);
          
          const originalPrice = parsePrice(course.price);
          const discountPercent = parseFloat(String(course.discount || '0').replace(/[^0-9.]/g, '')) || 0;
          const finalPrice = discountPercent > 0 ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice;
          
          const courseRevenue = coursePurchases.length * finalPrice;
          course.earnedRevenue = courseRevenue;
          course.enrolledStudents = coursePurchases.length;
          
          totalRev += courseRevenue;
          studentsCount += coursePurchases.length;
        });
      }
    }

    setCourses(enrichedCourses);
    setRevenue(totalRev);
    setTotalStudents(studentsCount);
    setLoading(false);
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

  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800; 

        if (width > height && width > max_size) {
          height = Math.round((height * max_size) / width);
          width = max_size;
        } else if (height > max_size) {
          width = Math.round((width * max_size) / height);
          height = max_size;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/webp', 0.7);
        callback(compressedBase64);
      };
    };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedBase64) => {
        setImage(compressedBase64);
      });
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    const { error } = await supabase.from('users').update({
      phone, intro, image
    }).eq('email', teacherProfile.email);

    if (error) {
      setProfileMsg('Failed to update profile.');
    } else {
      setProfileMsg('Profile updated successfully!');
      setTeacherProfile(prev => ({ ...prev, phone, intro, image }));
      
      // Sync courses with new intro and image
      const { error: courseUpdateError } = await supabase.from('courses').update({
        instructorIntro: intro,
        instructorImage: image
      }).ilike('instructor', teacherProfile.full_name);
      
      if (courseUpdateError) {
        console.error('Failed to sync course data:', courseUpdateError);
      }
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    if (currentPassword !== teacherProfile.password) {
      setPasswordMsg('Current password is incorrect.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('New password must be at least 6 characters.');
      return;
    }
    const { error } = await supabase.from('users').update({
      password: newPassword
    }).eq('email', teacherProfile.email);

    if (error) {
      setPasswordMsg('Failed to change password.');
    } else {
      setPasswordMsg('Password changed successfully!');
      setTeacherProfile(prev => ({ ...prev, password: newPassword }));
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  if (!isTeacher) return null;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="h-10 logo-outline" />
          </Link>
          <span className="font-bold text-blue-800">Teacher</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Globe size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Settings size={20} /> Settings
          </button>
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
                <span className="font-bold text-blue-800">Teacher</span>
              </div>
              <nav className="flex-1 px-4 space-y-2 mt-4">
                <button 
                  onClick={() => {setActiveTab('dashboard'); setIsMobileMenuOpen(false);}}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Globe size={20} /> Dashboard
                </button>
                <button 
                  onClick={() => {setActiveTab('settings'); setIsMobileMenuOpen(false);}}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Settings size={20} /> Settings
                </button>
              </nav>
              <button onClick={handleLogout} className="m-6 flex items-center gap-3 px-4 py-3 text-gray-500 font-bold text-sm hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut size={20} /> Sign Out
              </button>
            </aside>
          </div>
        )}

        <header className="mb-10">
          <h1 className="text-3xl font-black text-slate-900">
            {activeTab === 'dashboard' ? `Welcome, ${teacherProfile?.full_name}` : 'Settings & Profile'}
          </h1>
          <p className="text-gray-500 font-medium">
            {activeTab === 'dashboard' ? 'Here is the overview of your courses and students.' : 'Manage your public profile and account security.'}
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm">
                    <div className="p-4 rounded-2xl bg-blue-50 text-blue-600"><PlayCircle size={24} /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Your Courses</p>
                      <p className="text-xl font-black text-gray-900">{courses.length}</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm">
                    <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600"><Users size={24} /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Enrolled Students</p>
                      <p className="text-xl font-black text-gray-900">{totalStudents}</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm">
                    <div className="p-4 rounded-2xl bg-amber-50 text-amber-600"><CreditCard size={24} /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Revenue Generated</p>
                      <p className="text-xl font-black text-gray-900">Rs. {revenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                    <PlayCircle className="text-blue-600" /> My Assigned Courses
                  </h2>
                  {courses.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <PlayCircle size={40} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">No courses have been assigned to you yet.</p>
                      <p className="text-xs text-gray-400 mt-2">The Admin will assign courses to your account.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {courses.map(course => (
                        <div key={course.slug} className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow gap-4">
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            {course.thumbnail ? (
                              <img src={course.thumbnail} alt={course.name} className="w-16 h-16 rounded-xl object-cover" />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500">
                                <PlayCircle size={24} />
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{course.name}</h3>
                              <p className="text-sm text-gray-500">Category: {course.category} • Level: {course.level}</p>
                            </div>
                          </div>
                          <div className="flex gap-6 w-full md:w-auto justify-end">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Students</p>
                              <p className="font-black text-gray-900 text-lg">{course.enrolledStudents}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                              <p className="font-black text-green-600 text-lg">Rs. {course.earnedRevenue.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Profile Settings */}
                <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                  <h2 className="text-xl font-black mb-6">Update Profile</h2>
                  <form onSubmit={saveProfile} className="space-y-6">
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700">Phone Number</span>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700">Profile Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        id="profile-image-upload"
                      />
                      <label 
                        htmlFor="profile-image-upload"
                        className={`mt-3 flex items-center justify-center w-full rounded-2xl border-2 border-dashed p-4 cursor-pointer transition-colors overflow-hidden ${image ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                      >
                        {image ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle2 size={24} className="text-blue-600 mb-2"/>
                            <span className="text-blue-600 font-bold text-sm">Image Selected</span>
                            <img src={image} alt="Preview" className="mt-4 h-24 object-cover rounded-lg border border-blue-200" />
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm font-medium flex flex-col items-center gap-2"><Upload size={20} className="text-gray-400"/> Click to browse & upload</span>
                        )}
                      </label>
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700">Instructor Bio</span>
                      <textarea
                        value={intro}
                        onChange={(e) => setIntro(e.target.value)}
                        placeholder="Write a brief intro about your expertise"
                        rows={5}
                        className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                      />
                    </label>
                    {profileMsg && (
                      <p className={`text-sm font-bold ${profileMsg.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                        {profileMsg}
                      </p>
                    )}
                    <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold hover:bg-blue-700 transition-all">
                      Save Profile
                    </button>
                  </form>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm h-fit">
                  <h2 className="text-xl font-black mb-6">Change Password</h2>
                  <form onSubmit={changePassword} className="space-y-6">
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700">Current Password</span>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700">New Password</span>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </label>
                    {passwordMsg && (
                      <p className={`text-sm font-bold ${passwordMsg.includes('correct') || passwordMsg.includes('Failed') || passwordMsg.includes('least') ? 'text-red-600' : 'text-green-600'}`}>
                        {passwordMsg}
                      </p>
                    )}
                    <button type="submit" className="w-full border-2 border-blue-600 text-blue-600 rounded-xl py-4 font-bold hover:bg-blue-50 transition-all">
                      Update Password
                    </button>
                  </form>
                </div>

              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
