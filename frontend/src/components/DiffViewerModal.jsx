/*
  File: frontend/src/components/DiffViewerModal.jsx
  Description: No changes needed, but included for completeness.
*/
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { CopyIcon, CheckIcon } from './Icons.js';
import ProfessionalJsonViewer from './ProfessionalJsonViewer';
import JsonDiffViewer from './JsonDiffViewer';

const ToastNotification = ({ message }) => (
    <div className="toast-notification" aria-live="polite">
        <CheckIcon /> {message}
    </div>
);

export const DiffViewerModal = ({ isOpen, onClose, snapshotData }) => {
    const [toast, setToast] = useState({ visible: false, message: '' });
    const modalRef = useRef(null);

    const currentJson = useMemo(() => snapshotData?.current_config || {}, [snapshotData]);
    const previousJson = useMemo(() => snapshotData?.previous_config || {}, [snapshotData]);

    const previousJsonString = useMemo(() => JSON.stringify(previousJson, null, 2), [previousJson]);
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
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setToast({ visible: true, message: `${label} copied!` });
            } catch (err) {
                console.error('Fallback copy failed: ', err);
                setToast({ visible: true, message: 'Failed to copy!' });
            }
            document.body.removeChild(textArea);
        }
    }, []);

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
            >
                <div className="modal-header">
                    <div>
                        <h2 id="modalTitle">Configuration {viewType === 'diff' ? 'Comparison' : 'View'}</h2>
                        <span className="modal-subtitle">Snapshot from: {formattedDate}</span>
                    </div>
                    <button onClick={onClose} className="modal-close" aria-label="Close modal dialog">&times;</button>
                </div>

                <div className="modal-body" style={{ direction: 'ltr', textAlign: 'left' }}>
                    {viewType === 'diff' && hasPrevious ? (
                        <JsonDiffViewer
                            previousData={previousJson}
                            currentData={currentJson}
                        />
                    ) : (
                        <ProfessionalJsonViewer
                            jsonData={currentJson}
                            title="Current Configuration"
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