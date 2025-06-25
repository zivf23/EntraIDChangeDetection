// ===================================================================
// FILENAME: src/components/Header.js
// PURPOSE: רכיב הכותרת העליונה. הקוד שלך נשמר במלואו.
// UPDATED: אין צורך בשינויים.
// ===================================================================
import React from 'react';
import { RefreshIcon } from './Icons.js';

export const StatusIndicator = ({ isConnected }) => {
    const color = isConnected ? 'text-green-400' : 'text-red-400';
    const bgColor = isConnected ? 'bg-green-500' : 'bg-red-500';
    const text = isConnected ? 'מחובר' : 'מנותק';

    return (
        <div className={`flex items-center gap-2 text-sm font-medium ${color}`}>
            <span className="relative flex h-3 w-3">
                {isConnected && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${bgColor} opacity-75`}></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${bgColor}`}></span>
            </span>
            <span>{text}</span>
        </div>
    );
};

export const Header = ({ isConnected, onRefresh, isRefreshing }) => (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800/90 backdrop-blur-sm border-b border-slate-700 p-4 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight">מנטר <span className="text-cyan-400">מדיניות גישה</span></h1>
            <div className="flex items-center gap-4">
                <StatusIndicator isConnected={isConnected} />
                <button 
                    onClick={onRefresh} 
                    disabled={isRefreshing} 
                    className="p-2 rounded-full hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Refresh data"
                >
                    <RefreshIcon isRefreshing={isRefreshing} />
                </button>
            </div>
        </div>
    </header>
);