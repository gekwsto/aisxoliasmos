import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Admin Login | ΑΙΣΧΟΛΙΑΣΜΟΣ',
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <span className="font-black text-2xl tracking-widest">
          <span className="text-red-500">ΑΙ</span>
          <span className="text-white">ΣΧΟΛΙΑΣΜΟΣ</span>
        </span>
        <p className="text-slate-500 text-xs tracking-widest mt-1">ADMIN PANEL</p>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
