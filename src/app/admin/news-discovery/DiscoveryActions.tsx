'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { generateDraftFromDiscoveredArticle, ignoreDiscoveredArticle } from '@/actions/rss';

interface Props {
  articleId: string;
  status: string;
}

export default function DiscoveryActions({ articleId, status }: Props) {
  const [isDrafting, startDraftTransition] = useTransition();
  const [isIgnoring, startIgnoreTransition] = useTransition();
  const [draftResult, setDraftResult] = useState<{ articleId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Already processed — show badge only (page will revalidate and show updated status)
  if (status === 'DRAFT_CREATED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Draft
      </span>
    );
  }

  if (status === 'IGNORED') {
    return (
      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
        Αγνοήθηκε
      </span>
    );
  }

  // Draft just created in this session — show link immediately
  if (draftResult) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">✅ Draft</span>
        <Link
          href={`/admin/articles/${draftResult.articleId}/edit`}
          className="text-xs text-indigo-600 dark:text-indigo-400 underline hover:no-underline"
        >
          Επεξεργασία
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        {/* Generate AI Draft */}
        <button
          disabled={isDrafting || isIgnoring}
          onClick={() => {
            setError(null);
            startDraftTransition(async () => {
              const r = await generateDraftFromDiscoveredArticle(articleId);
              if (r.ok) {
                setDraftResult({ articleId: r.articleId });
              } else {
                setError(r.error);
              }
            });
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isDrafting ? (
            <>
              <svg className="h-3 w-3 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Δημιουργία…
            </>
          ) : (
            <>
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI Draft
            </>
          )}
        </button>

        {/* Ignore */}
        <button
          disabled={isDrafting || isIgnoring}
          onClick={() => {
            setError(null);
            startIgnoreTransition(async () => {
              const r = await ignoreDiscoveredArticle(articleId);
              if (!r.ok) setError(r.error);
            });
          }}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isIgnoring ? '…' : 'Ignore'}
        </button>
      </div>

      {error && (
        <p className="text-[10px] text-red-500 max-w-[200px] leading-tight">{error}</p>
      )}
    </div>
  );
}
