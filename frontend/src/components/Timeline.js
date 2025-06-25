// ===================================================================
// FILENAME: src/components/Timeline.js
// PURPOSE: רכיב ציר הזמן. הקוד שלך נשמר במלואו.
// UPDATED: אין צורך בשינויים.
// ===================================================================
import React from 'react';
import { ClockIcon, RefreshIcon } from './Icons.js';


const Timeline = ({ snapshots, onSelect, selectedId, isLoading }) => (
    <aside className="w-80 flex-shrink-0 panel p-4 h-full overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-slate-300 border-b border-slate-600 pb-2">ציר זמן - Snapshots</h2>
        
        {isLoading ? (
            <div className="text-center text-slate-500 p-4">
                <RefreshIcon isRefreshing={true} />
                <p className="mt-2">טוען נתונים...</p>
            </div>
        ) : snapshots.length > 0 ? (
            <ul className="space-y-2">
                {snapshots.map(s => (
                    <li 
                        key={s.id} 
                        onClick={() => onSelect(s.id)} 
                        className={`timeline-item flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${s.id === selectedId ? 'selected' : 'text-slate-400'}`}
                    > 
                        <ClockIcon /> 
                        <span className="font-medium text-sm">{new Date(s.timestamp).toLocaleString('he-IL')}</span> 
                    </li>
                ))}
            </ul>
        ) : (
            <div className="text-slate-500 text-center p-4">
                <p>לא נמצאו Snapshots.</p>
                <p className="text-xs mt-1">הפעל את השרת והמתן לסריקה הראשונה.</p>
            </div>
        )}
    </aside>
);

export default Timeline;