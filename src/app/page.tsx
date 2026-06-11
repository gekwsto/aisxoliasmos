import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { articles, featuredArticle, categories } from '@/lib/mock-data';
import FeaturedArticle from '@/components/articles/FeaturedArticle';
import ArticleCard from '@/components/articles/ArticleCard';
import ArticleGrid from '@/components/articles/ArticleGrid';
import TrendingSidebar from '@/components/ui/TrendingSidebar';
import NewsletterSection from '@/components/sections/NewsletterSection';
import DiscussionTopics from '@/components/sections/DiscussionTopics';

export const metadata: Metadata = {
  title: 'AI Σχολιασμός — Η επικαιρότητα με έξυπνο σχολιασμό',
  description:
    'Ενημερωτικό portal για AI, Τεχνολογία, Οικονομία, Επιχειρηματικότητα και ό,τι αξίζει να ξέρεις.',
};

export default function HomePage() {
  const latestArticles = articles.filter((a) => !a.featured).slice(0, 6);
  const aiArticles = articles.filter((a) => a.category.slug === 'ai').slice(0, 3);
  const viralArticles = articles.filter((a) => a.category.slug === 'viral').slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero: Featured + latest 4 in column */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-2">
          <FeaturedArticle article={featuredArticle} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-red-600 rounded-full" />
              Τελευταία
            </h2>
            <Link href="/articles" className="text-xs text-red-600 hover:text-red-700 font-semibold">
              Όλα →
            </Link>
          </div>
          {articles.slice(1, 5).map((article) => (
            <ArticleCard key={article.id} article={article} variant="horizontal" />
          ))}
        </div>
      </section>

      {/* Main 2/3 + Sidebar 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          <ArticleGrid
            articles={latestArticles}
            columns={2}
            title="Νέα Άρθρα"
            showViewAll="/articles"
          />

          {aiArticles.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-violet-500 rounded-full inline-block" />
                  Τεχνητή Νοημοσύνη
                </h2>
                <Link
                  href="/category/ai"
                  className="text-sm text-violet-600 hover:text-violet-700 font-semibold"
                >
                  Δες όλα →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {aiArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}

          {viralArticles.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-pink-500 rounded-full inline-block" />
                  Viral
                </h2>
                <Link
                  href="/category/viral"
                  className="text-sm text-pink-600 hover:text-pink-700 font-semibold"
                >
                  Δες όλα →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {viralArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}

          <DiscussionTopics />

          <NewsletterSection />
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <TrendingSidebar />
          </div>
        </div>
      </div>

      {/* Categories quick links */}
      <section className="mt-16 bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-xl font-black text-slate-900 text-center mb-6">
          Εξερεύνησε τις Κατηγορίες
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              {cat.name}
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
