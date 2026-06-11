import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye } from 'lucide-react';
import { Article } from '@/types';
import CategoryBadge from '@/components/ui/CategoryBadge';
import { formatRelativeDate, formatNumber } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'horizontal' | 'compact';
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  if (variant === 'horizontal') {
    return (
      <article className="flex gap-4 group">
        <Link href={`/article/${article.slug}`} className="shrink-0">
          <div className="relative w-28 h-20 rounded-lg overflow-hidden">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="112px"
            />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <CategoryBadge category={article.category} size="sm" />
          <Link href={`/article/${article.slug}`}>
            <h3 className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-red-600 transition-colors leading-snug">
              {article.title}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatRelativeDate(article.publishedAt)}</p>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="group border-b border-slate-100 dark:border-slate-700 pb-3 last:border-0 last:pb-0">
        <CategoryBadge category={article.category} size="sm" />
        <Link href={`/article/${article.slug}`}>
          <h3 className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-red-600 transition-colors">
            {article.title}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-slate-400">{formatRelativeDate(article.publishedAt)}</p>
      </article>
    );
  }

  return (
    <article className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md dark:hover:shadow-slate-900/50 transition-shadow group flex flex-col">
      <Link href={`/article/${article.slug}`} className="relative block aspect-[16/9] overflow-hidden">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {article.breaking && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            Breaking
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <CategoryBadge category={article.category} />

        <Link href={`/article/${article.slug}`} className="mt-2 flex-1">
          <h2 className="font-bold text-slate-900 dark:text-slate-50 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors text-[15px]">
            {article.title}
          </h2>
        </Link>

        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">
          {article.excerpt}
        </p>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden relative">
              {article.author.avatar && (
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              )}
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{article.author.name}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <span className="flex items-center gap-1"><Clock size={11} />{article.readTime} λεπτά</span>
            <span className="flex items-center gap-1"><Eye size={11} />{formatNumber(article.views)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
