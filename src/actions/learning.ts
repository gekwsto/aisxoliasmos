'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logEvent, SERVICE } from '@/lib/monitoring/events';
import { computeTopicPerformanceFromDB, updatePredictionAccuracies } from '@/lib/ai/learning-engine';
import { generateEvergreenOpportunities, type OpportunityContext } from '@/lib/ai/opportunity-engine';

// ─── Sync Topic Performance ───────────────────────────────────────────────────

export type SyncTopicResult =
  | { ok: true; topicsUpdated: number; accuraciesUpdated: number }
  | { ok: false; error: string };

export async function syncTopicPerformance(): Promise<SyncTopicResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Δεν είσαι συνδεδεμένος' };

    const [topics, accuraciesUpdated] = await Promise.all([
      computeTopicPerformanceFromDB(),
      updatePredictionAccuracies(),
    ]);

    // Upsert all topic performance records
    for (const tp of topics) {
      await prisma.topicPerformance.upsert({
        where: { topic: tp.topic },
        update: {
          category: tp.category,
          avgReach: tp.avgReach,
          avgComments: tp.avgComments,
          avgShares: tp.avgShares,
          avgReactions: tp.avgReactions,
          avgDiscussionScore: tp.avgDiscussionScore,
          avgFacebookScore: tp.avgFacebookScore,
          articleCount: tp.articleCount,
          performanceScore: tp.performanceScore,
        },
        create: {
          topic: tp.topic,
          category: tp.category,
          avgReach: tp.avgReach,
          avgComments: tp.avgComments,
          avgShares: tp.avgShares,
          avgReactions: tp.avgReactions,
          avgDiscussionScore: tp.avgDiscussionScore,
          avgFacebookScore: tp.avgFacebookScore,
          articleCount: tp.articleCount,
          performanceScore: tp.performanceScore,
        },
      });
    }

    void logEvent({
      service: SERVICE.ANALYTICS,
      type: 'learning_sync',
      status: 'OK',
      message: `Learning sync: ${topics.length} topics updated, ${accuraciesUpdated} accuracies recalculated`,
      metadata: { topicsUpdated: topics.length, accuraciesUpdated },
    });

    revalidatePath('/admin/evergreen-opportunities');
    revalidatePath('/admin/analytics');

    return { ok: true, topicsUpdated: topics.length, accuraciesUpdated };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    console.error('[syncTopicPerformance]', error);
    return { ok: false, error: message };
  }
}

// ─── Generate Evergreen Opportunities ────────────────────────────────────────

export type GenerateOpportunitiesResult =
  | { ok: true; generated: number }
  | { ok: false; error: string };

export async function generateAndStoreOpportunities(): Promise<GenerateOpportunitiesResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Δεν είσαι συνδεδεμένος' };

    // Build context from existing data
    const [
      categories,
      topTopics,
      existingEvergreen,
      trendingClusters,
      categoryStats,
    ] = await Promise.all([
      prisma.category.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
      prisma.topicPerformance.findMany({
        orderBy: { performanceScore: 'desc' },
        take: 10,
        select: { topic: true, performanceScore: true },
      }),
      prisma.article.findMany({
        where: { articleType: 'EVERGREEN', evergreenKeyword: { not: null } },
        select: { evergreenKeyword: true },
      }),
      prisma.trendCluster.findMany({
        orderBy: { lastSeenAt: 'desc' },
        take: 10,
        select: { topic: true, trendScore: true },
      }),
      prisma.category.findMany({
        select: {
          name: true,
          _count: { select: { articles: true } },
        },
      }),
    ]);

    const context: OpportunityContext = {
      categories: categories.map((c) => c.name),
      topPerformingTopics: topTopics.map((t) => ({
        topic: t.topic,
        performanceScore: Math.round(t.performanceScore),
      })),
      existingEvergreenKeywords: existingEvergreen
        .map((a) => a.evergreenKeyword)
        .filter((k): k is string => k !== null),
      recentTrendingTopics: trendingClusters.map((c) => c.topic),
      categoryStats: categoryStats.map((c) => ({
        name: c.name,
        articleCount: c._count.articles,
      })),
    };

    const opportunities = await generateEvergreenOpportunities(context, 10);

    if (opportunities.length === 0) {
      return { ok: false, error: 'Η AI δεν επέστρεψε ευκαιρίες' };
    }

    // Store in DB (replace "new" ones, keep saved/dismissed)
    await prisma.evergreenOpportunity.deleteMany({ where: { status: 'new' } });

    for (const opp of opportunities) {
      await prisma.evergreenOpportunity.create({
        data: {
          topic: opp.topic,
          primaryKeyword: opp.primaryKeyword,
          articleType: opp.articleType,
          category: opp.category,
          seoScore: opp.seoScore,
          businessValue: opp.businessValue,
          difficulty: opp.difficulty,
          evergreenValue: opp.evergreenValue,
          fbReusability: opp.fbReusability,
          overallScore: opp.overallScore,
          clusterTopics: opp.clusterTopics,
          reasoning: opp.reasoning,
          status: 'new',
        },
      });
    }

    void logEvent({
      service: SERVICE.ANALYTICS,
      type: 'opportunity_generation',
      status: 'OK',
      message: `Generated ${opportunities.length} evergreen opportunities`,
      metadata: { count: opportunities.length },
    });

    revalidatePath('/admin/evergreen-opportunities');

    return { ok: true, generated: opportunities.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    console.error('[generateAndStoreOpportunities]', error);
    return { ok: false, error: message };
  }
}

// ─── Update opportunity status ────────────────────────────────────────────────

export async function updateOpportunityStatus(
  id: string,
  status: 'saved' | 'dismissed',
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.evergreenOpportunity.update({
    where: { id },
    data: { status },
  });
  revalidatePath('/admin/evergreen-opportunities');
}
