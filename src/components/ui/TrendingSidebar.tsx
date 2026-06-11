import Link from 'next/link';
import Image from 'next/image';
import { Flame, Hash } from 'lucide-react';
import { articles, trendingTopics, categories } from '@/lib/mock-data';
import CategoryBadge from './CategoryBadge';
import { formatNumber } from '@/lib/utils';

export default function TrendingSidebar() {
  const popular = [...articles].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <aside className="space-y-6">
      {/* Popular articles */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <Flame size={15} className="text-red-500" />
          <h2 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-widest">
            Δημοφιλέστερα Σήμερα
          </h2>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {popular.map((article, index) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="flex gap-3 px-4 py-3 group hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
            >
              {/* Ranking number */}
              <span
                className={`text-xl font-black leading-none w-6 shrink-0 pt-0.5 ${
                  index === 0
                    ? 'text-red-500'
                    : index === 1
                    ? 'text-orange-400'
                    : index === 2
                    ? 'text-amber-400'
                    : 'text-slate-200 dark:text-slate-600'
                }`}
              >
                {index + 1}
              </span>

              {/* Article info */}
              <div className="flex-1 min-w-0">
                <CategoryBadge category={article.category} size="sm" linkable={false} />
                <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-red-600 transition-colors leading-snug">
                  {article.title}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {formatNumber(article.views)} views
                </p>
              </div>

              {/* Thumbnail */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Hot topics */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <Hash size={15} className="text-violet-600" />
          <h2 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-widest">
            Hot Topics
          </h2>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-2">
          {trendingTopics.map((topic) => (
            <div key={topic.label} className="group cursor-pointer">
              <span className="inline-flex flex-col bg-slate-50 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-600 hover:border-red-200 rounded-lg px-3 py-2 transition-colors">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-red-700 dark:group-hover:text-red-400">
                  {topic.label}
                </span>
                <span className="text-[10px] text-slate-400">{topic.count}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <h2 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-widest">
            Κατηγορίες
          </h2>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`}>
              <CategoryBadge category={cat} size="md" linkable={false} />
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
