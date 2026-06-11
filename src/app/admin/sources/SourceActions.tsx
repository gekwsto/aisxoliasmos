'use client';

import { useState, useTransition } from 'react';
import { fetchSourceNow, toggleRssSource } from '@/actions/rss';

interface Props {
  sourceId: string;
  enabled: boolean;
}

export default function SourceActions({ sourceId, enabled }: Props) {
  const [isFetching, startFetchTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();
  const [fetchResult, setFetchResult] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {/* Fetch now */}
      <div className="flex flex-col items-end gap-0.5">
        <button
          disabled={isFetching || !enabled}
          onClick={() => {
            setFetchResult(null);
            startFetchTransition(async () => {
              const r = await fetchSourceNow(sourceId);
              setFetchResult(
                r.ok
                  ? r.newCount > 0
                    ? `+${r.newCount} νέα`
                    : 'Χωρίς νέα'
                  : `⚠ ${r.error.slice(0, 40)}`
              );
            });
          }}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isFetching ? (
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Fetching…
            </span>
          ) : (
            'Fetch Now'
          )}
        </button>
        {fetchResult && (
          <span
            className={`text-[10px] font-medium ${
              fetchResult.startsWith('⚠') ? 'text-red-500' : 'text-green-600 dark:text-green-400'
            }`}
          >
            {fetchResult}
          </span>
        )}
      </div>

      {/* Enable / Disable toggle */}
      <button
        disabled={isToggling}
        onClick={() =>
          startToggleTransition(async () => {
            await toggleRssSource(sourceId, !enabled);
          })
        }
        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          enabled
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
        }`}
      >
        {enabled ? 'On' : 'Off'}
      </button>
    </div>
  );
}
