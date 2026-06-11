import { Sparkles } from 'lucide-react';

interface AICommentaryBoxProps {
  commentary: string;
  articleTitle?: string;
}

export default function AICommentaryBox({ commentary, articleTitle }: AICommentaryBoxProps) {
  return (
    <aside
      aria-label="AI Σχολιασμός"
      className="relative my-8 rounded-2xl overflow-hidden border border-violet-200 dark:border-violet-800/50 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 shadow-sm"
    >
      {/* Decorative bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />

      <div className="px-5 py-5 sm:px-6 sm:py-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-600 text-white shrink-0">
            <Sparkles size={14} />
          </div>
          <span className="font-black text-violet-700 dark:text-violet-300 text-sm uppercase tracking-wider">
            🤖 AI Σχολιασμός
          </span>
          <span className="ml-auto text-[10px] font-medium text-violet-400 dark:text-violet-500 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
            MOCK · Demo
          </span>
        </div>

        {articleTitle && (
          <p className="text-xs text-violet-400 dark:text-violet-500 mb-2 font-medium">
            Σχολιασμός για: «{articleTitle}»
          </p>
        )}

        {/* Commentary text */}
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
          {commentary}
        </p>

        <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 italic">
          Αυτός ο σχολιασμός παράγεται από AI και αντιπροσωπεύει μια αυτόματη ανάλυση. Δεν αποτελεί δημοσιογραφική γνώμη.
        </p>
      </div>
    </aside>
  );
}
