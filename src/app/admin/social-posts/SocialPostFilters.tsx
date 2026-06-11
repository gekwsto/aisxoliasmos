'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useRef } from 'react';

interface Props {
  currentStatus: string;
  currentPlatform: string;
  currentSearch: string;
  currentDate: string;
}

const statusOptions = [
  { value: '', label: 'Όλα' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Προς Έγκριση' },
  { value: 'APPROVED', label: 'Εγκεκριμένα' },
  { value: 'PUBLISHED', label: 'Δημοσιευμένα' },
  { value: 'REJECTED', label: 'Απορριφθέντα' },
];

const platformOptions = [
  { value: '', label: 'Όλες Πλατφόρμες' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TWITTER', label: 'Twitter / X' },
];

export default function SocialPostFilters({
  currentStatus,
  currentPlatform,
  currentSearch,
  currentDate,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = {
      status: currentStatus,
      platform: currentPlatform,
      q: currentSearch,
      date: currentDate,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    return params.toString();
  }

  function navigate(overrides: Record<string, string>) {
    router.push(`${pathname}?${buildParams(overrides)}`);
  }

  return (
    <div className="space-y-3">
      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => navigate({ status: opt.value })}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              currentStatus === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Platform + date + search */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={currentPlatform}
          onChange={(e) => navigate({ platform: e.target.value })}
          className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {platformOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <input
          type="date"
          value={currentDate}
          onChange={(e) => navigate({ date: e.target.value })}
          className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ q: searchRef.current?.value ?? '' });
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={searchRef}
            type="search"
            defaultValue={currentSearch}
            placeholder="Αναζήτηση άρθρου…"
            className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
          />
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors"
          >
            Εφαρμογή
          </button>
        </form>
      </div>
    </div>
  );
}
