import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/seo';
import { CLUSTERS } from '@/services/evergreen-clusters';
import { ArticleType } from '@/generated/prisma/enums';

export const dynamic = 'force-dynamic';

const SITEMAP_SPLIT_THRESHOLD = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true, publishedAt: true, articleType: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/articles`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/editorial-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/ai-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/transparency`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const topicPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/topics`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...CLUSTERS.map((cluster) => ({
      url: `${SITE_URL}/topics/${cluster.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/category/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => {
    const lastMod = a.updatedAt ?? a.publishedAt ?? now;
    const isEvergreen = a.articleType === ArticleType.EVERGREEN;
    const ageDays = (Date.now() - lastMod.getTime()) / 86_400_000;
    return {
      url: `${SITE_URL}/article/${a.slug}`,
      lastModified: lastMod,
      changeFrequency: (ageDays < 7 ? 'daily' : ageDays < 30 ? 'weekly' : 'monthly') as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: isEvergreen ? 0.8 : ageDays < 7 ? 0.7 : 0.6,
    };
  });

  const allUrls = [...staticPages, ...topicPages, ...categoryPages, ...articlePages];

  if (allUrls.length > SITEMAP_SPLIT_THRESHOLD) {
    console.warn(
      `[sitemap] ${allUrls.length} URLs exceed threshold of ${SITEMAP_SPLIT_THRESHOLD}. ` +
      'Consider enabling sitemap index via generateSitemaps() when approaching 50000 URL limit.'
    );
  }

  return allUrls;
}
