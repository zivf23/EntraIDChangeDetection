import React, { useState } from 'react';
import ReactJson from 'react-json-view';

/**
 * ProfessionalJsonViewer
 * מציג אובייקט JSON בצורה קריאה, כולל עץ מתקפל עם אפשרות Expand/Collapse All.
 * מתאים במיוחד לקונפיגורציות גדולות.
 */
const ProfessionalJsonViewer = ({ jsonData, title = "Configuration Viewer" }) => {
  const [collapsed, setCollapsed] = useState(2);

  // הגנה: אין נתונים
  if (!jsonData) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-center p-4">
        No configuration data available.
      </div>
    );
  }

  // פעולה: הרחב הכל
  const handleExpandAll = () => setCollapsed(false);

  // פעולה: קרוס הכל
  const handleCollapseAll = () => setCollapsed(2);

  return (
    <div className="professional-json-viewer h-full w-full bg-slate-900 rounded-lg shadow-lg border border-slate-700 overflow-auto p-4">
      {/* כותרת */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-cyan-300 text-lg font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExpandAll}
            className="px-3 py-1 text-sm rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1 text-sm rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* תוכן ה-JSON */}
      <ReactJson
        src={jsonData}
        theme="monokai"
        collapsed={collapsed}
        enableClipboard={true}
        displayDataTypes={false}
        displayObjectSize={false}
        name={false}
        indentWidth={2}
        style={{ backgroundColor: 'transparent', fontSize: '0.9rem' }}
      />
    </div>
  );
};

export default ProfessionalJsonViewer;
