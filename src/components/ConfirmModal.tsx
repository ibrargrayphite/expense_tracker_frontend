'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="card w-full max-w-md animate-fade-in shadow-2xl border-t-4 border-red-500">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${variant === 'danger' ? 'bg-red-500/10 text-red-500' :
                            variant === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-primary/10 text-primary'
                            }`}>
                            <AlertTriangle size={20} />
                        </div>
                        <h2 className="text-xl font-bold">{title}</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-secondary text-sm leading-relaxed mb-8">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="btn bg-slate-100 dark:bg-slate-800 text-secondary hover:bg-slate-200 dark:hover:bg-slate-700 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`btn flex-1 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' :
                            variant === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-500/20' :
                                'btn-primary shadow-primary/20'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Deleting…
                            </>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
