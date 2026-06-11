'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchFeed } from '@/lib/rss/fetcher';
import { generateArticleContent } from '@/lib/ai/content-generator';
import { ArticleStatus, SourceType, SocialPostStatus, DiscoveredStatus } from '@/generated/prisma/enums';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Δεν είσαι συνδεδεμένος');
  return session.user;
}

function estimateReadTime(html: string): number {
  const wordCount = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

async function uniqueSlug(base: string): Promise<string> {
  const safe = base.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'article';
  const existing = await prisma.article.findUnique({ where: { slug: safe } });
  if (!existing) return safe;
  let suffix = 2;
  while (true) {
    const candidate = `${safe}-${suffix}`;
    if (!(await prisma.article.findUnique({ where: { slug: candidate } }))) return candidate;
    suffix++;
  }
}

// ─── Internal fetch logic ──────────────────────────────────────────────────────

async function _fetchSource(sourceId: string): Promise<{ newCount: number; totalCount: number }> {
  const source = await prisma.rssSource.findUniqueOrThrow({
    where: { id: sourceId },
    select: { id: true, url: true, categoryId: true },
  });

  const items = await fetchFeed(source.url);
  if (items.length === 0) {
    await prisma.rssSource.update({ where: { id: sourceId }, data: { lastFetchedAt: new Date() } });
    return { newCount: 0, totalCount: 0 };
  }

  const urls = items.map((i) => i.url);
  const existing = await prisma.discoveredArticle.findMany({
    where: { url: { in: urls } },
    select: { url: true },
  });
  const existingUrls = new Set(existing.map((e) => e.url));
  const newItems = items.filter((i) => !existingUrls.has(i.url));

  if (newItems.length > 0) {
    await prisma.discoveredArticle.createMany({
      data: newItems.map((item) => ({
        sourceId: source.id,
        title: item.title,
        url: item.url,
        excerpt: item.excerpt || null,
        publishedAt: item.publishedAt,
        categoryId: source.categoryId,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.rssSource.update({
    where: { id: sourceId },
    data: { lastFetchedAt: new Date() },
  });

  return { newCount: newItems.length, totalCount: items.length };
}

// ─── Public server actions ─────────────────────────────────────────────────────

export type FetchResult =
  | { ok: true; newCount: number; totalCount: number }
  | { ok: false; error: string };

export async function fetchSourceNow(sourceId: string): Promise<FetchResult> {
  try {
    await requireAuth();
    const result = await _fetchSource(sourceId);
    revalidatePath('/admin/news-discovery');
    revalidatePath('/admin/sources');
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Άγνωστο σφάλμα' };
  }
}

export type FetchAllResult =
  | { ok: true; results: Array<{ sourceName: string; newCount: number; error?: string }> }
  | { ok: false; error: string };

export async function fetchAllSources(): Promise<FetchAllResult> {
  try {
    await requireAuth();

    const sources = await prisma.rssSource.findMany({
      where: { enabled: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const settled = await Promise.allSettled(
      sources.map((s) => _fetchSource(s.id).then((r) => ({ sourceName: s.name, newCount: r.newCount })))
    );

    const results = settled.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { sourceName: sources[i].name, newCount: 0, error: r.reason?.message ?? 'Error' }
    );

    revalidatePath('/admin/news-discovery');
    revalidatePath('/admin/sources');

    return { ok: true, results };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Άγνωστο σφάλμα' };
  }
}

export type ToggleResult = { ok: true } | { ok: false; error: string };

export async function toggleRssSource(sourceId: string, enabled: boolean): Promise<ToggleResult> {
  try {
    await requireAuth();
    await prisma.rssSource.update({ where: { id: sourceId }, data: { enabled } });
    revalidatePath('/admin/sources');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Άγνωστο σφάλμα' };
  }
}

export type GenerateFromDiscoveredResult =
  | { ok: true; articleId: string; title: string }
  | { ok: false; error: string };

export async function generateDraftFromDiscoveredArticle(
  discoveredId: string
): Promise<GenerateFromDiscoveredResult> {
  try {
    const user = await requireAuth();

    const discovered = await prisma.discoveredArticle.findUniqueOrThrow({
      where: { id: discoveredId },
      include: {
        category: { select: { id: true, name: true } },
        source: { select: { name: true } },
      },
    });

    if (discovered.status !== DiscoveredStatus.NEW) {
      return { ok: false, error: 'Το άρθρο έχει ήδη επεξεργαστεί' };
    }

    const topic =
      discovered.title +
      (discovered.excerpt ? '\n\n' + discovered.excerpt : '') +
      '\n\nΠηγή: ' + discovered.source.name;

    const generated = await generateArticleContent({
      topic,
      categoryName: discovered.category.name,
      tone: 'informative',
      articleType: 'summary',
      targetLength: 'medium',
      sourceUrl: discovered.url,
      generateFacebookPost: true,
      generateAiCommentary: true,
    });

    const slug = await uniqueSlug(generated.slug || 'article');

    const article = await prisma.article.create({
      data: {
        title: generated.title,
        slug,
        excerpt: generated.excerpt,
        content: generated.contentHtml,
        aiCommentary: generated.aiCommentary || null,
        seoTitle: generated.seoTitle || null,
        seoDescription: generated.seoDescription || null,
        status: ArticleStatus.PENDING_APPROVAL,
        sourceType: SourceType.RSS_SUMMARY,
        categoryId: discovered.categoryId,
        authorId: user.id,
        readTime: estimateReadTime(generated.contentHtml),
      },
    });

    await prisma.aiDraft.create({
      data: {
        articleId: article.id,
        prompt: topic,
        rawOutput: JSON.stringify(generated),
        model: 'gpt-4o',
        imagePrompt: generated.imagePrompt || null,
      },
    });

    if (generated.facebookPost) {
      await prisma.socialPost.create({
        data: {
          articleId: article.id,
          platform: 'FACEBOOK',
          content: generated.facebookPost,
          status: SocialPostStatus.DRAFT,
        },
      });
    }

    for (const tagName of generated.tags) {
      const trimmed = tagName.trim();
      if (!trimmed) continue;
      const tag = await prisma.tag.upsert({
        where: { name: trimmed },
        update: {},
        create: { name: trimmed },
      });
      await prisma.articleTag.upsert({
        where: { articleId_tagId: { articleId: article.id, tagId: tag.id } },
        update: {},
        create: { articleId: article.id, tagId: tag.id },
      });
    }

    await prisma.discoveredArticle.update({
      where: { id: discoveredId },
      data: { status: DiscoveredStatus.DRAFT_CREATED },
    });

    revalidatePath('/admin/news-discovery');
    revalidatePath('/admin/approvals');

    return { ok: true, articleId: article.id, title: generated.title };
  } catch (err) {
    console.error('[generateDraftFromDiscoveredArticle]', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Άγνωστο σφάλμα' };
  }
}

export type IgnoreResult = { ok: true } | { ok: false; error: string };

export async function ignoreDiscoveredArticle(discoveredId: string): Promise<IgnoreResult> {
  try {
    await requireAuth();
    await prisma.discoveredArticle.update({
      where: { id: discoveredId },
      data: { status: DiscoveredStatus.IGNORED },
    });
    revalidatePath('/admin/news-discovery');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Άγνωστο σφάλμα' };
  }
}
