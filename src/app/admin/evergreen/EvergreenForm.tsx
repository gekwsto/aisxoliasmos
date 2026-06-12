'use client';

import { useState, useTransition } from 'react';
import {
  generateAndSaveEvergreenArticle,
  type EvergreenInput,
  type EvergreenResult,
} from '@/actions/evergreen';
import {
  EVERGREEN_ARTICLE_TYPES,
  EVERGREEN_LENGTHS,
  evergreenArticleTypeLabels,
  evergreenLengthLabels,
} from '@/lib/ai/evergreen-schemas';
import { gradeColor } from '@/lib/seo-checker';

interface EvergreenFormProps {
  categories: { id: string; name: string; color: string }[];
}

const difficultyLabel = (v: number) => {
  if (v <= 30) return { text: 'Εύκολο', color: '#059669' };
  if (v <= 60) return { text: 'Μεσαίο', color: '#d97706' };
  return { text: 'Δύσκολο', color: '#dc2626' };
};

const intentColors: Record<string, string> = {
  Informational: '#0891b2',
  Commercial: '#7c3aed',
  Navigational: '#059669',
  Transactional: '#ea580c',
};

export default function EvergreenForm({ categories }: EvergreenFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<EvergreenResult | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState<EvergreenInput>({
    topic: '',
    primaryKeyword: '',
    secondaryKeywords: '',
    categoryId: categories[0]?.id ?? '',
    targetLength: 'medium',
    articleType: 'guide',
    estimatedDifficulty: 40,
    generateFaq: true,
    generateInternalLinks: true,
    generateSocialPosts: false,
    generateImagePrompt: true,
  });

  const diff = difficultyLabel(form.estimatedDifficulty);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    startTransition(async () => {
      const res = await generateAndSaveEvergreenArticle(form);
      if (res.ok) {
        setResult(res);
      } else {
        setError(res.error);
      }
    });
  }

  if (result && result.ok) {
    return (
      <div className="space-y-6">
        {/* Success header */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                Evergreen άρθρο δημιουργήθηκε
              </p>
              <h2 className="text-xl font-black text-slate-900 mb-3">{result.title}</h2>
              <div className="flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: gradeColor(result.seoGrade as 'A' | 'B' | 'C' | 'D' | 'F') }}
                >
                  SEO {result.seoGrade} — {result.seoScore}/100
                </span>
                <span
                  className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: intentColors[result.searchIntent] ?? '#64748b' }}
                >
                  {result.searchIntent}
                </span>
              </div>
            </div>
            <a
              href={`/admin/approvals`}
              className="shrink-0 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Προς Έγκριση →
            </a>
          </div>
        </div>

        {/* Internal link suggestions */}
        {result.internalLinkSuggestions.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wider">
              Internal Link Suggestions
            </h3>
            <div className="space-y-2">
              {result.internalLinkSuggestions.map((link, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">&quot;{link.anchorText}&quot;</span>
                    <span className="text-slate-500 mx-2">→</span>
                    <span className="text-slate-600">{link.topic}</span>
                    {link.context && (
                      <p className="text-xs text-slate-400 mt-0.5">{link.context}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content cluster */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.relatedTopics.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wider">
                Content Cluster — Σχετικά Θέματα
              </h3>
              <ul className="space-y-1.5">
                {result.relatedTopics.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-violet-500 font-bold text-xs mt-0.5">●</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.futureArticles.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wider">
                Μελλοντικά Άρθρα
              </h3>
              <ul className="space-y-1.5">
                {result.futureArticles.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-emerald-500 font-bold text-xs mt-0.5">→</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() => { setResult(null); setError(''); }}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 underline"
        >
          ← Δημιούργησε νέο evergreen άρθρο
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Topic + Keyword row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Θέμα Άρθρου *
          </label>
          <textarea
            rows={3}
            required
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="π.χ. Τι είναι το Machine Learning και πώς χρησιμοποιείται στην επιχείρηση"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Primary Keyword *
          </label>
          <input
            type="text"
            required
            value={form.primaryKeyword}
            onChange={(e) => setForm({ ...form, primaryKeyword: e.target.value })}
            placeholder="π.χ. machine learning εφαρμογές"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mt-3 mb-1.5">
            Secondary Keywords
          </label>
          <input
            type="text"
            value={form.secondaryKeywords}
            onChange={(e) => setForm({ ...form, secondaryKeywords: e.target.value })}
            placeholder="τεχνητή νοημοσύνη, deep learning, νευρωνικά δίκτυα"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-slate-400 mt-1">Χωρισμένα με κόμμα</p>
        </div>
      </div>

      {/* Category + Article Type + Length */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Κατηγορία *
          </label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Τύπος Άρθρου
          </label>
          <select
            value={form.articleType}
            onChange={(e) =>
              setForm({ ...form, articleType: e.target.value as EvergreenInput['articleType'] })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            {EVERGREEN_ARTICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {evergreenArticleTypeLabels[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Μήκος
          </label>
          <select
            value={form.targetLength}
            onChange={(e) =>
              setForm({ ...form, targetLength: e.target.value as EvergreenInput['targetLength'] })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            {EVERGREEN_LENGTHS.map((l) => (
              <option key={l} value={l}>
                {evergreenLengthLabels[l]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SEO Difficulty slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            SEO Difficulty
          </label>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: diff.color }}
          >
            {form.estimatedDifficulty} — {diff.text}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={form.estimatedDifficulty}
          onChange={(e) => setForm({ ...form, estimatedDifficulty: Number(e.target.value) })}
          className="w-full accent-red-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-0.5">
          <span>1 — Εύκολο keyword</span>
          <span>100 — Πολύ ανταγωνιστικό</span>
        </div>
      </div>

      {/* Options checkboxes */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Επιπλέον Παραγωγή
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'generateFaq', label: 'FAQ Section' },
            { key: 'generateInternalLinks', label: 'Internal Links' },
            { key: 'generateSocialPosts', label: 'Social Posts' },
            { key: 'generateImagePrompt', label: 'Image Prompt' },
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 font-medium"
            >
              <input
                type="checkbox"
                checked={form[key as keyof EvergreenInput] as boolean}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="w-4 h-4 accent-red-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
      >
        {isPending ? 'Δημιουργία evergreen άρθρου...' : 'Δημιούργησε Evergreen Άρθρο'}
      </button>

      {isPending && (
        <p className="text-center text-xs text-slate-500">
          Το AI δημιουργεί SEO-optimized περιεχόμενο — αυτό μπορεί να πάρει 30-60 δευτερόλεπτα
        </p>
      )}
    </form>
  );
}
