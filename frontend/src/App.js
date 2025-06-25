// ===================================================================
// FILENAME: src/App.js
// PURPOSE: הרכיב הראשי. הקוד שלך נשמר, עם שיפורים בטיפול בשגיאות
//          ובייבוא הקומפוננטות.
// ===================================================================
import React, { useState, useEffect, useCallback } from 'react';
import  Timeline  from './components/Timeline';
import SnapshotDetail  from './components/SnapshotDetail';
import { Header } from './components/Header';
import { DiffViewerModal } from './components/DiffViewerModal';

function App() {
    const [snapshots, setSnapshots] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [modalData, setModalData] = useState({ isOpen: false, data: null });

    // הפרוקסי ב-package.json יטפל בהעברת הקריאות ל-backend
    const API_BASE_URL = '/api';

    const fetchSnapshots = useCallback(async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);
        
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/snapshots`);
            if (!res.ok) {
                // נסה לקרוא את גוף התשובה כדי להציג שגיאה מפורטת יותר
                const errorBody = await res.json().catch(() => ({ message: `שרת החזיר שגיאת ${res.status}` }));
                throw new Error(errorBody.message);
            }
            const data = await res.json();
            setSnapshots(data);
            // אם יש נתונים, בחר את הראשון ברשימה
            if (data.length > 0 && !selectedId) {
                fetchAndSelectSnapshot(data[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch snapshots:", err);
            setError(err.message || 'Failed to connect to the server.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedId]); // תלות ב-selectedId כדי למנוע בחירה מחדש שלא לצורך

    const fetchAndSelectSnapshot = useCallback(async (id) => {
        if (!id) {
            setSelectedSnapshot(null);
            setSelectedId(null);
            return;
        }
        setIsLoading(true);
        setSelectedId(id);
        try {
            const res = await fetch(`${API_BASE_URL}/snapshots/${id}`);
            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({ message: `שרת החזיר שגיאת ${res.status}` }));
                throw new Error(errorBody.message);
            }
            const data = await res.json();
            setSelectedSnapshot(data);
        } catch (err) {
            console.error(`Failed to fetch snapshot ${id}:`, err);
            setError(err.message || `Failed to load snapshot details.`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // טעינה ראשונית
    useEffect(() => {
        fetchSnapshots();
    }, [fetchSnapshots]); // useEffect ירוץ מחדש אם fetchSnapshots ישתנה (אבל הוא מוגדר עם useCallback)


    const handleRefresh = () => {
        fetchSnapshots(true);
    };
    
 // בתוך הקובץ src/App.js

  const showConfigModal = (configType) => {
    if (!selectedSnapshot) {
      console.error("APP.JS: Tried to open modal but no snapshot is selected!");
      return;
    }

    // ⭐️ התיקון הקריטי: הוספת שדה 'type' לאובייקט
    const dataToShow = {
      type: configType, // 'diff' or 'current'
      current_config: selectedSnapshot.current_config,
      previous_config: selectedSnapshot.previous_config,
      timestamp: selectedSnapshot.timestamp
    };

    console.log("APP.JS: Setting modal data and opening:", dataToShow);
    setModalData({ isOpen: true, data: dataToShow });
  };

    const closeConfigModal = () => {
                console.log("APP.JS: Closing modal.");

        setModalData({ isOpen: false, data: null });
    };

    // הצגת הודעת שגיאה אם החיבור נכשל
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center text-red-400 p-4">
                <div>
                    <h2 className="text-2xl font-bold mb-2">אירעה שגיאה</h2>
                    <p>{error}</p>
                    <p className="mt-2 text-slate-400 text-sm">
                        ודא שה-backend רץ ושהגדרות ה-API בקובץ <code>.env</code> נכונות.
                    </p>
                    <button 
    onClick={(e) => {
        e.stopPropagation(); // ⭐️ זה השינוי המרכזי
        fetchSnapshots(true);
    }} 
    className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded"
>
                        נסה שוב
                    </button>
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <DiffViewerModal isOpen={modalData.isOpen} onClose={closeConfigModal} snapshotData={modalData.data} />
            <div className="flex flex-col h-screen">
                <Header isConnected={!error} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
                <main className="flex-grow flex p-4 gap-4 overflow-hidden">
                    <Timeline 
                        snapshots={snapshots} 
                        onSelect={fetchAndSelectSnapshot} 
                        selectedId={selectedId} 
                        isLoading={isLoading && snapshots.length === 0} 
                    />
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