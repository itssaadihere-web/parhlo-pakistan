export const ADMIN_EMAIL = 'parhlo.pakistan.edu@gmail.com';

export const KNOWN_SALES_EMAILS = [
  'faiz.ali@parhlopakistan.com.pk',
  'nabiha.irfan@parhlopakistan.com.pk',
  'sarina.saleem@parhlopakistan.com.pk',
  'faria.ahmed@parhlopakistan.com.pk',
  'finanta.abbasi@parhlopakistan.com.pk'
];

export const KNOWN_TEACHER_EMAILS = [
  'farazsohail18@gmail.com',
  'vaniya.ahmed.18@gmail.com',
  'khadijaaqeelahmed20@gmail.com',
  'muhammadzubair6879@gmail.com',
  'syedshafaathussain@gmail.com',
  'abdulrehman@parhlopakistan.com.pk'
];

export const TEACHER_DETAILS_MAP = {
  'syedshafaathussain@gmail.com': {
    name: 'Syed Shafaat Hussain',
    subject: 'Mathematics',
    intro: 'Syed Shafaat Hussain — Mathematics Instructor (Class 9 Sindh Board)'
  },
  'abdulrehman@parhlopakistan.com.pk': {
    name: 'Abdul Rehman',
    subject: 'Computer Science',
    intro: 'Abdul Rehman — Computer Science Instructor (Class 9 Sindh Board)'
  },
  'farazsohail18@gmail.com': {
    name: 'Dr. M Faraz Sohail',
    subject: 'Biology',
    intro: 'Dr. M. Faraz Sohail — Biology Instructor (Class 9 Sindh Board)'
  },
  'vaniya.ahmed.18@gmail.com': {
    name: 'Dr. Vaniya Ahmed',
    subject: 'Chemistry',
    intro: 'Dr. Vaniya Ahmed — Chemistry Instructor (Class 9 Sindh Board)'
  },
  'khadijaaqeelahmed20@gmail.com': {
    name: 'Dr. Khadija Aqeel Ahmed',
    subject: 'Physics',
    intro: 'Dr. Khadija Aqeel — Physics Instructor (Class 9 Sindh Board)'
  },
  'muhammadzubair6879@gmail.com': {
    name: 'M. Zubair Yousif',
    subject: 'English',
    intro: 'Muhammad Zubair — English Instructor (Class 9 Sindh Board)'
  }
};

/**
 * Determine the user role based on email and optional DB record.
 * Order of precedence:
 * 1. Admin: exclusively parhlo.pakistan.edu@gmail.com
 * 2. Teacher: teacher in DB or in known teacher list
 * 3. Sales: sales in DB, sales list, or sales staff domain
 * 4. Student: all other accounts
 */
export function determineUserRole(email, userRecord = null) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return 'student';

  // 1. Master Admin check
  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
    return 'admin';
  }

  // 2. Explicit DB role check
  if (userRecord && userRecord.role) {
    const r = String(userRecord.role).toLowerCase().trim();
    if (r === 'admin' && cleanEmail === ADMIN_EMAIL.toLowerCase()) return 'admin';
    if (r === 'teacher') return 'teacher';
    if (r === 'sales') return 'sales';
    if (r === 'student') return 'student';
  }

  // 3. Known Teacher list
  if (KNOWN_TEACHER_EMAILS.some(e => e.toLowerCase() === cleanEmail)) {
    return 'teacher';
  }

  // 4. Known Sales list & staff domain check
  if (
    KNOWN_SALES_EMAILS.some(e => e.toLowerCase() === cleanEmail) ||
    (cleanEmail.endsWith('@parhlopakistan.com.pk') && cleanEmail !== 'abdulrehman@parhlopakistan.com.pk')
  ) {
    return 'sales';
  }

  // 5. Default: Student
  return 'student';
}

/**
 * Get destination portal route for a given role
 */
export function getPortalPathForRole(role) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'teacher':
      return '/teacher';
    case 'sales':
      return '/sales';
    case 'student':
    default:
      return '/dashboard';
  }
}

/**
 * Get human-readable portal label for navbar
 */
export function getPortalLabelForRole(role) {
  switch (role) {
    case 'admin':
      return 'Admin Panel';
    case 'teacher':
      return 'Teacher Portal';
    case 'sales':
      return 'Sales Portal';
    case 'student':
    default:
      return 'Dashboard';
  }
}

/**
 * Sync user session into localStorage
 */
export function syncUserSession(email, role) {
  if (typeof window === 'undefined') return;
  const cleanEmail = (email || '').trim().toLowerCase();
  const isAdmin = role === 'admin';

  window.localStorage.setItem('currentUserEmail', cleanEmail);
  window.localStorage.setItem('parhloRole', role);
  window.localStorage.setItem('parhloAdmin', isAdmin ? 'true' : 'false');
}

/**
 * Clear user session from localStorage
 */
export function clearUserSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('currentUserEmail');
  window.localStorage.removeItem('parhloRole');
  window.localStorage.removeItem('parhloAdmin');
  window.localStorage.removeItem('currentUserId');
  window.localStorage.removeItem('parhlo_purchases');
}

/**
 * Get stored session details
 */
export function getStoredUserSession() {
  if (typeof window === 'undefined') return { email: '', role: null, isAdmin: false };
  const email = (window.localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();
  const role = window.localStorage.getItem('parhloRole');
  const isAdmin = window.localStorage.getItem('parhloAdmin') === 'true' || role === 'admin';
  return { email, role, isAdmin };
}
