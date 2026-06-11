import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminShell from '@/components/admin/AdminShell';
import SocialPostEditForm from './SocialPostEditForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SocialPostEditPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;

  const post = await prisma.socialPost.findUnique({
    where: { id },
    include: {
      article: {
        select: { id: true, title: true, slug: true, excerpt: true, coverImage: true },
      },
    },
  });

  if (!post) notFound();

  return (
    <AdminShell user={{ name: session.user.name!, email: session.user.email!, role: session.user.role }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin/social-posts"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Social Posts
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Επεξεργασία Post</span>
        </div>

        {/* Linked article info */}
        <div className="mb-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Συνδεδεμένο Άρθρο
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
            {post.article.title}
          </p>
          {post.article.excerpt && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {post.article.excerpt}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3">
            <Link
              href={`/admin/articles/${post.article.id}/preview`}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Προεπισκόπηση Άρθρου →
            </Link>
            <Link
              href={`/admin/social-posts/${post.id}/preview`}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Facebook Preview →
            </Link>
          </div>
        </div>

        <SocialPostEditForm
          id={post.id}
          initialContent={post.content}
          initialStatus={post.status}
          initialScheduledAt={post.scheduledAt ? post.scheduledAt.toISOString().slice(0, 16) : ''}
          platform={post.platform}
        />
      </div>
    </AdminShell>
  );
}
