import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminShell from '@/components/admin/AdminShell';
import { formatRelativeDate } from '@/lib/utils';
import FetchAllButton from './FetchAllButton';
import DiscoveryFilters from './DiscoveryFilters';
import DiscoveryActions from './DiscoveryActions';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ category?: string; status?: string }>;
}

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  DRAFT_CREATED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  IGNORED: 'bg-gray-100 dark:bg-gray-800 text-gray-400',
};

const statusLabels: Record<string, string> = {
  NEW: 'Νέο',
  DRAFT_CREATED: 'Draft',
  IGNORED: 'Αγνοήθηκε',
};

export default async function NewsDiscoveryPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const { category: categoryFilter, status: statusFilter } = await searchParams;

  const [articles, categories, counts] = await Promise.all([
    prisma.discoveredArticle.findMany({
      where: {
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
        ...(statusFilter ? { status: statusFilter as 'NEW' | 'DRAFT_CREATED' | 'IGNORED' } : {}),
      },
      orderBy: [{ status: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        source: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.discoveredArticle.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count.id]));

  return (
    <AdminShell user={{ name: session.user.name!, email: session.user.email!, role: session.user.role }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">News Discovery</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Άρθρα από RSS feeds — επίλεξε τι θα γίνει AI draft.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['NEW', 'DRAFT_CREATED', 'IGNORED'] as const).map((s) => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s]}`}>
                  {statusLabels[s]}: {countMap[s] ?? 0}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/admin/sources"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Manage Sources
            </Link>
            <FetchAllButton />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <DiscoveryFilters
            categories={categories}
            currentCategory={categoryFilter ?? ''}
            currentStatus={statusFilter ?? ''}
          />
        </div>

        {/* Articles list */}
        {articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="mx-auto h-10 w-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
            <p className="font-medium">Δεν βρέθηκαν άρθρα</p>
            <p className="text-sm mt-1">
              {statusFilter || categoryFilter
                ? 'Δοκίμασε διαφορετικά φίλτρα ή'
                : 'Πάτα'}
              {' '}
              <span className="font-medium text-indigo-500">Ανανέωση Όλων</span> για να φέρεις νέα άρθρα.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className={`rounded-xl border bg-white dark:bg-gray-900 p-4 transition-colors ${
                  article.status === 'IGNORED'
                    ? 'border-gray-100 dark:border-gray-800 opacity-60'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: article.category.color }}
                      >
                        {article.category.name}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        {article.source.name}
                      </span>
                      {article.publishedAt && (
                        <span className="text-[10px] text-gray-400">
                          {formatRelativeDate(article.publishedAt.toISOString())}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 leading-snug line-clamp-2"
                    >
                      {article.title}
                    </a>

                    {/* Excerpt */}
                    {article.excerpt && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 sm:self-center">
                    <DiscoveryActions articleId={article.id} status={article.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
