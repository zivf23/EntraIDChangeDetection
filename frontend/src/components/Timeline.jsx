import React, { useMemo } from 'react';
import { ClockIcon, RefreshIcon } from './Icons.js';

// --- IMPROVEMENT: Centralized date formatting utility ---
const formatSnapshotDate = (timestamp) => {
    try {
        // Using more options for a clearer format
        return new Intl.DateTimeFormat('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(timestamp));
    } catch {
        return 'Invalid Date';
    }
};

const TimelineItem = ({ snapshot, onSelect, isSelected }) => {
    // Memoize the formatted date to prevent re-calculation on every render
    const formattedDate = useMemo(() => formatSnapshotDate(snapshot.timestamp), [snapshot.timestamp]);

    return (
        <li>
            {/* --- ACCESSIBILITY: Using a <button> inside the <li> --- */}
            <button
                onClick={() => onSelect(snapshot.id)}
                className={`timeline-item flex items-center w-full text-left gap-3 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'selected' : 'text-slate-400'}`}
                aria-current={isSelected ? 'true' : 'false'}
            >
                <ClockIcon />
                <span className="font-medium text-sm">{formattedDate}</span>
            </button>
        </li>
    );
};

const Timeline = ({ snapshots, onSelect, selectedId, isLoading }) => (
    <aside className="w-80 flex-shrink-0 panel p-4 h-full flex flex-col">
        <h2 className="text-lg font-semibold mb-4 text-slate-300 border-b border-slate-600 pb-2 flex-shrink-0">
            ציר זמן - Snapshots
        </h2>
        
        <div className="flex-grow overflow-y-auto">
            {isLoading ? (
                <div className="text-center text-slate-500 p-4">
                    <RefreshIcon isRefreshing={true} />
                    <p className="mt-2">טוען נתונים...</p>
                </div>
            ) : snapshots.length > 0 ? (
                <ul className="space-y-2">
                    {snapshots.map(s => (
                        <TimelineItem
                            key={s.id}
                            snapshot={s}
                            onSelect={onSelect}
                            isSelected={s.id === selectedId}
                        />
                    ))}
                </ul>
            ) : (
                <div className="text-slate-500 text-center p-4">
                    <p>לא נמצאו Snapshots.</p>
                    <p className="text-xs mt-1">הפעל את השרת והמתן לסריקה הראשונה.</p>
                </div>
            )}
        </div>
    </aside>
);

export default React.memo(Timeline);
