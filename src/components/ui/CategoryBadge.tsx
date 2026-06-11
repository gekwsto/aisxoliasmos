import Link from 'next/link';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
  linkable?: boolean;
}

export default function CategoryBadge({
  category,
  size = 'md',
  linkable = true,
}: CategoryBadgeProps) {
  const classes = cn(
    'inline-flex items-center font-semibold rounded-full border tracking-wide',
    category.color,
    category.bgColor,
    category.borderColor,
    size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  );

  if (linkable) {
    return (
      <Link href={`/category/${category.slug}`} className={cn(classes, 'hover:opacity-80 transition-opacity')}>
        {category.name}
      </Link>
    );
  }

  return <span className={classes}>{category.name}</span>;
}
