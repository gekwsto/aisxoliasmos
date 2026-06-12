import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminShell from '@/components/admin/AdminShell';
import EvergreenForm from './EvergreenForm';

export const dynamic = 'force-dynamic';

export default async function EvergreenPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const [categories, stats] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, color: true } }),
    prisma.article.groupBy({
      by: ['articleType'],
      where: { articleType: { in: ['EVERGREEN'] } },
      _count: { _all: true },
    }),
  ]);

  const evergreenCount = stats.find((s) => s.articleType === 'EVERGREEN')?._count._all ?? 0;

  const recentEvergreen = await prisma.article.findMany({
    where: { articleType: 'EVERGREEN' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      seoScore: true,
      evergreenKeyword: true,
      searchIntent: true,
      estimatedDifficulty: true,
      createdAt: true,
    },
  });

  return (
    <AdminShell user={session.user as { name: string; email: string; role: string }}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Evergreen Content Engine</h1>
            <p className="text-slate-500 text-sm mt-1">
              Δημιούργησε SEO άρθρα που φέρνουν traffic για μήνες — στόχος 100+ evergreen άρθρα
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-emerald-600">{evergreenCount}</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Evergreen άρθρα
            </div>
            <div className="mt-1">
              <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, evergreenCount)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{evergreenCount}/100 στόχος</p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-black text-slate-900 mb-5">Νέο Evergreen Άρθρο</h2>
          <EvergreenForm categories={categories} />
        </div>

        {/* Recent evergreen articles */}
        {recentEvergreen.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">Πρόσφατα Evergreen</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {recentEvergreen.map((a) => (
                <div key={a.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {a.evergreenKeyword && (
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                          {a.evergreenKeyword}
                        </span>
                      )}
                      {a.searchIntent && (
                        <span className="text-xs text-violet-600 font-medium bg-violet-50 px-2 py-0.5 rounded">
                          {a.searchIntent}
                        </span>
                      )}
                      {a.estimatedDifficulty !== null && (
                        <span className="text-xs text-slate-500">
                          KD: {a.estimatedDifficulty}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {a.seoScore !== null && (
                      <span
                        className="text-xs font-bold px-2 py-1 rounded text-white"
                        style={{
                          backgroundColor:
                            a.seoScore >= 85
                              ? '#059669'
                              : a.seoScore >= 70
                              ? '#0891b2'
                              : a.seoScore >= 55
                              ? '#d97706'
                              : '#dc2626',
                        }}
                      >
                        SEO {a.seoScore}
                      </span>
                    )}
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        backgroundColor:
                          a.status === 'PUBLISHED'
                            ? '#d1fae5'
                            : a.status === 'PENDING_APPROVAL'
                            ? '#fef3c7'
                            : '#f1f5f9',
                        color:
                          a.status === 'PUBLISHED'
                            ? '#065f46'
                            : a.status === 'PENDING_APPROVAL'
                            ? '#92400e'
                            : '#64748b',
                      }}
                    >
                      {a.status === 'PUBLISHED'
                        ? 'Δημοσιευμένο'
                        : a.status === 'PENDING_APPROVAL'
                        ? 'Σε αναμονή'
                        : a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategy guide */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white">
          <h2 className="text-base font-black mb-4">Evergreen SEO Στρατηγική</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-bold text-emerald-400 mb-1">Επίλεξε σωστά keywords</p>
              <p className="text-slate-300 text-xs leading-relaxed">
                Στόχευσε keywords με 100-1000 μηνιαίες αναζητήσεις και difficulty &lt;50. Τα long-tail keywords φέρνουν πιο στοχευμένο traffic.
              </p>
            </div>
            <div>
              <p className="font-bold text-blue-400 mb-1">Δομή Content Cluster</p>
              <p className="text-slate-300 text-xs leading-relaxed">
                Κάθε pillar άρθρο συνδέεται με 5-10 υποστηρικτικά. Χρησιμοποίησε τα &quot;Μελλοντικά Άρθρα&quot; για να χτίσεις το cluster.
              </p>
            </div>
            <div>
              <p className="font-bold text-violet-400 mb-1">Ενημέρωνε τακτικά</p>
              <p className="text-slate-300 text-xs leading-relaxed">
                Τα evergreen άρθρα χρειάζονται refresh κάθε 6-12 μήνες. Ενημέρωσε στατιστικά, προσέθεσε νέες πληροφορίες.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
