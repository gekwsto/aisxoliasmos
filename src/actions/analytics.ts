'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { FacebookClient } from '@/lib/social/facebook';
import { logEvent, SERVICE } from '@/lib/monitoring/events';
import { SocialPlatform } from '@/generated/prisma/enums';
import { computeTopicPerformanceFromDB, updatePredictionAccuracies } from '@/lib/ai/learning-engine';

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
}

export type SyncResult =
  | { ok: true; synced: number; skipped: number }
  | { ok: false; error: string };

export async function syncFacebookAnalytics(): Promise<SyncResult> {
  try {
    await requireAuth();

    const publishedPosts = await prisma.socialPost.findMany({
      where: {
        platform: SocialPlatform.FACEBOOK,
        status: 'PUBLISHED',
        externalPostId: { not: null },
      },
      select: { id: true, externalPostId: true, performance: { select: { id: true } } },
      take: 50,
    });

    let synced = 0;
    let skipped = 0;

    for (const post of publishedPosts) {
      if (!post.externalPostId) { skipped++; continue; }

      const insights = await FacebookClient.getInsights(post.externalPostId);
      if (!insights) { skipped++; continue; }

      await prisma.postPerformance.upsert({
        where: { socialPostId: post.id },
        create: {
          socialPostId: post.id,
          actualReactions: insights.reactions,
          actualComments: insights.comments,
          actualShares: insights.shares,
          actualReach: insights.reach,
          lastSyncedAt: new Date(),
        },
        update: {
          actualReactions: insights.reactions,
          actualComments: insights.comments,
          actualShares: insights.shares,
          actualReach: insights.reach,
          lastSyncedAt: new Date(),
        },
      });
      synced++;
    }

    // Background: refresh topic performance learning after FB sync
    void (async () => {
      try {
        const [topics, accuracies] = await Promise.all([
          computeTopicPerformanceFromDB(),
          updatePredictionAccuracies(),
        ]);
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
          message: `Learning auto-sync: ${topics.length} topics, ${accuracies} accuracies`,
        });
      } catch {
        // silent — learning is non-critical
      }
    })();

    void logEvent({
      service: SERVICE.ANALYTICS,
      type: 'fb_sync',
      status: 'OK',
      message: `Facebook analytics synced: ${synced} updated, ${skipped} skipped`,
      metadata: { synced, skipped, total: publishedPosts.length },
    });

    revalidatePath('/admin/analytics');
    return { ok: true, synced, skipped };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error';
    void logEvent({
      service: SERVICE.ANALYTICS,
      type: 'fb_sync',
      status: 'ERROR',
      message: `Facebook analytics sync failed: ${message}`,
    });
    return { ok: false, error: message };
  }
}
