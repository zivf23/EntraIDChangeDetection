import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { 
  InfoIcon, 
  CodeIcon, 
  PlusCircleIcon, 
  MinusCircleIcon, 
  AlertCircleIcon, 
  SparklesIcon, 
  RefreshIcon 
} from './Icons.js';

// === Inner Components ===

// Change Item with memoized icon
const ChangeItem = ({ change }) => {
  const { icon, colorClass, text } = useMemo(() => {
    const lower = (change || '').toLowerCase();
    if (lower.includes('added') || lower.includes('נוצרה')) {
      return { icon: <PlusCircleIcon />, colorClass: 'text-green-300', text: change };
    }
    if (lower.includes('modified') || lower.includes('עודכנה')) {
      return { icon: <AlertCircleIcon />, colorClass: 'text-yellow-300', text: change };
    }
    if (lower.includes('deleted') || lower.includes('נמחקה')) {
      return { icon: <MinusCircleIcon />, colorClass: 'text-red-300', text: change };
    }
    return { icon: <InfoIcon />, colorClass: 'text-sky-300', text: change };
  }, [change]);

  return (
    <li className={`flex items-start gap-3 ${colorClass}`}>
      <span className="flex-shrink-0 mt-1 w-5 h-5" aria-hidden="true">{icon}</span>
      <span>{text}</span>
    </li>
  );
};

// Explanation sanitized HTML
const ExplanationContent = ({ content }) => {
  if (!content) return null;
  const cleanHtml = DOMPurify.sanitize(content);
  return (
    <div
      className="text-slate-300 prose prose-invert prose-sm"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
      aria-label="תוכן ניתוח GPT מסונן"
    />
  );
};

// Explanation Section
const ExplanationSection = ({ explanation }) => {
  if (!explanation) return null;
  return (
    <div className="bg-slate-900/50 rounded-lg p-4" aria-label="חלק ניתוח GPT">
      <div className="flex items-center text-lg font-semibold text-violet-400 mb-3">
        <SparklesIcon aria-hidden="true" />
        <span>ניתוח GPT</span>
      </div>
      <ExplanationContent content={explanation} />
    </div>
  );
};

// === Main Component ===
const SnapshotDetail = ({ snapshot, isLoading, onShowConfig, error }) => {
  // Always compute derived values safely at the top
  const hasPreviousConfig = useMemo(() => !!snapshot?.previous_config, [snapshot]);
  const isInitialSnapshot = useMemo(() => snapshot?.changes?.some(c => c?.includes('Initial configuration')), [snapshot]);
  const formattedDate = useMemo(() => {
    if (!snapshot?.timestamp) return 'N/A';
    try {
      return new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' })
        .format(new Date(snapshot.timestamp));
    } catch {
      return 'Invalid Date';
    }
  }, [snapshot]);

  // === Loading State ===
  if (isLoading) {
    return (
      <main className="flex-grow panel p-6 flex items-center justify-center" aria-busy="true">
        <div className="text-center text-slate-500">
          <RefreshIcon isRefreshing={true} aria-hidden="true" />
          <p className="mt-2">טוען פרטי Snapshot...</p>
        </div>
      </main>
    );
  }

  // === Error State ===
  if (error) {
    return (
      <main className="flex-grow panel p-6 flex items-center justify-center" role="alert">
        <div className="text-center text-red-400">
          <AlertCircleIcon className="w-10 h-10 mx-auto" aria-hidden="true" />
          <p className="mt-2 font-semibold">שגיאה בטעינת הנתונים</p>
          <p className="text-sm text-slate-400">{error.message}</p>
        </div>
      </main>
    );
  }

  // === No snapshot selected ===
  if (!snapshot) {
    return (
      <main className="flex-grow panel p-6 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <InfoIcon className="w-10 h-10 mx-auto" aria-hidden="true" />
          <p className="mt-2">בחר נקודת זמן מהרשימה כדי לראות פרטים.</p>
        </div>
      </main>
    );
  }

  // === Main Content ===
  return (
    <main className="flex-grow panel p-6 h-full overflow-y-auto fade-in" aria-labelledby="snapshot-title">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 id="snapshot-title" className="text-2xl font-bold text-white">פרטי Snapshot</h2>
          <p className="text-slate-400" aria-label={`תאריך צילום: ${formattedDate}`}>{formattedDate}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onShowConfig('current')}
            className="btn-secondary"
            aria-label="הצג את התצורה הנוכחית"
          >
            <CodeIcon aria-hidden="true" /> הצג תצורה
          </button>
          {hasPreviousConfig && (
            <button
              onClick={() => onShowConfig('diff')}
              className="btn-primary"
              aria-label="הצג הבדלים לעומת תצורה קודמת"
            >
              <CodeIcon aria-hidden="true" /> הצג הבדלים
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-slate-700 pt-6">
        {isInitialSnapshot ? (
          <ExplanationSection explanation={snapshot.explanation} />
        ) : snapshot.changes?.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-lg p-4" aria-label="רשימת שינויים">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                שינויים שזוהו ({snapshot.changes.length})
              </h3>
              <ul className="space-y-2">
                {snapshot.changes.map((c, i) => (
                  <ChangeItem key={`change-${i}-${c}`} change={c} />
                ))}
              </ul>
            </div>
            <ExplanationSection explanation={snapshot.explanation} />
          </div>
        ) : (
          <p className="text-slate-400">לא זוהו שינויים בנקודת זמן זו.</p>
        )}
      </div>
    </main>
  );
};

// === Avoid unnecessary re-renders ===
function areEqual(prevProps, nextProps) {
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error &&
    prevProps.snapshot === nextProps.snapshot
  );
}

export default React.memo(SnapshotDetail, areEqual);
