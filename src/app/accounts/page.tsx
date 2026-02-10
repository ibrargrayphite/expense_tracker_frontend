'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, Trash2, Edit3, X } from 'lucide-react';

const BANK_OPTIONS = [
    'JazzCash',
    'EasyPaisa',
    'Nayapay',
    'SadaPay',
    'Bank Alfalah',
    'Meezan Bank',
];

interface Account {
    id: number;
    bank_name: string;
    account_name: string;
    balance: string;
}

export default function AccountsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ bank_name: 'JazzCash', account_name: '', balance: '' });

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) fetchAccounts();
    }, [user, loading]);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('accounts/');
            setAccounts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('accounts/', form);
            setIsModalOpen(false);
            setForm({ bank_name: 'JazzCash', account_name: '', balance: '' });
            fetchAccounts();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteAccount = async (id: number) => {
        if (confirm('Are you sure? This will delete the account and its records.')) {
            try {
                await api.delete(`accounts/${id}/`);
                fetchAccounts();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Manage Accounts</h1>
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                        <Plus size={20} /> Add Account
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {accounts.map((acc: Account) => (
                        <div key={acc.id} className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                    {acc.bank_name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate">{acc.account_name}</h3>
                                    <p className="text-sm text-secondary">{acc.bank_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto">
                                <div className="text-left sm:text-right">
                                    <p className="text-sm text-secondary font-medium">Balance</p>
                                    <p className="text-lg sm:text-xl font-bold">Rs. {parseFloat(acc.balance).toLocaleString()}</p>
                                </div>
                                <button onClick={() => deleteAccount(acc.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {accounts.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl text-secondary">
                            No accounts added yet. Click "Add Account" to get started.
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="card w-full max-w-md animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">New Account</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Bank / Platform</label>
                                <select
                                    className="input-field"
                                    value={form.bank_name}
                                    onChange={e => setForm({ ...form, bank_name: e.target.value })}
                                >
                                    {BANK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Account Name (e.g. Personal, Work)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="My JazzCash"
                                    value={form.account_name}
                                    onChange={e => setForm({ ...form, account_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Initial Balance (Rs.)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-field"
                                    placeholder="0.00"
                                    value={form.balance}
                                    onChange={e => setForm({ ...form, balance: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-4">Save Account</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
