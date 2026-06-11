'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Zap, Users, Star } from 'lucide-react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/40 rounded-2xl p-8 md:p-12 text-center shadow-xl border border-slate-800">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-600/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-900/40">
          <Mail className="text-white" size={24} />
        </div>

        {/* Social proof row */}
        <div className="flex items-center justify-center gap-5 mb-5">
          {[
            { icon: Users, label: '12.000+ αναγνώστες' },
            { icon: Zap, label: 'Κάθε πρωί στις 8:00' },
            { icon: Star, label: 'Δωρεάν, χωρίς spam' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Icon size={12} className="text-red-400 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        <h2 className="text-white text-2xl md:text-3xl font-black mb-2">
          Μην χάσεις τίποτα σημαντικό
        </h2>
        <p className="text-slate-300 max-w-md mx-auto mb-3 text-sm leading-relaxed">
          Κάθε πρωί τα <span className="text-red-400 font-semibold">5 πιο σημαντικά άρθρα</span> της ημέρας απευθείας στο inbox σου — με έξυπνο σχολιασμό.
        </p>
        <p className="text-slate-500 text-xs mb-7">
          12.000+ αναγνώστες ήδη εγγεγραμμένοι · Απεγγραφή με 1 κλικ
        </p>

        {submitted ? (
          <div className="inline-flex items-center gap-2.5 bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 font-semibold px-6 py-3 rounded-full">
            <CheckCircle size={18} />
            Εγγραφή επιτυχής! Σε καλωσορίζουμε.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="το-email-σου@gmail.com"
              required
              className="flex-1 bg-slate-800 border border-slate-700 focus:border-red-500 text-white placeholder-slate-500 rounded-full px-5 py-3 text-sm focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-black px-7 py-3 rounded-full text-sm transition-colors shrink-0 shadow-lg shadow-red-900/30"
            >
              {loading ? '...' : 'Εγγραφή →'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
