import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, ChevronRight } from 'lucide-react';
import { Article } from '@/types';
import CategoryBadge from '@/components/ui/CategoryBadge';
import { formatRelativeDate, formatNumber } from '@/lib/utils';

interface FeaturedArticleProps {
  article: Article;
}

export default function FeaturedArticle({ article }: FeaturedArticleProps) {
  return (
    <article className="relative rounded-2xl overflow-hidden group bg-slate-900 min-h-[520px] md:min-h-[580px] lg:min-h-[640px] flex flex-col justify-end shadow-2xl">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          priority
          className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          sizes="(max-width: 1280px) 100vw, 900px"
        />
        {/* Stronger gradient for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10" />
        {/* Subtle side vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        {/* Badges row */}
        <div className="flex items-center gap-3 mb-4">
          {article.breaking && (
            <span className="bg-red-600 text-white text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Breaking
            </span>
          )}
          <CategoryBadge category={article.category} linkable={false} />
        </div>

        {/* Title */}
        <Link href={`/article/${article.slug}`}>
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-black leading-tight max-w-2xl group-hover:text-red-200 transition-colors duration-300 drop-shadow-lg">
            {article.title}
          </h1>
        </Link>

        {/* Excerpt */}
        <p className="mt-3 text-slate-200 text-sm md:text-base leading-relaxed max-w-xl line-clamp-2 drop-shadow">
          {article.excerpt}
        </p>

        {/* Meta + CTA */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-600 overflow-hidden relative border-2 border-white/20 shrink-0">
              {article.author.avatar && (
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              )}
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">{article.author.name}</p>
              <p className="text-slate-400 text-xs mt-0.5">{formatRelativeDate(article.publishedAt)}</p>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-xs ml-2 pl-3 border-l border-white/15">
              <span className="flex items-center gap-1"><Clock size={11} />{article.readTime} λεπτά</span>
              <span className="flex items-center gap-1"><Eye size={11} />{formatNumber(article.views)}</span>
            </div>
          </div>

          <Link
            href={`/article/${article.slug}`}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-bold px-6 py-3 rounded-full transition-all duration-200 shrink-0 shadow-lg hover:shadow-red-900/50 hover:scale-105"
          >
            Διάβασε το
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
