import Link from "next/link";
import { ArrowLeft, BookOpen, ShieldCheck, CreditCard, Lock, Scale, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Parhlo Pakistan",
  description: "Terms of Service and User Agreement for Parhlo Pakistan - Course access rules, installment plans, IP protection, and acceptable use.",
};

export default function TermsOfService() {
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
            <Scale size={16} /> User Agreement & Policy
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Effective Date: August 18, 2026. Please read these terms carefully before accessing or using Parhlo Pakistan.
          </p>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-10 text-slate-700 leading-relaxed font-medium">

          {/* Section 1: Acceptance */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <BookOpen className="text-green-600 shrink-0" size={24} /> 1. Acceptance of Terms
            </h2>
            <p className="mb-4">
              By accessing, browsing, or registering an account on <strong>parhlopakistan.com</strong> (&quot;the Platform&quot;), operated by Mockup Media (SMC-Private) Limited, you agree to be legally bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue using our services immediately.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Course Access & Installment Payments */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <CreditCard className="text-green-600 shrink-0" size={24} /> 2. Course Enrollment, Fees & Installments
            </h2>
            <p className="mb-4">
              Parhlo Pakistan offers both free demo lectures and paid course masterclasses. When enrolling in a course, the following payment conditions apply:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-4">
              <li><strong>One-Time Full Payment:</strong> Grants lifetime access to all lectures, quizzes, and certificates associated with the specific course.</li>
              <li><strong>Installment Plans:</strong> If you choose a 3-month equal installment plan, monthly payments must be submitted according to your payment schedule in your student dashboard. Failure to complete subsequent installment payments may result in temporary suspension of course video access.</li>
              <li><strong>Manual Payment Verification:</strong> Payments submitted via EasyPaisa, JazzCash, or Bank Transfer require manual screenshot verification by our team before course access is granted (typically within 1 to 24 hours).</li>
            </ul>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Intellectual Property & Video Protection */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <Lock className="text-green-600 shrink-0" size={24} /> 3. Intellectual Property & Copyright Protection
            </h2>
            <p className="mb-4">
              All curriculum contents, video recordings, graphics, logos, study materials, and code on Parhlo Pakistan are the exclusive intellectual property of Mockup Media (SMC-Private) Limited and its course instructors.
            </p>
            <p className="mb-3 font-bold text-slate-900">Strictly Prohibited Actions:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Screen recording, downloading, distributing, re-selling, or publicly sharing any video lectures.</li>
              <li>Sharing account login credentials with third parties or attempting to bypass single-user watermark protection.</li>
              <li>Using automated scraping bots or reverse-engineering platform components.</li>
            </ul>
            <p className="text-xs text-red-600 font-bold mt-4">
              Violation of intellectual property rights will result in immediate permanent account termination without refund and may incur legal action under applicable laws.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 4: Refund & Cancellation Policy */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <AlertCircle className="text-green-600 shrink-0" size={24} /> 4. Refund & Cancellation Policy
            </h2>
            <p className="mb-4">
              Because we provide free demo preview lectures for students to evaluate course quality before purchasing, course fee payments are generally non-refundable once full course materials are unlocked. If you experience technical issues or duplicate charges, please reach out to <a href="mailto:parhlo.pakistan.edu@gmail.com" className="text-green-700 underline font-bold">parhlo.pakistan.edu@gmail.com</a> for assistance.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 5: Third-Party Advertising & Links */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <ShieldCheck className="text-green-600 shrink-0" size={24} /> 5. Third-Party Ads & External Links
            </h2>
            <p className="mb-4">
              Parhlo Pakistan displays third-party advertisements served by Google AdSense. We do not endorse or take responsibility for third-party products, websites, or services advertised via ad units. Your interactions with third-party advertisers are solely between you and the advertiser.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 6: Governing Law */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl">
            <h3 className="text-xl font-black text-white mb-2">6. Governing Law & Jurisdiction</h3>
            <p className="text-slate-300 text-sm font-medium">
              These Terms of Service are governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any legal disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts located in Karachi, Pakistan.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center">
        <p className="text-slate-500 text-xs font-bold">
          © 2026 Parhlo Pakistan. All Rights Reserved. • <Link href="/privacy" className="hover:text-green-600 underline">Privacy Policy</Link> • <Link href="/contact" className="hover:text-green-600 underline">Contact Us</Link>
        </p>
      </footer>

    </div>
  );
}
