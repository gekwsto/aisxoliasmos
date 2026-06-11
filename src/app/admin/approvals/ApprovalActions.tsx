'use client';

import { useState, useTransition } from 'react';
import { Check, X, Globe, Loader2 } from 'lucide-react';
import { approveArticle, rejectArticle, publishArticle } from '@/actions/articles';

interface ApprovalActionsProps {
  articleId: string;
  showPublish?: boolean;
}

export default function ApprovalActions({ articleId, showPublish = false }: ApprovalActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (done) {
    return <span className="text-xs text-slate-400 italic">Ολοκληρώθηκε</span>;
  }

  const handle = (action: () => Promise<void>) => {
    startTransition(async () => {
      await action();
      setDone(true);
    });
  };

  if (showPublish) {
    return (
      <button
        onClick={() => handle(() => publishArticle(articleId))}
        disabled={isPending}
        className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 size={11} className="animate-spin" /> : <Globe size={11} />}
        Δημοσίευση
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showRejectInput ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Αιτία (προαιρετική)"
            className="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-400 w-36"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handle(() => rejectArticle(articleId, rejectNote || undefined));
              if (e.key === 'Escape') setShowRejectInput(false);
            }}
            autoFocus
          />
          <button
            onClick={() => handle(() => rejectArticle(articleId, rejectNote || undefined))}
            disabled={isPending}
            className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 size={11} className="animate-spin" /> : 'Επιβεβαίωση'}
          </button>
          <button
            onClick={() => setShowRejectInput(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => handle(() => approveArticle(articleId))}
            disabled={isPending}
            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Έγκριση
          </button>
          <button
            onClick={() => setShowRejectInput(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={13} />
            Απόρριψη
          </button>
        </>
      )}
    </div>
  );
}
