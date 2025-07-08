import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CopyIcon, CheckIcon } from './Icons.js';
import ProfessionalJsonViewer from './ProfessionalJsonViewer';

// Worker setup for Monaco Diff Editor
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker';

window.MonacoEnvironment = {
	getWorker: function (moduleId, label) {
		if (label === 'json') {
			return new JsonWorker();
		}
		return new EditorWorker();
	},
};

// Helper component for the toast notification
const ToastNotification = ({ message }) => (
    <div className="toast-notification transition-opacity duration-300 opacity-100" aria-live="polite">
        <CheckIcon /> {message}
    </div>
);

// Self-contained component for Monaco Diff Editor
const ManagedDiffEditor = ({ originalContent, modifiedContent, options }) => {
    const editorContainerRef = useRef(null);
    const monacoInstancesRef = useRef(null);

    useEffect(() => {
        if (editorContainerRef.current) {
            const originalModel = monaco.editor.createModel(originalContent, 'json');
            const modifiedModel = monaco.editor.createModel(modifiedContent, 'json');
            const diffEditor = monaco.editor.createDiffEditor(editorContainerRef.current, options);

            diffEditor.setModel({ original: originalModel, modified: modifiedModel });
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


export const DiffViewerModal = ({ isOpen, onClose, snapshotData, editorOptions }) => {
    const [toast, setToast] = useState({ visible: false, message: '' });
    const modalRef = useRef(null);

    const currentJson = useMemo(() => snapshotData?.current_config || {}, [snapshotData]);
    const previousJsonString = useMemo(() => JSON.stringify(snapshotData?.previous_config || {}, null, 2), [snapshotData]);
    const currentJsonString = useMemo(() => JSON.stringify(currentJson, null, 2), [currentJson]);

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

    useEffect(() => {
        if (!isOpen || typeof onClose !== 'function') return;
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

    const viewType = snapshotData?.type;
    const hasPrevious = Boolean(snapshotData?.previous_config);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen || !snapshotData) {
        return null;
    }

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
                            originalContent={previousJsonString}
                            modifiedContent={currentJsonString}
                            options={editorOptions}
                        />
                    ) : (
                        <ProfessionalJsonViewer 
                            jsonData={currentJson} 
                            mode="view"
                        />
                    )}
                </div>

                <div className="modal-footer">
                    {hasPrevious && viewType === 'diff' && (
                        <button onClick={() => handleCopyToClipboard(previousJsonString, 'Previous config')} className="btn-secondary">
                            <CopyIcon /> Copy Previous
                        </button>
                    )}
                    <button onClick={() => handleCopyToClipboard(currentJsonString, 'Current config')} className="btn-secondary">
                        <CopyIcon /> Copy Current
                    </button>
                </div>

                {toast.visible && <ToastNotification message={toast.message} />}
            </div>
        </div>
    );
};
