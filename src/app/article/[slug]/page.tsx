import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Eye } from 'lucide-react';
import { articles, getArticleBySlug, getRelatedArticles } from '@/lib/mock-data';
import { addHeadingIds, extractHeadings } from '@/lib/toc';
import CategoryBadge from '@/components/ui/CategoryBadge';
import ShareButtons from '@/components/ui/ShareButtons';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import TableOfContents from '@/components/ui/TableOfContents';
import AICommentaryBox from '@/components/ui/AICommentaryBox';
import ArticleCTA from '@/components/sections/ArticleCTA';
import ArticleCard from '@/components/articles/ArticleCard';
import TrendingSidebar from '@/components/ui/TrendingSidebar';
import { formatDate, formatNumber } from '@/lib/utils';

export async function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Άρθρο δεν βρέθηκε' };

  const canonicalUrl = `https://aisxoliasmos.com/article/${article.slug}`;

  return {
    title: `${article.title} | ΑΙΣΧΟΛΙΑΣΜΟΣ`,
    description: article.excerpt,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: canonicalUrl,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      tags: article.tags,
      images: [{ url: article.imageUrl, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.imageUrl],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  const related = getRelatedArticles(article, 3);
  const contentWithIds = addHeadingIds(article.content);
  const headings = extractHeadings(contentWithIds);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.imageUrl,
    datePublished: article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ΑΙΣΧΟΛΙΑΣΜΟΣ',
      url: 'https://aisxoliasmos.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://aisxoliasmos.com/article/${article.slug}`,
    },
    keywords: article.tags.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            crumbs={[
              { label: article.category.name, href: `/category/${article.category.slug}` },
              { label: article.title },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article main */}
          <article className="lg:col-span-2">
            {/* Category + breaking */}
            <div className="flex items-center gap-2 mb-3">
              {article.breaking && (
                <span className="bg-red-600 text-white text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Breaking
                </span>
              )}
              <CategoryBadge category={article.category} />
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-50 leading-tight mb-4">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6 border-l-4 border-red-500 pl-4">
              {article.excerpt}
            </p>

            {/* Author + meta */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  {article.author.avatar && (
                    <Image
                      src={article.author.avatar}
                      alt={article.author.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{article.author.name}</p>
                  <p className="text-slate-400 text-xs">{formatDate(article.publishedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {article.readTime} λεπτά ανάγνωσης
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={14} />
                  {formatNumber(article.views)} views
                </span>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden my-6 shadow-md">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 700px"
              />
            </div>

            {/* Article content */}
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: contentWithIds }}
            />

            {/* AI Commentary Box */}
            {article.aiCommentary && (
              <AICommentaryBox
                commentary={article.aiCommentary}
                articleTitle={article.title}
              />
            )}

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <ShareButtons title={article.title} slug={article.slug} />

            {/* Author bio */}
            <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex gap-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                {article.author.avatar && (
                  <Image
                    src={article.author.avatar}
                    alt={article.author.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{article.author.name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">{article.author.bio}</p>
              </div>
            </div>

            {/* Article CTA */}
            <ArticleCTA />

            {/* Related articles */}
            {related.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-5">
                  <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
                  Σχετικά Άρθρα
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {related.map((rel) => (
                    <ArticleCard key={rel.id} article={rel} />
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {headings.length >= 2 && (
                <TableOfContents headings={headings} />
              )}
              <TrendingSidebar />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
