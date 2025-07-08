// ===================================================================
// FILENAME: src/components/Header.js
// PURPOSE: The top header component for the application.
// UPDATED: Added Logout button and functionality.
// ===================================================================
import React from 'react';
// --- CHANGE: Import new icons ---
import { RefreshIcon, LogOutIcon } from './Icons.js';

export const StatusIndicator = ({ isConnected }) => {
    const status = isConnected 
        ? { color: 'text-green-400', bgColor: 'bg-green-500', text: 'מחובר' }
        : { color: 'text-red-400', bgColor: 'bg-red-500', text: 'מנותק' };

    return (
        <div className={`flex items-center gap-2 text-sm font-medium ${status.color}`}>
            <span className="relative flex h-3 w-3">
                {isConnected && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.bgColor} opacity-75`}></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${status.bgColor}`}></span>
            </span>
            <span>{status.text}</span>
        </div>
    );
};

// --- CHANGE: Added 'onLogout' to the props ---
export const Header = ({ isConnected, onRefresh, isRefreshing, onLogout }) => (
    <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 p-4 sticky top-0 z-30 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight">
                Entra ID <span className="text-cyan-400">Monitor</span>
            </h1>
            <div className="flex items-center gap-2 sm:gap-4">
                <StatusIndicator isConnected={isConnected} />
                
                {/* Refresh Button */}
                <button 
                    onClick={onRefresh} 
                    disabled={isRefreshing} 
                    className="p-2 rounded-full hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-white"
                    aria-label="Refresh data"
                >
                    <RefreshIcon isRefreshing={isRefreshing} />
                </button>

                {/* --- NEW: Logout Button --- */}
                <button 
                    onClick={onLogout}
                    className="p-2 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                    aria-label="Log out"
                >
                    <LogOutIcon />
                </button>
            </div>
        </div>
    </header>
);
