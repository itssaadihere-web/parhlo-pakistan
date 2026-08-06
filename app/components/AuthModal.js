"use client";

import React, { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../../utils/supabase';

export default function AuthModal({ onClose, isOpen, initialMode = 'login', onLoginSuccess }) {
  const [authMode, setAuthMode] = useState(initialMode);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const fullName = authMode === 'signup' ? e.target.fullName.value : null;

    // Destroy any lingering Google session so it doesn't override this manual login
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }

    let fetchedUser = null;

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: email === "parhlo.pakistan.edu@gmail.com" ? "admin" : "student"
          }
        }
      });
      
      if (error) {
        alert("Error creating account: " + error.message);
        return;
      }
      
      // Fetch the created/existing user record from public.users
      const { data: publicUser } = await supabase.from('users').select('*').eq('email', email).single();
      fetchedUser = publicUser;
      
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // Fallback for admin if table is missing or empty
        if (email === "parhlo.pakistan.edu@gmail.com") {
          const currentAdminPassword = window.localStorage.getItem('parhloAdminPassword') || "parhlo@2003";
          if (password !== currentAdminPassword) {
            alert("Incorrect password");
            return;
          }
        } else {
          alert("Login failed: " + error.message);
          return;
        }
      } else {
        // Fetch the user record from public.users table to get the true role
        const { data: publicUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (!dbError && publicUser) {
          fetchedUser = publicUser;
        } else {
          // Fallback to user metadata if database query fails
          fetchedUser = { role: data.user.user_metadata?.role || 'student' };
        }
      }
    }

    let finalRole = 'student';
    const salesEmails = ['faiz.ali@parhlopakistan.com.pk', 'nabiha.irfan@parhlopakistan.com.pk'];
    const lowerEmail = (email || '').toLowerCase().trim();

    if (lowerEmail === "parhlo.pakistan.edu@gmail.com") {
      finalRole = 'admin';
    } else if (salesEmails.includes(lowerEmail)) {
      finalRole = 'sales';
    } else if (authMode !== 'signup' && fetchedUser?.role) {
      finalRole = fetchedUser.role;
    }

    const isAdmin = finalRole === 'admin';
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('parhloAdmin', isAdmin ? 'true' : 'false');
      window.localStorage.setItem('currentUserEmail', email);
      window.localStorage.setItem('parhloRole', finalRole);
    }
    
    onLoginSuccess && onLoginSuccess(finalRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] max-w-md w-full relative shadow-2xl border border-gray-100">
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="mb-8 text-center">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="text-gray-500 text-sm font-medium mt-2">
            {authMode === 'login' ? 'Continue your learning journey' : 'Join Pakistan’s elite skill platform'}
          </p>
        </div>

        <button 
          type="button"
          onClick={async () => {
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${window.location.origin}/dashboard`,
                queryParams: {
                  prompt: 'select_account'
                }
              }
            });
            if (error) {
              alert("Backend not configured. Please add Supabase URLs to your project.");
            }
          }}
          className="w-full mb-6 flex items-center justify-center gap-3 bg-white border border-gray-200 py-4 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {authMode === 'login' ? 'Login with Google' : 'Sign up with Google'}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Or with email</span></div>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {authMode === 'signup' && (
            <div className="relative">
              <User className="absolute left-4 top-4 text-gray-400" size={20} />
              <input name="fullName" type="text" required={authMode === 'signup'} placeholder="Full Name" className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
            <input name="email" type="email" required placeholder="Email Address" className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
            <input name="password" type="password" required placeholder="Password" className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium" />
          </div>

          <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-black hover:bg-green-600 transition-all shadow-xl mt-4 uppercase tracking-wider">
            {authMode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500 font-medium">
            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="ml-2 text-green-600 font-bold hover:underline"
            >
              {authMode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}