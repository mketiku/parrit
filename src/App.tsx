import React from 'react';

function App() {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 bg-linear-to-br from-white to-gray-100 p-8 text-slate-900 transition-colors dark:bg-slate-950 dark:from-slate-900 dark:to-slate-950 dark:text-slate-100">
            <div className="max-w-2xl text-center">
                <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    Parrit <span className="text-blue-600 dark:text-blue-400">🦜</span>
                </h1>
                <p className="mt-6 text-xl text-slate-600 dark:text-slate-400 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
                    A modern, premium pairing tool for high-performance teams.
                </p>
                <div className="mt-10 flex justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                    <button className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600">
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
