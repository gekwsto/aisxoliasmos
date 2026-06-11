'use client';

import { useState, useEffect } from 'react';
import { List } from 'lucide-react';
import { TocHeading } from '@/lib/toc';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  headings: TocHeading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="Πίνακας περιεχομένων"
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
        <List size={13} className="text-slate-500 dark:text-slate-400" />
        <h2 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
          Περιεχόμενα
        </h2>
      </div>
      <ul className="py-2 px-2">
        {headings.map(({ id, text, level }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={cn(
                'block px-3 py-1.5 rounded-lg text-xs leading-snug transition-colors',
                level === 3 && 'ml-3',
                activeId === id
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700/40'
              )}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
