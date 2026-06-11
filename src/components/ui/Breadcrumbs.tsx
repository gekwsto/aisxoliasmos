import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export default function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
      <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0">
        <Home size={13} />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-red-600 dark:hover:text-red-400 transition-colors truncate">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
