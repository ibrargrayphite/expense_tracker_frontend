'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Wallet, HandCoins, ReceiptText, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
    const { logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <nav className="glass-morphism sticky top-4 mx-4 mt-4 px-4 md:px-6 py-4 rounded-2xl flex items-center justify-between z-50">
                <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter" style={{ color: 'var(--primary)' }}>
                    XPENSE
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                        <LayoutDashboard size={18} />
                        <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link href="/accounts" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                        <Wallet size={18} />
                        <span className="font-medium">Accounts</span>
                    </Link>
                    <Link href="/loans" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                        <HandCoins size={18} />
                        <span className="font-medium">Loans</span>
                    </Link>
                    <Link href="/contacts" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                        <ReceiptText size={18} />
                        <span className="font-medium">Contacts</span>
                    </Link>
                    <Link href="/transactions" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                        <ReceiptText size={18} />
                        <span className="font-medium">History</span>
                    </Link>

                    <button
                        onClick={logout}
                        className="ml-4 p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
                    <div className="glass-morphism absolute top-20 right-4 left-4 p-6 rounded-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-4">
                            <Link
                                href="/"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <LayoutDashboard size={20} />
                                <span className="font-medium">Dashboard</span>
                            </Link>
                            <Link
                                href="/accounts"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Wallet size={20} />
                                <span className="font-medium">Accounts</span>
                            </Link>
                            <Link
                                href="/loans"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <HandCoins size={20} />
                                <span className="font-medium">Loans</span>
                            </Link>
                            <Link
                                href="/contacts"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <ReceiptText size={20} />
                                <span className="font-medium">Contacts</span>
                            </Link>
                            <Link
                                href="/transactions"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <ReceiptText size={20} />
                                <span className="font-medium">History</span>
                            </Link>

                            <div className="border-t border-border my-2"></div>

                            <button
                                onClick={() => {
                                    logout();
                                    setMobileMenuOpen(false);
                                }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                                <LogOut size={20} />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
