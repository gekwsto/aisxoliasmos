import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categories, getArticlesByCategory, getCategoryBySlug } from '@/lib/mock-data';
import ArticleCard from '@/components/articles/ArticleCard';
import CategoryBadge from '@/components/ui/CategoryBadge';
import TrendingSidebar from '@/components/ui/TrendingSidebar';

export async function generateStaticParams() {
  return categories.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: 'Κατηγορία δεν βρέθηκε' };

  return {
    title: `${category.name} — Άρθρα`,
    description: `Τα τελευταία άρθρα για ${category.name} από το AI Σχολιασμός.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) notFound();

  const categoryArticles = getArticlesByCategory(slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category header */}
      <div className={`rounded-2xl p-8 mb-8 ${category.bgColor} border ${category.borderColor}`}>
        <CategoryBadge category={category} linkable={false} size="md" />
        <h1 className={`text-3xl font-black mt-3 mb-2 ${category.color}`}>
          {category.name}
        </h1>
        <p className="text-slate-600 text-sm">
          {categoryArticles.length > 0
            ? `${categoryArticles.length} άρθρα στην κατηγορία`
            : 'Δεν υπάρχουν άκομα άρθρα σε αυτή την κατηγορία'}
        </p>
      </div>

      {/* All categories quick nav */}
      <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-slate-200">
        {categories.map((cat) => (
          <a
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              cat.slug === slug
                ? `${cat.bgColor} ${cat.color} ${cat.borderColor}`
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      {/* Articles + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {categoryArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {categoryArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <p className="text-5xl mb-4">📭</p>
              <p className="font-semibold text-lg">Δεν υπάρχουν άρθρα ακόμα</p>
              <p className="text-sm mt-1">Ελέγξτε ξανά σύντομα!</p>
            </div>
          )}
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
