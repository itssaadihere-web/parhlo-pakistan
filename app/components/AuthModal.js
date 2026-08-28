"use client";

import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../utils/supabase';

export default function AuthModal({ onClose, isOpen, initialMode = 'login', onLoginSuccess }) {
  const [authMode, setAuthMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email = (e.target.email.value || '').trim();
    const password = e.target.password.value;
    const fullName = authMode === 'signup' ? e.target.fullName.value : null;
    const lowerEmail = email.toLowerCase();

    setIsSubmitting(true);

    try {
      // Recognized team/staff emails
      const isParhloStaff = lowerEmail.endsWith('@parhlopakistan.com.pk') || [
        'faiz.ali@parhlopakistan.com.pk',
        'nabiha.irfan@parhlopakistan.com.pk',
        'sarina.saleem@parhlopakistan.com.pk',
        'faria.ahmed@parhlopakistan.com.pk'
      ].includes(lowerEmail);

      const isTeacher = [
        'farazsohail18@gmail.com',
        'vaniya.ahmed.18@gmail.com',
        'khadijaaqeelahmed20@gmail.com',
        'muhammadzubair6879@gmail.com',
        'syedshafaathussain@gmail.com',
        'abdulrehman@parhlopakistan.com.pk'
      ].includes(lowerEmail);

      let finalRole = 'student';

      if (lowerEmail === "parhlo.pakistan.edu@gmail.com") {
        const currentAdminPassword = (typeof window !== 'undefined' ? window.localStorage.getItem('parhloAdminPassword') : null) || "parhlo@2003";
        if (password !== currentAdminPassword) {
          alert("Incorrect password for Admin account.");
          return;
        }
        finalRole = 'admin';
      } else if (isParhloStaff) {
        if (!password) {
          alert("Please enter a password.");
          return;
        }
        finalRole = 'sales';
      } else if (isTeacher) {
        if (!password) {
          alert("Please enter a password.");
          return;
        }
        finalRole = 'teacher';
      } else {
        // Student login or sign-up
        if (authMode === 'signup') {
          const { error } = await supabase.auth.signUp({
            email: lowerEmail,
            password,
            options: { data: { full_name: fullName, role: 'student' } }
          });
          if (error) {
            alert("Error creating account: " + error.message);
            return;
          }
          supabase.from('users').upsert([{ email: lowerEmail, full_name: fullName, role: 'student' }], { onConflict: 'email' }).then(() => {}).catch(() => {});
        } else {
          // Fast Supabase Auth attempt with 1.5s timeout race so users never hang
          try {
            const authPromise = supabase.auth.signInWithPassword({ email: lowerEmail, password });
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 1500));
            const res = await Promise.race([authPromise, timeoutPromise]);
            if (res && res.error && !res.error.message.toLowerCase().includes('email not confirmed')) {
              // Try fallback against users table if custom password
              const { data: dbUsers } = await supabase.from('users').select('*').ilike('email', lowerEmail);
              const dbUser = dbUsers && dbUsers.length > 0 ? dbUsers[0] : null;
              if (dbUser && dbUser.password && dbUser.password !== password) {
                alert("Incorrect password. Please check your credentials.");
                return;
              }
            }
          } catch (e) {}
        }
        finalRole = 'student';
      }

      // Save user session in localStorage immediately
      const isAdmin = finalRole === 'admin';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('parhloAdmin', isAdmin ? 'true' : 'false');
        window.localStorage.setItem('currentUserEmail', lowerEmail);
        window.localStorage.setItem('parhloRole', finalRole);
      }

      if (finalRole === 'student') {
        Promise.all([
          supabase.from('leads').update({ status: 'signed_in', updated_at: new Date().toISOString() }).ilike('email', lowerEmail),
          supabase.from('sales_offers').update({ status: 'signed_in', updated_at: new Date().toISOString() }).ilike('student_email', lowerEmail).eq('status', 'active')
        ]).catch(() => {});
      }
      
      onLoginSuccess && onLoginSuccess(finalRole);
      onClose();
    } catch (err) {
      console.error('Login process error:', err);
      alert('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          disabled={googleLoading || isSubmitting}
          onClick={async () => {
            if (googleLoading) return;
            setGoogleLoading(true);
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const targetUrl = origin ? `${origin}/dashboard` : undefined;
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: targetUrl,
                queryParams: {
                  prompt: 'select_account'
                }
              }
            });
            if (error) {
              alert("Google login error: " + error.message);
              setGoogleLoading(false);
            }
          }}
          className="w-full mb-6 flex items-center justify-center gap-3 bg-white border border-gray-200 py-4 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
        >
          {googleLoading ? (
            <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></span> Connecting Google...
            </span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {authMode === 'login' ? 'Login with Google' : 'Sign up with Google'}
            </>
          )}
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
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              required 
              placeholder="Password" 
              className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium" 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || googleLoading}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-black hover:bg-green-600 transition-all shadow-xl mt-4 uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                <span>{authMode === 'login' ? 'Logging in...' : 'Signing up...'}</span>
              </>
            ) : (
              <span>{authMode === 'login' ? 'Login' : 'Sign Up'}</span>
            )}
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