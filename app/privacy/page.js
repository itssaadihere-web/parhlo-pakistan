import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Parhlo Pakistan",
  description: "Official Privacy Policy of Parhlo Pakistan - Information collection, Google AdSense cookies disclosure, data protection, and user rights.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-green-100 selection:text-green-900">
      
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="Parhlo Pakistan" className="h-8 w-8 object-contain" />
            <span className="font-black text-slate-900 tracking-tight text-lg">Parhlo Pakistan</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-slate-950 text-white py-16 lg:py-20 relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/30 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-wider mb-6">
            <ShieldCheck size={16} /> Data Protection & Compliance
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Last Updated: August 18, 2026. Your privacy and trust are our highest priorities at Parhlo Pakistan.
          </p>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-10 text-slate-700 leading-relaxed font-medium">

          {/* Section 1: Overview */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <Eye className="text-green-600 shrink-0" size={24} /> 1. Overview & Information We Collect
            </h2>
            <p className="mb-4">
              Parhlo Pakistan (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is an EdTech portal providing online board preparation and skill-based courses. This Privacy Policy explains how we collect, use, and protect your personal information when you visit or use our platform at <strong>parhlopakistan.com</strong>.
            </p>
            <p className="mb-3 font-semibold text-slate-900">We may collect the following information:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li><strong>Personal Details:</strong> Name, Email Address, and Phone/WhatsApp Number submitted during account registration or lead inquiries.</li>
              <li><strong>Learning Progress Data:</strong> Completed lectures, video watch time, and quiz scores tracked via our secure database.</li>
              <li><strong>Payment Proofs:</strong> Payment receipt screenshots uploaded for manual verification of EasyPaisa, JazzCash, or Bank Transfers.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and interaction logs for performance monitoring and security.</li>
            </ul>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: How We Use Information */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <FileText className="text-green-600 shrink-0" size={24} /> 2. How We Use Your Information
            </h2>
            <p className="mb-4">Your information is used strictly to provide and improve our educational services, including:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Granting access to enrolled lectures, course materials, and progress certificates.</li>
              <li>Verifying enrollment payment screenshots and installment plans.</li>
              <li>Sending important academic updates, course notifications, and support responses.</li>
              <li>Maintaining platform security, preventing fraud, and optimizing website speed.</li>
            </ul>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Google AdSense & Cookies Disclosure */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <Lock className="text-green-600 shrink-0" size={24} /> 3. Google AdSense & Third-Party Advertising Cookies
            </h2>
            <p className="mb-4">
              Parhlo Pakistan uses Google AdSense to serve advertisements on specific areas of our site (such as adjacent to the video player). 
            </p>
            <p className="mb-3 font-bold text-slate-900">Important Disclosures Regarding Google Advertising:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-4">
              <li>Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to our website or other websites.</li>
              <li>Google&apos;s use of advertising cookies enables it and its partners to serve ads to users based on their visit to our site and/or other sites on the Internet.</li>
              <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-green-700 underline font-bold hover:text-green-800">Google Ad Settings</a> or by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-green-700 underline font-bold hover:text-green-800">aboutads.info</a>.</li>
            </ul>
            <p className="text-xs text-slate-500 font-semibold italic">
              Note: If you have not opted out of third-party ad serving, cookies of other third-party vendors or ad networks may also be used to serve ads on our site.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 4: Analytics & Live Support Tools */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <CheckCircle2 className="text-green-600 shrink-0" size={24} /> 4. Analytics & Live Support Integration
            </h2>
            <p className="mb-4">
              We utilize trusted third-party analytics and live chat tools to deliver support and monitor performance:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li><strong>Tidio Live Chat:</strong> Facilitates real-time student support and inquiry responses.</li>
              <li><strong>Meta Pixel & Google Analytics:</strong> Helps us understand course interest and measure campaign effectiveness.</li>
              <li><strong>Vercel Insights:</strong> Tracks page loading speeds to ensure smooth video playback for students across Pakistan.</li>
            </ul>
          </div>

          <hr className="border-slate-100" />

          {/* Section 5: Data Security & User Rights */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-4">5. Data Security & Your Rights</h2>
            <p className="mb-4">
              We implement industry-standard encryption, Row Level Security (RLS) on our databases, and HTTPS connections to safeguard your personal data. We never sell, rent, or lease your personal contact information to third parties.
            </p>
            <p className="mb-4">
              You have the right to request access to your stored personal data, request corrections, or request account deletion by reaching out to our support team.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 6: Contact Us */}
          <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
            <h3 className="text-xl font-black text-slate-900 mb-2">Have Questions About Our Privacy Policy?</h3>
            <p className="text-slate-600 text-sm mb-4">
              If you have any questions, privacy concerns, or data requests, please contact our privacy compliance team:
            </p>
            <div className="space-y-1 text-sm font-bold text-slate-900">
              <p>📧 Email: <a href="mailto:parhlo.pakistan.edu@gmail.com" className="text-green-700 underline">parhlo.pakistan.edu@gmail.com</a></p>
              <p>📱 WhatsApp Support: <a href="https://wa.me/923302882822" target="_blank" rel="noopener noreferrer" className="text-green-700 underline">+92 330 2882822</a></p>
              <p>📍 Operator: Mockup Media (SMC-Private) Limited, Karachi, Pakistan</p>
            </div>
          </div>

        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center">
        <p className="text-slate-500 text-xs font-bold">
          © 2026 Parhlo Pakistan. All Rights Reserved. • <Link href="/terms" className="hover:text-green-600 underline">Terms of Service</Link> • <Link href="/contact" className="hover:text-green-600 underline">Contact Us</Link>
        </p>
      </footer>

    </div>
  );
}
