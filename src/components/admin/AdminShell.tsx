import AdminNav from './AdminNav';

interface AdminShellProps {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
}

export default function AdminShell({ children, user }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <AdminNav user={user} />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
