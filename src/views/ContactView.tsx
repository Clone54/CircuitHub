import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Phone, MapPin, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ContactView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Feedback');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !message) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);

    // Simulate sending contact message
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
      setTimeout(() => setSuccess(false), 5000);
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 min-h-[80vh]">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO HOME
        </Link>
      </div>

      {/* Title */}
      <div className="border-b border-navy-light pb-6">
        <h1 className="font-display text-3xl font-extrabold text-white">Contact Academic Support</h1>
        <p className="text-xs text-slate-400 mt-1">
          Have an inquiry about active filtering calculations, 555 astable timings, or our AI models? Reach out directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Direct contact info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-navy-card border border-navy-light p-6 rounded-2xl space-y-4">
            <h3 className="font-display text-base font-bold text-white">Laboratory Headquarters</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              For immediate questions regarding university laboratory syllabus integrations or research references, you can find our academic department representatives below:
            </p>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-emerald-accent shrink-0" />
                <div>
                  <span className="font-bold text-slate-200 block">Technical Support</span>
                  <span className="text-slate-400">firozahmedskt1@gmail.com</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-emerald-accent shrink-0" />
                <div>
                  <span className="font-bold text-slate-200 block">Telephone Inquiry</span>
                  <span className="text-slate-400">+1 (555) 019-2104</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-accent shrink-0" />
                <div>
                  <span className="font-bold text-slate-200 block">Physical Laboratory Space</span>
                  <span className="text-slate-400">EEE Department, Lab Annex Block B, Room 210</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact form */}
        <div className="lg:col-span-7 bg-navy-card border border-navy-light p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
          <h3 className="font-display text-base font-bold text-white">Transmit Inquiries / Feedback</h3>

          {success && (
            <div className="flex items-center gap-2.5 text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 p-4 rounded-xl text-xs font-semibold">
              <CheckCircle className="h-5 w-5" />
              Your inquiry has been successfully transmitted! We will reply within 24 working hours.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 text-red-400 bg-red-400/10 border border-red-400/20 p-4 rounded-xl text-xs font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name (e.g. Firoz Ahmed)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Academic / Company Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">Subject of Inquiry</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Feedback">Platform General Feedback</option>
                <option value="Simulation">Simulation or Calculations bug</option>
                <option value="Analyzer">AI Datasheet Analyzer Help</option>
                <option value="Academic">University Lab Integration</option>
              </select>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">Message / Detailed inquiry</label>
              <textarea
                required
                placeholder="Specify your EEE-2104 node analysis question or datasheet analysis problems..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-accent hover:bg-emerald-hover text-navy-dark py-3 font-bold shadow-lg shadow-emerald-accent/10 transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Transmitting inquiry...' : 'Transmit inquiry'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
