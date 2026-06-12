'use client';

import { useTransition } from 'react';
import { updateOpportunityStatus } from '@/actions/learning';

interface Props {
  id: string;
  topic: string;
  primaryKeyword: string;
  articleType: string;
}

export default function OpportunityActions({ id, topic, primaryKeyword, articleType }: Props) {
  const [pending, startTransition] = useTransition();

  const evergreenUrl = `/admin/evergreen?topic=${encodeURIComponent(topic)}&keyword=${encodeURIComponent(primaryKeyword)}&type=${articleType}`;

  return (
    <div className="flex items-center gap-2 mt-3">
      <a
        href={evergreenUrl}
        className="text-xs font-semibold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
      >
        Δημιούργησε →
      </a>
      <button
        onClick={() => startTransition(() => updateOpportunityStatus(id, 'saved'))}
        disabled={pending}
        className="text-xs font-medium px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
      >
        Αποθήκευσε
      </button>
      <button
        onClick={() => startTransition(() => updateOpportunityStatus(id, 'dismissed'))}
        disabled={pending}
        className="text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors disabled:opacity-50"
      >
        Αγνόησε
      </button>
    </div>
  );
}
