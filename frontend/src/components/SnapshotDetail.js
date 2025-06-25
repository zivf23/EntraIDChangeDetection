// ===================================================================
// FILENAME: src/components/SnapshotDetail.js (Final Version with stopPropagation)
// ===================================================================
import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { InfoIcon, CodeIcon, PlusCircleIcon, MinusCircleIcon, AlertCircleIcon, SparklesIcon, RefreshIcon } from './Icons.js';

const ChangeItem = ({ change }) => {
    const { icon, colorClass, text } = useMemo(() => {
        const lowerChange = change.toLowerCase();
        if (lowerChange.includes('created') || lowerChange.includes('נוצרה')) return { icon: <PlusCircleIcon className="w-5 h-5 text-green-400" />, colorClass: 'text-green-300', text: change.replace(/Policy Created:|נוצרה:/gi, 'מדיניות נוצרה:') };
        if (lowerChange.includes('modified') || lowerChange.includes('עודכנה')) return { icon: <AlertCircleIcon className="w-5 h-5 text-yellow-400" />, colorClass: 'text-yellow-300', text: change.replace(/Policy Modified:|עודכנה:/gi, 'מדיניות עודכנה:') };
        if (lowerChange.includes('deleted') || lowerChange.includes('נמחקה')) return { icon: <MinusCircleIcon className="w-5 h-5 text-red-400" />, colorClass: 'text-red-300', text: change.replace(/Policy Deleted:|נמחקה:/gi, 'מדיניות נמחקה:') };
        return { icon: <InfoIcon className="w-5 h-5 text-sky-400" />, colorClass: 'text-sky-300', text: change };
    }, [change]);

    return (
        <li className={`flex items-start gap-3 ${colorClass}`}>
            <span className="flex-shrink-0 mt-1">{icon}</span>
            <span>{text}</span>
        </li>
    );
};

const ExplanationContent = ({ content }) => {
    if (!content) return null;
    const cleanHtml = DOMPurify.sanitize(content);
    return <div className="text-slate-300 prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
};

const SnapshotDetail = ({ snapshot, isLoading, onShowConfig }) => {
    if (isLoading) {
        return (
            <main className="flex-grow panel p-6 flex items-center justify-center">
                <div className="text-center text-slate-500">
                    <RefreshIcon isRefreshing={true} />
                    <p className="mt-2">טוען פרטי Snapshot...</p>
                </div>
            </main>
        );
    }

    if (!snapshot) {
        return (
            <main className="flex-grow panel p-6 flex items-center justify-center">
                <div className="text-center text-slate-500">
                    <InfoIcon className="w-10 h-10 mx-auto" />
                    <p className="mt-2">בחר נקודת זמן מהרשימה כדי לראות פרטים.</p>
                </div>
            </main>
        );
    }
    
    const hasPreviousConfig = snapshot.previous_config !== null;
    const isInitialSnapshot = snapshot.changes && snapshot.changes.some(c => c.includes('Initial configuration'));
    
    return (
        <main className="flex-grow panel p-6 h-full overflow-y-auto fade-in">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">פרטי Snapshot</h2>
                    <p className="text-slate-400">{new Date(snapshot.timestamp).toLocaleString('he-IL')}</p>
                </div>
                <div className="flex gap-2">
                    {/* ⭐️ התיקון הקריטי נמצא כאן */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShowConfig('current'); }} 
                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        <CodeIcon className="w-5 h-5" /> הצג תצורה
                    </button>
                    {hasPreviousConfig && (
                        /* ⭐️ וגם כאן */
                         <button 
                            onClick={(e) => { e.stopPropagation(); onShowConfig('diff'); }} 
                            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                            <CodeIcon className="w-5 h-5" /> הצג הבדלים
                        </button>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
                {isInitialSnapshot ? (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center text-lg font-semibold text-violet-400 mb-3">
                            <SparklesIcon />
                            <span>תצורה ראשונית וניתוח GPT</span>
                        </div>
                        <ExplanationContent content={snapshot.explanation} />
                    </div>
                ) : snapshot.changes && snapshot.changes.length > 0 ? (
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3">שינויים שזוהו ({snapshot.changes.length})</h3>
                            <ul className="space-y-2">
                                {snapshot.changes.map((c, i) => <ChangeItem key={i} change={c} />)}
                            </ul>
                        </div>
                        {snapshot.explanation && (
                            <div className="bg-slate-900/50 rounded-lg p-4">
                                <div className="flex items-center text-lg font-semibold text-violet-400 mb-3">
                                    <SparklesIcon />
                                    <span>ניתוח GPT</span>
                                </div>
                                <ExplanationContent content={snapshot.explanation} />
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-slate-400">לא זוהו שינויים בנקודת זמן זו.</p>
                )}
            </div>
        </main>
    );
};

export default SnapshotDetail;