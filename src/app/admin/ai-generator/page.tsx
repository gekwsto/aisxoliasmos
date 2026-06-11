import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminShell from '@/components/admin/AdminShell';
import GeneratorForm from './GeneratorForm';

export const dynamic = 'force-dynamic';

export default async function AiGeneratorPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <AdminShell user={{ name: session.user.name!, email: session.user.email!, role: session.user.role }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Generator</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Δημιούργησε άρθρο με AI — αποθηκεύεται αυτόματα ως Pending Approval.
          </p>
        </div>
        <GeneratorForm categories={categories} />
      </div>
    </AdminShell>
  );
}
