import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminShell from '@/components/admin/AdminShell';
import { formatRelativeDate } from '@/lib/utils';
import SourceActions from './SourceActions';
import FetchAllButton from '../news-discovery/FetchAllButton';

export const dynamic = 'force-dynamic';

export default async function SourcesPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const sources = await prisma.rssSource.findMany({
    orderBy: [{ enabled: 'desc' }, { name: 'asc' }],
    include: {
      category: { select: { name: true, color: true } },
      _count: { select: { articles: true } },
    },
  });

  return (
    <AdminShell user={{ name: session.user.name!, email: session.user.email!, role: session.user.role }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RSS Sources</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {sources.filter((s) => s.enabled).length} ενεργές από {sources.length} συνολικά
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/news-discovery"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              News Discovery
            </Link>
            <FetchAllButton />
          </div>
        </div>

        {/* Sources list */}
        {sources.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Δεν υπάρχουν sources</p>
            <p className="text-sm mt-1">Τρέξε <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">npm run db:seed</code> για να προσθέσεις τις αρχικές πηγές.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <span>Πηγή</span>
              <span className="text-center">Κατηγορία</span>
              <span className="text-center">Άρθρα</span>
              <span className="text-center">Τελευταία Ανανέωση</span>
              <span className="text-center">Ενέργειες</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 sm:gap-4 px-4 py-3.5 items-center"
                >
                  {/* Name + URL */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                          source.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {source.name}
                      </span>
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-xs text-gray-400 hover:text-indigo-500 truncate block max-w-xs"
                    >
                      {source.url}
                    </a>
                  </div>

                  {/* Category */}
                  <div className="sm:text-center">
                    <span
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: source.category.color }}
                    >
                      {source.category.name}
                    </span>
                  </div>

                  {/* Article count */}
                  <div className="sm:text-center text-sm text-gray-500 dark:text-gray-400">
                    <span className="sm:hidden text-xs text-gray-400">Άρθρα: </span>
                    {source._count.articles}
                  </div>

                  {/* Last fetched */}
                  <div className="sm:text-center text-xs text-gray-400">
                    {source.lastFetchedAt
                      ? formatRelativeDate(source.lastFetchedAt.toISOString())
                      : 'Ποτέ'}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:justify-center">
                    <SourceActions
                      sourceId={source.id}
                      enabled={source.enabled}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
