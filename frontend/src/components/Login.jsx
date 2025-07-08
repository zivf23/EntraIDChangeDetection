
import React, { useState } from 'react';
import { Api, ApiError } from '../api';

export const LoginScreen = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await Api.login(username, password);
            // ✅ Suggestion 1: Clear fields on successful login
            setUsername('');
            setPassword('');
            onLoginSuccess();
        } catch (err) {
            // ✅ Suggestion 6: Handle specific error codes
            if (err instanceof ApiError && err.status === 401) {
                setError('Invalid username or password. Please try again.');
            } else {
                setError(err.message || 'An unexpected error occurred.');
            }
            console.error("Login failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md">
                <form 
                    onSubmit={handleSubmit}
                    // ✅ Suggestion 4: Improve UX during submission
                    className={`bg-slate-800/60 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-sm p-8 space-y-6 transition-opacity ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                >
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-slate-100">Entra ID Monitor</h1>
                        <p className="text-slate-400 mt-2">Please sign in to continue</p>
                    </div>
                    
                    {error && (
                        // ✅ Suggestion 3: Improve accessibility with id
                        <div id="login-error" className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm" role="alert">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            // ✅ Suggestion 2: Add placeholder text
                            placeholder="Enter your username"
                            // ✅ Suggestion 3: Improve accessibility with aria-describedby
                            aria-describedby={error ? "login-error" : undefined}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            aria-describedby={error ? "login-error" : undefined}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                    </div>

                    <button
                        type="submit"
                        // ✅ Suggestion 7: Disable button if fields are empty or during load
                        disabled={isLoading || !username || !password}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading && (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};
