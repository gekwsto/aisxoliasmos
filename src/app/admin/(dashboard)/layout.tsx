import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';
import SessionProvider from '@/components/admin/SessionProvider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <AdminNav
          user={{
            name: session.user.name ?? '',
            email: session.user.email ?? '',
            role: session.user.role,
          }}
        />
        {/* Offset for sidebar on desktop, topbar on mobile */}
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
