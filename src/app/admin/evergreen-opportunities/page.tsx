import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminShell from '@/components/admin/AdminShell';
import LearningClient from './LearningClient';
import OpportunityActions from './OpportunityActions';

export const dynamic = 'force-dynamic';

async function fetchData() {
  const [
    topTopics,
    worstTopics,
    opportunities,
    savedOpportunities,
    predictionStats,
  ] = await Promise.all([
    prisma.topicPerformance.findMany({
      orderBy: { performanceScore: 'desc' },
      take: 8,
      select: { topic: true, category: true, avgReactions: true, avgComments: true, avgShares: true, articleCount: true, performanceScore: true },
    }),
    prisma.topicPerformance.findMany({
      where: { articleCount: { gte: 2 } },
      orderBy: { performanceScore: 'asc' },
      take: 5,
      select: { topic: true, avgReactions: true, avgComments: true, articleCount: true, performanceScore: true },
    }),
    prisma.evergreenOpportunity.findMany({
      where: { status: 'new' },
      orderBy: { overallScore: 'desc' },
    }),
    prisma.evergreenOpportunity.findMany({
      where: { status: 'saved' },
      orderBy: { overallScore: 'desc' },
      take: 5,
    }),
    prisma.postPerformance.aggregate({
      where: { predictionAccuracy: { not: null } },
      _avg: { predictionAccuracy: true, learningWeight: true },
      _count: { _all: true },
    }),
  ]);

  const bestPredictions = await prisma.postPerformance.findMany({
    where: { predictionAccuracy: { not: null } },
    orderBy: { predictionAccuracy: 'desc' },
    take: 3,
    select: {
      predictionAccuracy: true,
      predictedReach: true,
      actualReach: true,
      socialPost: { select: { article: { select: { title: true } } } },
    },
  });

  const worstPredictions = await prisma.postPerformance.findMany({
    where: { predictionAccuracy: { not: null, lt: 50 } },
    orderBy: { predictionAccuracy: 'asc' },
    take: 3,
    select: {
      predictionAccuracy: true,
      predictedReach: true,
      actualReach: true,
      socialPost: { select: { article: { select: { title: true } } } },
    },
  });

  const totalTopics = await prisma.topicPerformance.count();

  return {
    topTopics,
    worstTopics,
    opportunities,
    savedOpportunities,
    predictionStats,
    bestPredictions,
    worstPredictions,
    totalTopics,
  };
}

function ScoreBar({ value, max = 100, color = '#6366f1' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function OpportunityScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-slate-400 mb-0.5">{label}</span>
      <span className="text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

const articleTypeLabels: Record<string, string> = {
  'what-is': 'Τι Είναι',
  guide: 'Οδηγός',
  comparison: 'Σύγκριση',
  tutorial: 'Tutorial',
  explainer: 'Explainer',
  'best-of': 'Best Of',
  analysis: 'Ανάλυση',
  faq: 'FAQ',
};

export default async function EvergreenOpportunitiesPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const data = await fetchData();
  const {
    topTopics,
    worstTopics,
    opportunities,
    savedOpportunities,
    predictionStats,
    bestPredictions,
    worstPredictions,
    totalTopics,
  } = data;

  const avgAccuracy = Math.round(predictionStats._avg.predictionAccuracy ?? 0);
  const avgWeight = Number((predictionStats._avg.learningWeight ?? 1).toFixed(2));
  const roadmap = opportunities.slice(0, 5);

  return (
    <AdminShell user={session.user as { name: string; email: string; role: string }}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-slate-900">AI Learning Loop</h1>
            <p className="text-slate-500 text-sm mt-1">
              Self-improving editorial intelligence — {totalTopics} topics tracked
            </p>
          </div>
          <LearningClient />
        </div>

        {/* Learning stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Topics Tracked', value: totalTopics, color: '#7c3aed', sub: 'από Facebook data' },
            { label: 'Avg Accuracy', value: `${avgAccuracy}%`, color: avgAccuracy >= 70 ? '#059669' : avgAccuracy >= 50 ? '#d97706' : '#dc2626', sub: `${predictionStats._count._all} predictions` },
            { label: 'Avg Learning Weight', value: avgWeight, color: '#0891b2', sub: '1.0 = neutral' },
            { label: 'Opportunities', value: opportunities.length + savedOpportunities.length, color: '#ea580c', sub: `${savedOpportunities.length} αποθηκευμένες` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Topic Performance + Predictions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Best performing topics */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Best Performing Topics</h2>
              <p className="text-xs text-slate-400 mt-0.5">Θέματα που αποδίδουν στο Facebook</p>
            </div>
            {topTopics.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                Κάνε FB sync + Refresh Learning για να δεις δεδομένα
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topTopics.map((t, i) => (
                  <div key={t.topic} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400 w-4">{i + 1}</span>
                        <span className="text-sm font-semibold text-slate-800">{t.topic}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{t.category}</span>
                      </div>
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: t.performanceScore >= 70 ? '#059669' : t.performanceScore >= 40 ? '#d97706' : '#dc2626' }}
                      >
                        {Math.round(t.performanceScore)}
                      </span>
                    </div>
                    <ScoreBar value={t.performanceScore} color={t.performanceScore >= 70 ? '#059669' : t.performanceScore >= 40 ? '#d97706' : '#dc2626'} />
                    <div className="flex gap-4 mt-1 text-[10px] text-slate-400">
                      <span>❤️ {Math.round(t.avgReactions)}</span>
                      <span>💬 {Math.round(t.avgComments)}</span>
                      <span>🔁 {Math.round(t.avgShares)}</span>
                      <span>{t.articleCount} άρθρα</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prediction accuracy */}
          <div className="space-y-4">
            {/* Most accurate */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Most Accurate Predictions</h2>
              </div>
              {bestPredictions.length === 0 ? (
                <div className="px-5 py-4 text-xs text-slate-400">Δεν υπάρχουν δεδομένα ακόμα</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {bestPredictions.map((p, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                      <span
                        className="shrink-0 text-xs font-black px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: '#059669' }}
                      >
                        {p.predictionAccuracy}%
                      </span>
                      <p className="text-xs text-slate-600 line-clamp-1 flex-1">
                        {p.socialPost.article.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        p:{p.predictedReach} a:{p.actualReach}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Least accurate */}
            {worstPredictions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Least Accurate Predictions</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {worstPredictions.map((p, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                      <span
                        className="shrink-0 text-xs font-black px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: '#dc2626' }}
                      >
                        {p.predictionAccuracy}%
                      </span>
                      <p className="text-xs text-slate-600 line-clamp-1 flex-1">
                        {p.socialPost.article.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        p:{p.predictedReach} a:{p.actualReach}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Worst topics */}
            {worstTopics.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Worst Performing Topics</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Αποφύγετε ή βελτιώστε</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {worstTopics.map((t, i) => (
                    <div key={t.topic} className="px-5 py-3 flex items-center gap-3">
                      <span className="text-xs font-black text-slate-400 w-4">{i + 1}</span>
                      <span className="text-sm text-slate-600 flex-1">{t.topic}</span>
                      <span className="text-xs font-bold text-red-600">{Math.round(t.performanceScore)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auto Roadmap — top 5 opportunities */}
        {roadmap.length > 0 && (
          <section>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">
              Recommended Next Articles — Auto Roadmap
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {roadmap.map((opp, i) => (
                <div
                  key={opp.id}
                  className="bg-white rounded-xl border-2 p-4 shadow-sm"
                  style={{ borderColor: i === 0 ? '#dc2626' : i === 1 ? '#ea580c' : '#f59e0b' }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className="text-xs font-black px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: i === 0 ? '#dc2626' : i === 1 ? '#ea580c' : '#f59e0b' }}
                    >
                      #{i + 1}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {articleTypeLabels[opp.articleType] ?? opp.articleType}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1 line-clamp-2">{opp.topic}</p>
                  <p className="text-[10px] text-blue-600 font-medium mb-2">{opp.primaryKeyword}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">{opp.category}</span>
                    <span className="text-sm font-black text-slate-900">{opp.overallScore}</span>
                  </div>
                  <a
                    href={`/admin/evergreen`}
                    className="block mt-2 text-center text-[10px] font-bold py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors"
                  >
                    Δημιούργησε →
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All opportunities */}
        {opportunities.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Evergreen Opportunities ({opportunities.length})
              </h2>
            </div>
            <div className="space-y-3">
              {opportunities.map((opp) => (
                <div key={opp.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{
                            backgroundColor:
                              opp.overallScore >= 80 ? '#059669' :
                              opp.overallScore >= 60 ? '#0891b2' :
                              opp.overallScore >= 40 ? '#d97706' : '#dc2626',
                          }}
                        >
                          {opp.overallScore}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {articleTypeLabels[opp.articleType] ?? opp.articleType}
                        </span>
                        <span className="text-xs text-violet-600 font-medium bg-violet-50 px-2 py-0.5 rounded">
                          {opp.category}
                        </span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: opp.difficulty <= 30 ? '#d1fae5' : opp.difficulty <= 60 ? '#fef3c7' : '#fee2e2',
                            color: opp.difficulty <= 30 ? '#065f46' : opp.difficulty <= 60 ? '#92400e' : '#991b1b',
                          }}
                        >
                          KD {opp.difficulty}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 mb-0.5">{opp.topic}</h3>
                      <p className="text-sm text-blue-600 font-medium mb-2">{opp.primaryKeyword}</p>

                      {opp.reasoning && (
                        <p className="text-xs text-slate-500 mb-3 leading-relaxed">{opp.reasoning}</p>
                      )}

                      {/* Score breakdown */}
                      <div className="flex gap-5 mb-3">
                        <OpportunityScorePill label="SEO" value={opp.seoScore} color="#7c3aed" />
                        <OpportunityScorePill label="Business" value={opp.businessValue} color="#0891b2" />
                        <OpportunityScorePill label="Evergreen" value={opp.evergreenValue} color="#059669" />
                        <OpportunityScorePill label="FB" value={opp.fbReusability} color="#1d4ed8" />
                      </div>

                      {/* Content cluster */}
                      {opp.clusterTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {opp.clusterTopics.map((ct) => (
                            <span key={ct} className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              {ct}
                            </span>
                          ))}
                        </div>
                      )}

                      <OpportunityActions
                        id={opp.id}
                        topic={opp.topic}
                        primaryKeyword={opp.primaryKeyword}
                        articleType={opp.articleType}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Saved opportunities */}
        {savedOpportunities.length > 0 && (
          <section>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">
              Αποθηκευμένες Ευκαιρίες ({savedOpportunities.length})
            </h2>
            <div className="space-y-2">
              {savedOpportunities.map((opp) => (
                <div key={opp.id} className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-4">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {opp.overallScore}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{opp.topic}</p>
                    <p className="text-xs text-blue-600">{opp.primaryKeyword}</p>
                  </div>
                  <a
                    href={`/admin/evergreen`}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 shrink-0"
                  >
                    Δημιούργησε →
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {opportunities.length === 0 && savedOpportunities.length === 0 && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm mb-2">Δεν υπάρχουν ευκαιρίες ακόμα</p>
            <p className="text-slate-400 text-xs mb-6">
              Πάτησε &quot;Refresh Learning&quot; για να μάθει το σύστημα από τα δεδομένα σου,<br />
              και μετά &quot;Generate Opportunities&quot; για AI-powered προτάσεις.
            </p>
            <Link href="/admin/analytics" className="text-sm font-semibold text-red-600 hover:underline">
              Πήγαινε στο Analytics για να κάνεις FB Sync →
            </Link>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
