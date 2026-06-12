'use client';

import { useTransition, useState } from 'react';
import { syncTopicPerformance, generateAndStoreOpportunities } from '@/actions/learning';

export default function LearningClient() {
  const [syncPending, startSync] = useTransition();
  const [genPending, startGen] = useTransition();
  const [syncMsg, setSyncMsg] = useState('');
  const [genMsg, setGenMsg] = useState('');

  function handleSync() {
    setSyncMsg('');
    startSync(async () => {
      const res = await syncTopicPerformance();
      setSyncMsg(
        res.ok
          ? `✓ ${res.topicsUpdated} θέματα ενημερώθηκαν, ${res.accuraciesUpdated} ακρίβειες επαναϋπολογίστηκαν`
          : `✗ ${res.error}`,
      );
    });
  }

  function handleGenerate() {
    setGenMsg('');
    startGen(async () => {
      const res = await generateAndStoreOpportunities();
      setGenMsg(
        res.ok
          ? `✓ ${res.generated} νέες ευκαιρίες δημιουργήθηκαν`
          : `✗ ${res.error}`,
      );
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <div>
        <button
          onClick={handleSync}
          disabled={syncPending || genPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {syncPending ? (
            <>
              <span className="animate-spin text-xs">⟳</span> Συγχρονισμός...
            </>
          ) : (
            '↻ Refresh Learning'
          )}
        </button>
        {syncMsg && (
          <p className={`text-xs mt-1 ${syncMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>
            {syncMsg}
          </p>
        )}
      </div>

      <div>
        <button
          onClick={handleGenerate}
          disabled={syncPending || genPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {genPending ? (
            <>
              <span className="animate-spin text-xs">⟳</span> Δημιουργία...
            </>
          ) : (
            '✦ Generate Opportunities'
          )}
        </button>
        {genMsg && (
          <p className={`text-xs mt-1 ${genMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>
            {genMsg}
          </p>
        )}
      </div>
    </div>
  );
}
