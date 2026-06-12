import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminShell from '@/components/admin/AdminShell';
import { computeSeoScore, gradeColor } from '@/lib/seo-checker';
import { ARTICLE_PUBLIC_SELECT } from '@/lib/article-mapper';

export const dynamic = 'force-dynamic';

async function fetchSeoData() {
  const [
    totalPublished,
    missingImage,
    missingSeoTitle,
    missingSeoDescription,
    missingTags,
    shortContent,
    recentArticlesRaw,
    typeStats,
  ] = await Promise.all([
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
    prisma.article.count({ where: { status: 'PUBLISHED', generatedImageUrl: null } }),
    prisma.article.count({ where: { status: 'PUBLISHED', seoTitle: null } }),
    prisma.article.count({ where: { status: 'PUBLISHED', seoDescription: null } }),
    prisma.article.count({ where: { status: 'PUBLISHED', tags: { none: {} } } }),
    // Articles with content shorter than ~400 words (rough estimate: < 2000 chars stripped)
    prisma.article.count({
      where: { status: 'PUBLISHED', content: { lt: '0'.repeat(2000) } },
    }),
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        seoTitle: true,
        seoDescription: true,
        seoScore: true,
        content: true,
        excerpt: true,
        generatedImageUrl: true,
        readTime: true,
        publishedAt: true,
        createdAt: true,
        articleType: true,
        category: { select: { name: true, color: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    }),
    prisma.article.groupBy({
      by: ['articleType'],
      where: { status: 'PUBLISHED' },
      _count: { _all: true },
      _avg: { seoScore: true },
    }),
  ]);

  // Compute live SEO scores for recent articles
  const recentArticles = recentArticlesRaw.map((a) => {
    const tags = a.tags.map((t) => t.tag.name);
    const result = computeSeoScore({
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      seoTitle: a.seoTitle,
      seoDescription: a.seoDescription,
      tags,
      imageUrl: null,
      generatedImageUrl: a.generatedImageUrl,
      readTime: a.readTime,
      slug: a.slug,
    });
    return { ...a, tags, liveScore: result.score, liveGrade: result.grade, issues: result.issues };
  });

  const avgScore =
    recentArticles.length > 0
      ? Math.round(recentArticles.reduce((s, a) => s + a.liveScore, 0) / recentArticles.length)
      : 0;

  const topArticles = [...recentArticles].sort((a, b) => b.liveScore - a.liveScore).slice(0, 5);
  const bottomArticles = [...recentArticles].sort((a, b) => a.liveScore - b.liveScore).slice(0, 5);

  // Health score: % of published articles with no critical issues
  const healthScore =
    totalPublished === 0
      ? 100
      : Math.round(
          (1 -
            Math.min(1, (missingImage + missingSeoTitle + missingSeoDescription + missingTags) / (totalPublished * 4))) *
            100
        );

  const newsStats = typeStats.find((s) => s.articleType === 'NEWS');
  const evergreenStats = typeStats.find((s) => s.articleType === 'EVERGREEN');

  return {
    totalPublished,
    missingImage,
    missingSeoTitle,
    missingSeoDescription,
    missingTags,
    avgScore,
    healthScore,
    recentArticles,
    topArticles,
    bottomArticles,
    newsCount: newsStats?._count._all ?? 0,
    newsAvgScore: Math.round(newsStats?._avg.seoScore ?? 0),
    evergreenCount: evergreenStats?._count._all ?? 0,
    evergreenAvgScore: Math.round(evergreenStats?._avg.seoScore ?? 0),
  };
}

function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  const color = gradeColor(grade as 'A' | 'B' | 'C' | 'D' | 'F');
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {grade} <span className="font-normal">({score})</span>
    </span>
  );
}

function IssueChip({ severity }: { severity: string }) {
  const cls =
    severity === 'error'
      ? 'bg-red-100 text-red-700'
      : severity === 'warning'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-blue-100 text-blue-700';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${cls}`}>{severity}</span>;
}

export default async function SeoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/admin/login');

  const data = await fetchSeoData();
  const { totalPublished, missingImage, missingSeoTitle, missingSeoDescription, missingTags, avgScore, healthScore, recentArticles, topArticles, bottomArticles, newsCount, newsAvgScore, evergreenCount, evergreenAvgScore } = data;

  const healthColor = healthScore >= 80 ? '#059669' : healthScore >= 60 ? '#d97706' : '#dc2626';

  return (
    <AdminShell user={{ name: session.user.name!, email: session.user.email!, role: session.user.role }}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SEO Dashboard</h1>
            <p className="text-sm text-muted-foreground">Technical SEO health & article quality</p>
          </div>
          <div className="flex gap-2">
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
              sitemap.xml ↗
            </a>
            <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
              robots.txt ↗
            </a>
          </div>
        </div>

        {/* Health Score + Avg Score */}
        <section>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border-2 bg-card p-5" style={{ borderColor: healthColor }}>
              <p className="text-xs text-muted-foreground mb-1">SEO Health Score</p>
              <p className="text-4xl font-black" style={{ color: healthColor }}>{healthScore}</p>
              <p className="text-xs text-muted-foreground mt-1">/ 100</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">Avg Article Score</p>
              <p className="text-4xl font-black">{avgScore}</p>
              <p className="text-xs text-muted-foreground mt-1">τελευταία 20</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">Δημοσιευμένα</p>
              <p className="text-4xl font-black">{totalPublished}</p>
              <p className="text-xs text-muted-foreground mt-1">άρθρα</p>
            </div>
            <div className={`rounded-xl border bg-card p-5 ${missingImage + missingSeoTitle > 0 ? 'border-yellow-400' : 'border-border'}`}>
              <p className="text-xs text-muted-foreground mb-1">Κρίσιμα Ζητήματα</p>
              <p className={`text-4xl font-black ${missingImage + missingSeoTitle > 0 ? 'text-yellow-500' : ''}`}>
                {missingImage + missingSeoTitle}
              </p>
              <p className="text-xs text-muted-foreground mt-1">ανεπίλυτα</p>
            </div>
          </div>
        </section>

        {/* Issues Breakdown */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ζητήματα ανά Πεδίο</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Χωρίς εικόνα', count: missingImage, icon: '🖼️', severity: missingImage > 0 ? 'error' : 'ok' },
              { label: 'Χωρίς SEO Title', count: missingSeoTitle, icon: '📝', severity: missingSeoTitle > 0 ? 'warning' : 'ok' },
              { label: 'Χωρίς Meta Desc.', count: missingSeoDescription, icon: '📋', severity: missingSeoDescription > 0 ? 'warning' : 'ok' },
              { label: 'Χωρίς Tags', count: missingTags, icon: '🏷️', severity: missingTags > 0 ? 'warning' : 'ok' },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg border bg-card p-4 ${item.severity === 'error' && item.count > 0 ? 'border-red-300' : item.severity === 'warning' && item.count > 0 ? 'border-yellow-300' : 'border-border'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{item.icon}</span>
                  <span className={`text-2xl font-black ${item.count > 0 ? item.severity === 'error' ? 'text-red-500' : 'text-yellow-500' : 'text-green-500'}`}>
                    {item.count}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {item.count === 0 && <p className="text-[10px] text-green-600 mt-1 font-semibold">✓ Όλα εντάξει</p>}
              </div>
            ))}
          </div>
        </section>

        {/* NEWS vs EVERGREEN split */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">NEWS vs EVERGREEN</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">News</span>
                  <p className="text-3xl font-black text-slate-900 mt-0.5">{newsCount}</p>
                  <p className="text-xs text-slate-400">δημοσιευμένα άρθρα</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-0.5">Avg SEO Score</p>
                  <span
                    className="text-2xl font-black"
                    style={{ color: newsAvgScore >= 85 ? '#059669' : newsAvgScore >= 70 ? '#0891b2' : newsAvgScore >= 55 ? '#d97706' : '#dc2626' }}
                  >
                    {newsAvgScore || '—'}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 rounded-full" style={{ width: totalPublished > 0 ? `${Math.round((newsCount / totalPublished) * 100)}%` : '0%' }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{totalPublished > 0 ? Math.round((newsCount / totalPublished) * 100) : 0}% του συνόλου</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Evergreen</span>
                  <p className="text-3xl font-black text-slate-900 mt-0.5">{evergreenCount}</p>
                  <p className="text-xs text-slate-400">δημοσιευμένα άρθρα</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-0.5">Avg SEO Score</p>
                  <span
                    className="text-2xl font-black"
                    style={{ color: evergreenAvgScore >= 85 ? '#059669' : evergreenAvgScore >= 70 ? '#0891b2' : evergreenAvgScore >= 55 ? '#d97706' : '#dc2626' }}
                  >
                    {evergreenAvgScore || '—'}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-emerald-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, evergreenCount)}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{evergreenCount}/100 στόχος</p>
            </div>
          </div>
        </section>

        {/* Top & Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top SEO Άρθρα</h2>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {topArticles.map((a, i) => (
                <div key={a.id} className={`flex items-center gap-3 px-4 py-3 ${i !== topArticles.length - 1 ? 'border-b border-border' : ''}`}>
                  <span className="text-xs font-black text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/articles/${a.id}/edit`} className="text-sm font-medium hover:text-red-600 transition-colors line-clamp-1">
                      {a.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{a.category.name}</p>
                  </div>
                  <ScoreBadge score={a.liveScore} grade={a.liveGrade} />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Χρειάζονται Βελτίωση</h2>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {bottomArticles.map((a, i) => (
                <div key={a.id} className={`flex items-center gap-3 px-4 py-3 ${i !== bottomArticles.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/articles/${a.id}/edit`} className="text-sm font-medium hover:text-red-600 transition-colors line-clamp-1">
                      {a.title}
                    </Link>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {a.issues.slice(0, 2).map((issue) => (
                        <span key={issue.field} className="text-[10px] text-muted-foreground">
                          {issue.field}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ScoreBadge score={a.liveScore} grade={a.liveGrade} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Full Recent Articles Table */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Τελευταία 20 Άρθρα — SEO Ανάλυση</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Άρθρο</th>
                  <th className="px-4 py-2 text-center font-medium w-24">Score</th>
                  <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Ζητήματα</th>
                  <th className="px-4 py-2 text-center font-medium w-16">Εικόνα</th>
                  <th className="px-4 py-2 text-center font-medium w-16">Tags</th>
                  <th className="px-4 py-2 text-right font-medium w-20">Ενέργεια</th>
                </tr>
              </thead>
              <tbody>
                {recentArticles.map((a, i) => (
                  <tr key={a.id} className={`${i !== recentArticles.length - 1 ? 'border-b border-border' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{a.title}</p>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${a.category.color}20`, color: a.category.color }}
                      >
                        {a.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={a.liveScore} grade={a.liveGrade} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {a.issues.slice(0, 3).map((issue) => (
                          <span key={issue.field} className="text-[10px] text-muted-foreground">
                            {issue.field}
                          </span>
                        ))}
                        {a.issues.length === 0 && <span className="text-[10px] text-green-600 font-semibold">✓ Όλα εντάξει</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-base">
                      {a.generatedImageUrl ? '✓' : '✗'}
                    </td>
                    <td className="px-4 py-3 text-center text-base">
                      {a.tags.length > 0 ? '✓' : '✗'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/articles/${a.id}/edit`}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold"
                      >
                        Επεξεργασία
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Authority Pages Checklist */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">E-E-A-T Authority Pages</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Σχετικά', href: '/about' },
              { label: 'Επικοινωνία', href: '/contact' },
              { label: 'Συντακτική Πολιτική', href: '/editorial-policy' },
              { label: 'Πολιτική AI', href: '/ai-policy' },
              { label: 'Διαφάνεια', href: '/transparency' },
            ].map((p) => (
              <a
                key={p.href}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-400 hover:opacity-80 transition-opacity"
              >
                <span>{p.label}</span>
                <span className="text-green-500">✓</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
