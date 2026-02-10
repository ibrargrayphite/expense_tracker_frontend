'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Wallet, HandCoins, ReceiptText, LogOut } from 'lucide-react';

export default function Navbar() {
    const { logout } = useAuth();

    return (
        <nav className="glass-morphism sticky top-4 mx-4 mt-4 px-6 py-4 rounded-2xl flex items-center justify-between z-50">
            <Link href="/" className="text-2xl font-black tracking-tighter" style={{ color: 'var(--primary)' }}>
                XPENSE
            </Link>

            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                    <LayoutDashboard size={18} />
                    <span className="hidden md:inline font-medium">Dashboard</span>
                </Link>
                <Link href="/accounts" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                    <Wallet size={18} />
                    <span className="hidden md:inline font-medium">Accounts</span>
                </Link>
                <Link href="/loans" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                    <HandCoins size={18} />
                    <span className="hidden md:inline font-medium">Loans</span>
                </Link>
                <Link href="/transactions" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                    <ReceiptText size={18} />
                    <span className="hidden md:inline font-medium">History</span>
                </Link>

                <button
                    onClick={logout}
                    className="ml-4 p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </nav>
    );
}
