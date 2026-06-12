import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BASE = 'https://aisxoliasmos.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/editorial-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE}/ai-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE}/transparency`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => {
    const lastMod = a.updatedAt ?? a.publishedAt ?? new Date();
    const ageDays = (Date.now() - lastMod.getTime()) / 86_400_000;
    return {
      url: `${BASE}/article/${a.slug}`,
      lastModified: lastMod,
      changeFrequency: (ageDays < 7 ? 'daily' : ageDays < 30 ? 'weekly' : 'monthly') as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: ageDays < 7 ? 0.9 : ageDays < 30 ? 0.7 : 0.5,
    };
  });

  return [...staticPages, ...categoryPages, ...articlePages];
}
