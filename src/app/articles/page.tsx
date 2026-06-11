import type { Metadata } from 'next';
import { articles, categories } from '@/lib/mock-data';
import ArticleCard from '@/components/articles/ArticleCard';
import TrendingSidebar from '@/components/ui/TrendingSidebar';

export const metadata: Metadata = {
  title: 'Όλα τα Άρθρα',
  description: 'Εξερεύνησε όλα τα άρθρα του AI Σχολιασμός — AI, Τεχνολογία, Οικονομία, Viral και πολλά άλλα.',
};

export default function ArticlesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Όλα τα Άρθρα</h1>
        <p className="text-slate-500">
          {articles.length} άρθρα σε {categories.length} κατηγορίες
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-slate-200">
        <a
          href="/articles"
          className="px-4 py-2 rounded-full text-sm font-semibold bg-slate-900 text-white"
        >
          Όλα
        </a>
        {categories.map((cat) => (
          <a
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${cat.bgColor} ${cat.color} ${cat.borderColor} hover:opacity-80`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      {/* Grid + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <TrendingSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
