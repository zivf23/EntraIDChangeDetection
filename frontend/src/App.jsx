import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Timeline from './components/Timeline';
import SnapshotDetail from './components/SnapshotDetail';
import { Header } from './components/Header';
import { DiffViewerModal } from './components/DiffViewerModal';
import { LoginScreen } from './components/Login';
import { Api, ApiError } from './api';

// --- Helper Components ---

const AuthLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-pulse text-slate-400 text-lg">Authenticating...</div>
    </div>
);

const OverlayLoader = () => (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
);

const Toast = ({ message, onDismiss }) => (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-red-600 text-white py-3 px-6 rounded-lg shadow-lg animate-bounce z-50">
        <span>{message}</span>
        <button onClick={onDismiss} className="ml-4 font-bold text-xl">&times;</button>
    </div>
);

const SessionExpiredModal = ({ onConfirm }) => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Session Expired</h2>
            <p className="text-slate-300 mb-6">Your session has expired. Please log in again to continue.</p>
            <button onClick={onConfirm} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg">
                Log In
            </button>
        </div>
    </div>
);

// --- Main App Component ---

function App() {
    const [authStatus, setAuthStatus] = useState('checking');
    const [snapshots, setSnapshots] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [modalData, setModalData] = useState({ isOpen: false, data: null });
    const [isSessionExpired, setIsSessionExpired] = useState(false);

    const isFetching = useRef(false);

    // ✅ הוספת useMemo כדי לייצב את אובייקט האפשרויות של העורך
    const editorOptions = useMemo(() => ({
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
        theme: 'vs-dark'
    }), []); // <-- מערך תלויות ריק מבטיח שהאובייקט ייווצר פעם אחת בלבד

    const handleUnauthorized = useCallback(() => {
        setIsSessionExpired(true);
    }, []);

    // Check auth on load
    useEffect(() => {
        Api.checkAuthStatus().then(({ isLoggedIn }) => {
            setAuthStatus(isLoggedIn ? 'loggedIn' : 'loggedOut');
        });
    }, []);

    // Fetch timeline snapshots
    const fetchSnapshots = useCallback(async (isRefresh = false) => {
        if (isFetching.current) return;
        isFetching.current = true;

        setStatus(isRefresh ? 'refreshing' : 'loading');
        setError(null);

        try {
            const data = await Api.getSnapshots();
            setSnapshots(data);
            setStatus('success');
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                handleUnauthorized();
            } else {
                setError(err.message || 'Failed to load timeline data.');
                setStatus('error');
            }
        } finally {
            isFetching.current = false;
        }
    }, [handleUnauthorized]);

    // Run fetch after successful login
    useEffect(() => {
        if (authStatus === 'loggedIn') {
            fetchSnapshots();
        }
    }, [authStatus, fetchSnapshots]);

    // Automatically select first snapshot if none selected
    useEffect(() => {
        if (snapshots.length > 0 && selectedId === null) {
            setSelectedId(snapshots[0].id);
        }
    }, [snapshots, selectedId]);

    // Load selected snapshot details
    useEffect(() => {
        if (selectedId === null || authStatus !== 'loggedIn') return;

        const abortController = new AbortController();
        const fetchDetails = async () => {
            setStatus('loading');
            setSelectedSnapshot(null);
            try {
                const data = await Api.getSnapshot(selectedId, abortController.signal);
                setSelectedSnapshot(data);
                setStatus('success');
            } catch (err) {
                if (err.name === 'AbortError') return;
                if (err instanceof ApiError && err.status === 401) {
                    handleUnauthorized();
                } else {
                    setError(err.message || 'Failed to load snapshot details.');
                    setStatus('error');
                }
            }
        };
        fetchDetails();

        return () => abortController.abort();
    }, [selectedId, authStatus, handleUnauthorized]);

    // --- Auth and UI Handlers ---

    const handleLoginSuccess = () => {
        setAuthStatus('loggedIn');
        setIsSessionExpired(false);
    };

    const handleLogout = async () => {
        await Api.logout();
        setAuthStatus('loggedOut');
        setSnapshots([]);
        setSelectedId(null);
    };

    const handleSessionExpiredConfirm = () => {
        setIsSessionExpired(false);
        setAuthStatus('loggedOut');
    };

    const isLoading = status === 'loading';
    const isRefreshing = status === 'refreshing';

    // --- Render ---

    if (authStatus === 'checking') return <AuthLoader />;
    if (isSessionExpired) return <SessionExpiredModal onConfirm={handleSessionExpiredConfirm} />;
    if (authStatus === 'loggedOut') return <LoginScreen onLoginSuccess={handleLoginSuccess} />;

    return (
        <React.Fragment>
            {isLoading && <OverlayLoader />}
            {error && <Toast message={error} onDismiss={() => setError(null)} />}

            <DiffViewerModal
                isOpen={modalData.isOpen}
                onClose={() => setModalData({ isOpen: false, data: null })}
                snapshotData={modalData.data}
                editorOptions={editorOptions} // ✅ העברת האובייקט היציב כ-prop
            />

            <div className="flex flex-col h-screen bg-slate-900">
                <Header
                    onLogout={handleLogout}
                    onRefresh={() => fetchSnapshots(true)}
                    isRefreshing={isRefreshing}
                />
                <main className="flex-grow flex p-4 gap-4 overflow-hidden">
                    <Timeline
                        snapshots={snapshots}
                        onSelect={setSelectedId}
                        selectedId={selectedId}
                        isLoading={isLoading && snapshots.length === 0}
                    />
                    <SnapshotDetail
                        snapshot={selectedSnapshot}
                        isLoading={isLoading && !!selectedId && !selectedSnapshot}
                        onShowConfig={(type) =>
                            setModalData({ isOpen: true, data: { type, ...selectedSnapshot } })
                        }
                    />
                </main>
            </div>
        </React.Fragment>
    );
}

export default App;
