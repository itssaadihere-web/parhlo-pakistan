"use client";

import { useEffect, useRef } from 'react';

export default function InactivityTracker({ onLogout, timeoutMs = 900000 }) { // Default 15 minutes
  const onLogoutRef = useRef(onLogout);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (onLogoutRef.current) onLogoutRef.current();
      }, timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    events.forEach(event => window.addEventListener(event, resetTimeout, { passive: true }));
    
    resetTimeout();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimeout));
    };
  }, [timeoutMs]);

  return null;
}
