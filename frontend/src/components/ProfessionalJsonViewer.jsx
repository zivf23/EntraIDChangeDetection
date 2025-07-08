// src/components/ProfessionalJsonViewer.jsx

import React, { useEffect, useRef } from 'react';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css'; // Fallback import

const ProfessionalJsonViewer = ({ jsonData, mode = 'tree' }) => {
  const editorRef = useRef(null);

  // This effect ensures the editor uses the dark theme of the app
  useEffect(() => {
    if (editorRef.current) {
      // The 'ace' instance is the underlying editor used in 'code' mode
      const aceEditor = editorRef.current.jsonEditor.aceEditor;
      if (aceEditor) {
        aceEditor.setTheme('ace/theme/tomorrow_night');
      }
    }
  }, [editorRef]);

  if (!jsonData) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No configuration data available.
      </div>
    );
  }

  return (
    <div className="professional-json-viewer h-full w-full">
      <Editor
        ref={editorRef}
        value={jsonData}
        mode={mode}
        // Allowed modes: 'tree', 'view', 'form', 'code', 'text'
        // 'view' is like 'tree' but read-only and with less clutter
        allowedModes={['tree', 'code', 'view']}
        // Set main theme for the editor
        htmlElementProps={{ style: { height: '100%' } }}
        // Set theme for the code editor part (ACE)
        ace={window.ace} // Make sure ace is available globally or imported
        theme="ace/theme/tomorrow_night"
      />
      {/* Custom styles to better integrate with a dark theme */}
      <style>{`
        .professional-json-viewer .jsoneditor {
          border: 1px solid #334155; /* slate-700 */
          border-radius: 0.5rem;
        }
        .professional-json-viewer .jsoneditor-menu {
          background-color: #1e293b; /* slate-800 */
          border-bottom: 1px solid #334155; /* slate-700 */
        }
        .professional-json-viewer .jsoneditor-menu > button,
        .professional-json-viewer .jsoneditor-menu > .jsoneditor-modes > button {
          color: #cbd5e1; /* slate-300 */
        }
        .professional-json-viewer .jsoneditor-menu > button:hover,
        .professional-json-viewer .jsoneditor-menu > .jsoneditor-modes > button:hover {
          background-color: #334155; /* slate-700 */
        }
        .professional-json-viewer .jsoneditor-search {
          background-color: #1e293b; /* slate-800 */
        }
        .ace-tomorrow-night {
            background-color: #0f172a !important; /* slate-900 */
            color: #e2e8f0 !important; /* slate-200 */
        }
        .ace-tomorrow-night .ace_gutter {
            background: #1e293b !important; /* slate-800 */
            color: #64748b !important; /* slate-500 */
        }
        .ace-tomorrow-night .ace_marker-layer .ace_active-line {
            background: #334155 !important; /* slate-700 */
        }
      `}</style>
    </div>
  );
};

export default ProfessionalJsonViewer;
