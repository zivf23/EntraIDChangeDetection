import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CopyIcon, CheckIcon } from './Icons.js';
// --- Monaco Worker Configuration ---
// Uses Webpack 5 native worker support with new URL().
// No need for worker-loader or special imports.
window.MonacoEnvironment = {
  getWorker: function (_moduleId, label) {
    if (label === 'json') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url),
        { type: 'module' }
      );
    }
    return new Worker(
      new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
      { type: 'module' }
    );
  },
};



// רכיב מנוע לניהול ידני של עורך ההשוואות
const ManagedDiffEditor = ({ originalContent, modifiedContent, options }) => {
  const editorContainerRef = useRef(null);
  const monacoInstancesRef = useRef(null);

  useEffect(() => {
    if (editorContainerRef.current) {
      const originalModel = monaco.editor.createModel(originalContent, 'json');
      const modifiedModel = monaco.editor.createModel(modifiedContent, 'json');
      const diffEditor = monaco.editor.createDiffEditor(editorContainerRef.current, options);

      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel,
      });

      monacoInstancesRef.current = { editor: diffEditor, originalModel, modifiedModel };
    }

    return () => {
      if (monacoInstancesRef.current) {
        monacoInstancesRef.current.editor.dispose();
        monacoInstancesRef.current.originalModel.dispose();
        monacoInstancesRef.current.modifiedModel.dispose();
        monacoInstancesRef.current = null;
      }
    };
  }, [originalContent, modifiedContent, options]);

  return <div ref={editorContainerRef} style={{ height: '100%', width: '100%' }} />;
};

// רכיב מנוע לניהול ידני של עורך רגיל
const ManagedEditor = ({ content, options }) => {
  const editorContainerRef = useRef(null);
  const monacoInstancesRef = useRef(null);

  useEffect(() => {
    if (editorContainerRef.current) {
      const model = monaco.editor.createModel(content, 'json');
      const editor = monaco.editor.create(editorContainerRef.current, { ...options, model });

      monacoInstancesRef.current = { editor, model };
    }

    return () => {
      if (monacoInstancesRef.current) {
        monacoInstancesRef.current.editor.dispose();
        monacoInstancesRef.current.model.dispose();
        monacoInstancesRef.current = null;
      }
    };
  }, [content, options]);

  return <div ref={editorContainerRef} style={{ height: '100%', width: '100%' }} />;
};

// Toast Notification
const ToastNotification = ({ message }) => (
  <div className="toast-notification transition-opacity duration-300 opacity-100" aria-live="polite">
    <CheckIcon /> {message}
  </div>
);

// ====================================================================
// הקומפוננטה הראשית עם התיקון
// ====================================================================
export const DiffViewerModal = ({ isOpen, onClose, snapshotData, editorOptions }) => {
  // --- Hooks ---
  const [toast, setToast] = useState({ visible: false, message: '' });
  const modalRef = useRef(null);

  const currentJson = useMemo(() => {
    if (!snapshotData?.current_config) return '{}';
    return JSON.stringify(snapshotData.current_config, null, 2);
  }, [snapshotData]);

  const previousJson = useMemo(() => {
    if (!snapshotData?.previous_config) return '{}';
    return JSON.stringify(snapshotData.previous_config, null, 2);
  }, [snapshotData]);

  const formattedDate = useMemo(() => {
    if (!snapshotData?.timestamp) return 'N/A';
    try {
      return new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(snapshotData.timestamp));
    } catch {
      return 'Invalid Date';
    }
  }, [snapshotData]);

  const handleCopyToClipboard = useCallback(async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast({ visible: true, message: `${label} copied!` });
    } catch {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        setToast({ visible: true, message: `${label} copied!` });
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Fallback copy failed: ', err);
        setToast({ visible: true, message: 'Failed to copy!' });
      }
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast({ visible: false, message: '' }), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const selectors = 'button:not([disabled]):not([aria-hidden="true"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(modalRef.current.querySelectorAll(selectors));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    const current = modalRef.current;
    current.addEventListener('keydown', handleTab);
    first?.focus();

    return () => current.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // --- Component Logic ---
  const viewType = snapshotData?.type;
  const hasPrevious = Boolean(snapshotData?.previous_config);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen || !snapshotData) {
    return null;
  }

  // --- Render ---
  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="modal-content"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        aria-describedby="modalSubtitle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="modalTitle">Configuration {viewType === 'diff' ? 'Comparison' : 'View'}</h2>
            <span id="modalSubtitle" className="modal-subtitle">Snapshot from: {formattedDate}</span>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close modal dialog">&times;</button>
        </div>

        <div className="modal-body">
          {viewType === 'diff' && hasPrevious ? (
            <ManagedDiffEditor
              originalContent={previousJson}
              modifiedContent={currentJson}
              options={editorOptions}
            />
          ) : (
            <ManagedEditor
              content={currentJson}
              options={editorOptions}
            />
          )}
        </div>

        <div className="modal-footer">
          {hasPrevious && viewType === 'diff' && (
            <button onClick={() => handleCopyToClipboard(previousJson, 'Previous config')} className="btn-secondary">
              <CopyIcon /> Copy Previous
            </button>
          )}
          <button onClick={() => handleCopyToClipboard(currentJson, 'Current config')} className="btn-secondary">
            <CopyIcon /> Copy Current
          </button>
        </div>

        {toast.visible && <ToastNotification message={toast.message} />}
      </div>
    </div>
  );
};
