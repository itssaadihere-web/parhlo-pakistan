"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MessageSquare, Clock, MapPin, Send, CheckCircle2, HelpCircle } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "general",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "general", message: "" });
    }, 800);
  };

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
            <MessageSquare size={16} /> We Are Here To Help
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Contact Support & Inquiries
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Have questions about course admissions, installment payments, or technical support? Get in touch with our team.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                Get in Touch
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-8">
                Whether you are a student preparing for board exams or exploring digital skills, our support desk is ready to guide you.
              </p>
            </div>

            <div className="space-y-6">
              
              {/* Direct Email */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0 font-bold">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Email Support</h3>
                  <a href="mailto:parhlo.pakistan.edu@gmail.com" className="text-sm font-semibold text-green-700 hover:underline block">
                    parhlo.pakistan.edu@gmail.com
                  </a>
                  <span className="text-xs text-slate-400 font-medium">Fast reply within 24 hours</span>
                </div>
              </div>

              {/* Direct WhatsApp */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">WhatsApp Helpline</h3>
                  <a href="https://wa.me/923302882822" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-700 hover:underline block">
                    +92 330 2882822
                  </a>
                  <span className="text-xs text-slate-400 font-medium">Mon - Sat: 9:00 AM to 8:00 PM PST</span>
                </div>
              </div>

              {/* Office Location & Parent Org */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Parent Entity</h3>
                  <p className="text-sm font-semibold text-slate-700">
                    Mockup Media (SMC-Private) Limited
                  </p>
                  <span className="text-xs text-slate-400 font-medium">Karachi, Sindh, Pakistan</span>
                </div>
              </div>

              {/* Response Time SLA */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-900 text-xs font-bold">
                <Clock size={18} className="text-green-700 shrink-0" />
                <span>Standard Support SLA: All inquiry tickets answered within 24 business hours.</span>
              </div>

            </div>
          </div>

          {/* Interactive Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Send Us a Message</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                Fill out the form below and our academic team will reach out directly.
              </p>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-green-50 border border-green-200 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900">Message Received!</h4>
                  <p className="text-slate-600 text-sm font-medium max-w-sm mx-auto">
                    Thank you for reaching out to Parhlo Pakistan. A member of our support team will respond to your email within 24 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ali Ahmed"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="name@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
                        Phone / WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        placeholder="0330 1234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
                        Topic / Category
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium bg-white"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="enrollment">Course Enrollment & Payment</option>
                        <option value="technical">Video Playback / Portal Support</option>
                        <option value="certificate">Completion Certificate Query</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Write your question or request here..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : <><span>Send Message</span> <Send size={16} /></>}
                  </button>

                </form>
              )}

            </div>
          </div>

        </div>

        {/* FAQ Section */}
        <div className="mt-20 border-t border-slate-200 pt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2 mb-2">
              <HelpCircle className="text-green-600" size={28} /> Frequently Asked Questions
            </h2>
            <p className="text-slate-500 font-medium text-sm">Quick answers to common questions about Parhlo Pakistan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-2">How do I unlock full course access?</h4>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                After starting your demo lecture, select either Full Payment or Monthly Installments during checkout. Upload your payment screenshot (EasyPaisa, JazzCash, or Bank), and our admin team will approve your access shortly.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-2">Can I watch demo lectures for free?</h4>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Yes! Free demo lectures are available for every course so you can evaluate the teacher and concept explanations before enrolling.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-2">How do I receive my completion certificate?</h4>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Once all video lectures in a course curriculum are marked complete, your official Parhlo Pakistan digital certificate becomes available directly in your student dashboard.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-2">Who operates Parhlo Pakistan?</h4>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Parhlo Pakistan is owned and operated by Mockup Media (SMC-Private) Limited, a registered entity based in Karachi, Pakistan.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center">
        <p className="text-slate-500 text-xs font-bold">
          © 2026 Parhlo Pakistan. All Rights Reserved. • <Link href="/privacy" className="hover:text-green-600 underline">Privacy Policy</Link> • <Link href="/terms" className="hover:text-green-600 underline">Terms of Service</Link>
        </p>
      </footer>

    </div>
  );
}
