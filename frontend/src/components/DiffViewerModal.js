
javascript
import React, { useState } from 'react';
import { DiffEditor, Editor } from '@monaco-editor/react';

export const DiffViewerModal = ({ isOpen, onClose, snapshotData, viewType }) => {
  const [toast, setToast] = useState('');
  
  if (!isOpen || !snapshotData) return null;

  const { current_config, previous_config, timestamp } = snapshotData;
  
  const currentJson = JSON.stringify(current_config, null, 2);
  const previousJson = previous_config ? JSON.stringify(previous_config, null, 2) : '';
  
  const handleCopyToClipboard = (config, label) => {
    if (config) {
      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setToast(`${label} copied!`);
      setTimeout(() => setToast(''), 2500);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : '';
  
  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Configuration {viewType === 'diff' ? 'Comparison' : 'View'}</h2>
            <span className="modal-subtitle">Snapshot from: {formattedDate}</span>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            ×
          </button>
        </div>

        {/* Editor Content */}
        <div className="modal-body">
          {viewType === 'diff' && previous_config ? (
            <DiffEditor
              height="100%"
              language="json"
              theme="vs-dark"
              original={previousJson}
              modified={currentJson}
              options={{
                readOnly: true,
                renderSideBySide: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                wordWrap: 'on'
              }}
            />
          ) : (
            <Editor
              height="100%"
              language="json"
              theme="vs-dark"
              value={currentJson}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                wordWrap: 'on'
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {previous_config && viewType === 'diff' && (
            <button 
              onClick={() => handleCopyToClipboard(previous_config, 'Previous configuration')}
              className="btn-secondary"
            >
              Copy Previous
            </button>
          )}
          <button 
            onClick={() => handleCopyToClipboard(current_config, 'Current configuration')}
            className="btn-secondary"
          >
            Copy Current
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="toast-notification">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};