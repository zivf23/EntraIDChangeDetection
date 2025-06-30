/**
 * Main Application Component for EntraID Change Detection System
 * 
 * This component manages:
 * - Application state (snapshots, selected snapshot, loading states)
 * - API communication
 * - Error handling and display
 * - Modal management for configuration viewing
 */

import React, { useState, useEffect, useCallback } from 'react';
import Timeline from './components/Timeline';
import SnapshotDetail from './components/SnapshotDetail';
import { Header } from './components/Header';
import { DiffViewerModal } from './components/DiffViewerModal';
import { Api, ApiError } from './api';

function App() {
    // Application state
    const [snapshots, setSnapshots] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [modalData, setModalData] = useState({ isOpen: false, data: null });

    /**
     * Fetch all snapshots from the API
     * @param {boolean} isRefresh - Whether this is a manual refresh
     */
    const fetchSnapshots = useCallback(async (isRefresh = false) => {
        // Set appropriate loading state
        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        
        // Clear any existing errors
        setError(null);

        try {
            const data = await Api.getSnapshots();
            setSnapshots(data);
            
            // Log success in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`Fetched ${data.length} snapshots`);
            }
            
            // Auto-select first snapshot if none selected
            if (data.length > 0 && !selectedId) {
                await fetchAndSelectSnapshot(data[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch snapshots:", err);
            
            // Format error message based on error type
            let errorMessage = 'An unexpected error occurred';
            let errorDetails = null;
            
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    errorMessage = 'Authentication failed. Please check your credentials.';
                    errorDetails = 'Verify ADMIN_USER and ADMIN_PASS match in frontend and backend.';
                } else if (err.status === 0) {
                    errorMessage = 'Cannot connect to backend server.';
                    errorDetails = 'Ensure the backend is running on port 5000.';
                } else {
                    errorMessage = err.message;
                }
            }
            
            setError({ message: errorMessage, details: errorDetails });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedId]);

    /**
     * Fetch details for a specific snapshot
     * @param {number} id - Snapshot ID to fetch
     */
    const fetchAndSelectSnapshot = useCallback(async (id) => {
        if (!id && id !== 0) {
            setSelectedSnapshot(null);
            setSelectedId(null);
            return;
        }
        
        setIsLoading(true);
        setSelectedId(id);
        
        try {
            const data = await Api.getSnapshot(id);
            setSelectedSnapshot(data);
            
            if (process.env.NODE_ENV === 'development') {
                console.log(`Loaded snapshot ${id}:`, data);
            }
        } catch (err) {
            console.error(`Failed to fetch snapshot ${id}:`, err);
            
            let errorMessage = 'Failed to load snapshot details.';
            
            if (err instanceof ApiError) {
                if (err.status === 404) {
                    errorMessage = `Snapshot ${id} not found.`;
                } else {
                    errorMessage = `Failed to load snapshot: ${err.message}`;
                }
            }
            
            setError({ message: errorMessage });
            setSelectedSnapshot(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Initial load on component mount
     */
    useEffect(() => {
        fetchSnapshots();
    }, [fetchSnapshots]);

    /**
     * Handle manual refresh
     */
    const handleRefresh = () => {
        fetchSnapshots(true);
    };
    
    /**
     * Show configuration modal
     * @param {string} configType - 'diff' or 'current'
     */
    const showConfigModal = (configType) => {
        if (!selectedSnapshot) {
            console.error("No snapshot selected for modal");
            return;
        }

        const dataToShow = {
            type: configType,
            current_config: selectedSnapshot.current_config,
            previous_config: selectedSnapshot.previous_config,
            timestamp: selectedSnapshot.timestamp
        };

        setModalData({ isOpen: true, data: dataToShow });
    };

    /**
     * Close configuration modal
     */
    const closeConfigModal = () => {
        setModalData({ isOpen: false, data: null });
    };

    /**
     * Retry after error
     */
    const handleRetry = () => {
        setError(null);
        fetchSnapshots();
    };

    // Error display
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center p-4 bg-slate-900">
                <div className="bg-slate-800 border border-red-500/50 rounded-lg p-8 max-w-2xl shadow-2xl">
                    <div className="text-red-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Connection Error</h2>
                    <p className="text-slate-300 mb-2 text-lg">{error.message}</p>
                    {error.details && (
                        <p className="text-slate-400 mb-6">{error.details}</p>
                    )}
                    
                    <div className="bg-slate-900/50 rounded-lg p-6 mb-6 text-left">
                        <p className="font-semibold text-slate-200 mb-3">Troubleshooting Steps:</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
                            <li>
                                Check if backend is running: 
                                <code className="bg-slate-800 px-2 py-1 rounded ml-2">docker-compose ps</code>
                            </li>
                            <li>
                                View backend logs: 
                                <code className="bg-slate-800 px-2 py-1 rounded ml-2">docker-compose logs backend</code>
                            </li>
                            <li>
                                Verify port 5000 is accessible: 
                                <code className="bg-slate-800 px-2 py-1 rounded ml-2">curl http://localhost:5000/api/info</code>
                            </li>
                            <li>
                                Check credentials match in frontend and backend <code>.env</code> files
                            </li>
                        </ol>
                    </div>
                    
                    <button 
                        onClick={handleRetry}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Main application UI
    return (
        <React.Fragment>
            {/* Configuration viewer modal */}
            <DiffViewerModal 
                isOpen={modalData.isOpen} 
                onClose={closeConfigModal} 
                snapshotData={modalData.data} 
            />
            
            <div className="flex flex-col h-screen bg-slate-900">
                {/* Header with connection status */}
                <Header 
                    isConnected={!error} 
                    onRefresh={handleRefresh} 
                    isRefreshing={isRefreshing} 
                />
                
                {/* Main content area */}
                <main className="flex-grow flex p-4 gap-4 overflow-hidden">
                    {/* Timeline sidebar */}
                    <Timeline 
                        snapshots={snapshots} 
                        onSelect={fetchAndSelectSnapshot} 
                        selectedId={selectedId} 
                        isLoading={isLoading && snapshots.length === 0} 
                    />
                    
                    {/* Snapshot details panel */}
                    <SnapshotDetail 
                        snapshot={selectedSnapshot} 
                        isLoading={isLoading && !!selectedId} 
                        onShowConfig={showConfigModal} 
                    />
                </main>
            </div>
        </React.Fragment>
    );
}

export default App;