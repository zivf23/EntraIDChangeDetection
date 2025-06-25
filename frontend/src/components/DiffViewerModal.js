import React, { useState } from 'react';
import { DiffEditor, Editor } from '@monaco-editor/react';

const LoadingState = () => (
    <div className="flex items-center justify-center h-full text-slate-400">
        <p>טוען נתונים...</p>
    </div>
);

const ErrorState = ({ error }) => (
    <div className="flex items-center justify-center h-full text-red-400">
        <p>שגיאה בטעינת העורך: {error}</p>
    </div>
);

export const DiffViewerModal = ({ isOpen, onClose, snapshotData }) => {
    const [viewType, setViewType] = useState('side-by-side');
    const [toast, setToast] = useState('');
    const [monacoError, setMonacoError] = useState(null);

    const { current_config, previous_config, timestamp, type } = snapshotData || {};

    const originalValue = previous_config ? JSON.stringify(previous_config, null, 2) : '';
    const modifiedValue = current_config ? JSON.stringify(current_config, null, 2) : '';

    // Only change key when snapshot or type changes
    const modalKey = (timestamp || '') + (type || '');

    // Debug log
    console.log('DiffViewerModal:', { type, originalValue, modifiedValue });

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleCopyToClipboard = (config) => {
        if (config) {
            navigator.clipboard.writeText(JSON.stringify(config, null, 2));
            setToast('התצורה הועתקה!');
        }
    };

    const handleEditorDidMount = (editor, monaco) => {
        console.log('Monaco Editor mounted successfully:', { editor, monaco });
        setMonacoError(null);
    };

    const handleEditorWillMount = (monaco) => {
        console.log('Monaco Editor will mount:', monaco);
    };

    const handleEditorError = (error) => {
        console.error('Monaco Editor error:', error);
        setMonacoError(error.message || 'Unknown error');
    };

    React.useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(''), 2500);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const formattedDate = timestamp ? new Date(timestamp).toLocaleString('he-IL') : '';

    if (!isOpen) return null; // Only render when open

    return (
        <div
            className={`fixed inset-0 bg-black/70 backdrop-blur-sm items-center justify-center z-50 p-4 flex`}
            onClick={handleBackdropClick}
        >
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-white">
                            DEBUG: Monaco Test
                        </h2>
                        <span className="text-sm text-slate-400">נלקח בתאריך: {formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 text-2xl" aria-label="Close">
                            &times;
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ height: '500px' }} className="relative">
                    {monacoError ? (
                        <ErrorState error={monacoError} />
                    ) : (
                        <Editor
                            key={modalKey}
                            height="100%"
                            language="json"
                            theme="vs-dark"
                            loading={<LoadingState />}
                            value={"{\n  \"hello\": \"world\",\n  \"test\": true,\n  \"number\": 123\n}"}
                            options={{
                                wordWrap: 'on',
                                minimap: { enabled: false },
                                readOnly: true,
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                lineNumbers: 'on',
                                renderWhitespace: 'none',
                                folding: true,
                                foldingStrategy: 'indentation',
                            }}
                            onMount={handleEditorDidMount}
                            beforeMount={handleEditorWillMount}
                            onError={handleEditorError}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end p-2 border-t border-slate-700 flex-shrink-0 gap-2">
                    {previous_config && <button onClick={() => handleCopyToClipboard(previous_config)} className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-md">העתק גרסה קודמת</button>}
                    {current_config && <button onClick={() => handleCopyToClipboard(current_config)} className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-md">העתק גרסה נוכחית</button>}
                </div>

                {/* Toast */}
                {toast && <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg fade-in">{toast}</div>}
            </div>
        </div>
    );
};