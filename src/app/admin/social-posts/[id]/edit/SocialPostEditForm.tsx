'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSocialPost } from '@/actions/social-posts';

const STATUS_OPTIONS = [
  { value: 'DRAFT',            label: 'Draft — Πρόχειρο' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval — Προς Έγκριση' },
  { value: 'APPROVED',         label: 'Approved — Εγκεκριμένο' },
  { value: 'REJECTED',         label: 'Rejected — Απορριφθέν' },
  { value: 'SCHEDULED',        label: 'Scheduled — Προγραμματισμένο' },
  { value: 'PUBLISHED',        label: 'Published — Δημοσιευμένο' },
];

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  TWITTER: 'X / Twitter',
};

interface Props {
  id: string;
  initialContent: string;
  initialStatus: string;
  initialScheduledAt: string;
  platform: string;
}

export default function SocialPostEditForm({
  id,
  initialContent,
  initialStatus,
  initialScheduledAt,
  platform,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState(initialStatus);
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.length;
  const charLimit = platform === 'TWITTER' ? 280 : 63206;
  const overLimit = charCount > charLimit && platform === 'TWITTER';

  function handleSave() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const r = await updateSocialPost(id, {
        content,
        status,
        scheduledAt: scheduledAt || null,
      });
      if (r.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Platform badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${
          platform === 'FACEBOOK' ? 'bg-blue-600' :
          platform === 'INSTAGRAM' ? 'bg-pink-600' :
          'bg-black'
        }`}>
          {PLATFORM_LABELS[platform] ?? platform}
        </span>
        <span className="text-xs text-gray-400">Post ID: {id.slice(-8)}</span>
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Κείμενο Post
          </label>
          <span className={`text-xs ${overLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            {charCount}{platform === 'TWITTER' ? ` / ${charLimit}` : ''}
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          placeholder="Γράψε το post..."
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Scheduled at */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Προγραμματισμένη Δημοσίευση{' '}
          <span className="text-gray-400 font-normal">(προαιρετικό)</span>
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={isPending || overLimit}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Αποθήκευση…
            </>
          ) : saved ? (
            '✓ Αποθηκεύτηκε'
          ) : (
            'Αποθήκευση'
          )}
        </button>

        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Άκυρο
        </button>
      </div>
    </div>
  );
}
