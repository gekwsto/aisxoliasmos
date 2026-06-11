import { Article } from '@/types';
import ArticleCard from './ArticleCard';

interface ArticleGridProps {
  articles: Article[];
  columns?: 2 | 3 | 4;
  title?: string;
  showViewAll?: string;
}

export default function ArticleGrid({
  articles,
  columns = 3,
  title,
  showViewAll,
}: ArticleGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section>
      {title && (
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
            {title}
          </h2>
          {showViewAll && (
            <a href={showViewAll} className="text-sm text-red-600 hover:text-red-700 font-semibold">
              Δες όλα →
            </a>
          )}
        </div>
      )}
      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-5`}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
