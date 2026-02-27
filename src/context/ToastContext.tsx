'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            removeToast(id);
        }, TOAST_DURATION);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-md">
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
                            className={`pointer-events-auto relative overflow-hidden group glass-morphism p-5 rounded-2xl shadow-2xl flex items-start gap-4 border-2 ${toast.type === 'success' ? 'border-green-500/20 bg-white/80 dark:bg-slate-900/80' :
                                toast.type === 'error' ? 'border-red-500/20 bg-white/80 dark:bg-slate-900/80' :
                                    'border-primary/20 bg-white/80 dark:bg-slate-900/80'
                                }`}
                        >
                            <div className={`mt-0.5 p-2 rounded-xl transition-colors ${toast.type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                                toast.type === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                                    'bg-primary/10 text-primary'
                                }`}>
                                {toast.type === 'success' && <CheckCircle2 size={20} />}
                                {toast.type === 'error' && <AlertCircle size={20} />}
                                {toast.type === 'info' && <Info size={20} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${toast.type === 'success' ? 'text-green-600 dark:text-green-400' :
                                    toast.type === 'error' ? 'text-red-600 dark:text-red-400' :
                                        'text-primary'
                                    }`}>
                                    {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Info'}
                                </h4>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                                    {toast.message}
                                </p>
                            </div>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="mt-0.5 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={16} />
                            </button>

                            {/* Progress Bar */}
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: TOAST_DURATION / 1000, ease: "linear" }}
                                className={`absolute bottom-0 left-0 h-1 opacity-40 ${toast.type === 'success' ? 'bg-green-500' :
                                    toast.type === 'error' ? 'bg-red-500' :
                                        'bg-primary'
                                    }`}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            <style jsx global>{`
                .truncate-2-lines {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}

