import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Σελίδα δεν βρέθηκε (404)',
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🔍</span>
      </div>
      <h1 className="text-6xl font-black text-slate-200 mb-2">404</h1>
      <h2 className="text-2xl font-black text-slate-900 mb-3">Αυτή η σελίδα δεν υπάρχει</h2>
      <p className="text-slate-500 max-w-md mb-8">
        Η σελίδα που ψάχνεις δεν βρέθηκε ή έχει μετακινηθεί. Δοκίμασε να επιστρέψεις στην αρχική.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full transition-colors"
        >
          Αρχική Σελίδα
        </Link>
        <Link
          href="/articles"
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-6 py-3 rounded-full transition-colors"
        >
          Όλα τα Άρθρα
        </Link>
      </div>
    </div>
  );
}
