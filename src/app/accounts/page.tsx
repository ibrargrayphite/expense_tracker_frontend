'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, Trash2, Edit3, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';

const BANK_OPTIONS = [
    'Cash',
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
    account_number: string;
    iban: string;
    balance: string;
}

export default function AccountsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [form, setForm] = useState({ bank_name: 'Cash', account_name: '', account_number: '', iban: '', balance: '' });
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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

    const handleOpenModal = (account: Account | null = null) => {
        if (account) {
            setEditingAccount(account);
            setForm({
                bank_name: account.bank_name,
                account_name: account.account_name,
                account_number: account.account_number || '',
                iban: account.iban || '',
                balance: account.balance
            });
        } else {
            setEditingAccount(null);
            setForm({ bank_name: 'Cash', account_name: '', account_number: '', iban: '', balance: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (form.bank_name === 'Cash') {
                payload.account_name = 'Cash';
                payload.account_number = '';
                payload.iban = '';
            }

            if (editingAccount) {
                await api.put(`accounts/${editingAccount.id}/`, payload);
                showToast('Account updated successfully!', 'success');
            } else {
                await api.post('accounts/', payload);
                showToast('Account created successfully!', 'success');
            }
            setIsModalOpen(false);
            setEditingAccount(null);
            setForm({ bank_name: 'Cash', account_name: '', account_number: '', iban: '', balance: '' });
            fetchAccounts();
        } catch (err) {
            showToast('Something went wrong. Please try again.', 'error');
            console.error(err);
        }
    };

    const deleteAccount = async (id: number) => {
        try {
            await api.delete(`accounts/${id}/`);
            showToast('Account deleted.', 'info');
            fetchAccounts();
        } catch (err) {
            showToast('Failed to delete account.', 'error');
            console.error(err);
        } finally {
            setConfirmDelete(null);
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Manage Accounts</h1>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
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
                                    {acc.bank_name !== 'Cash' && (
                                        <p className="text-sm text-secondary">
                                            {acc.bank_name}
                                            {acc.account_number ? ` - ${acc.account_number}` : ''}
                                            {acc.iban ? ` (IBAN: ${acc.iban})` : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto">
                                <div className="text-left sm:text-right">
                                    <p className="text-sm text-secondary font-medium">Balance</p>
                                    <p className="text-lg sm:text-xl font-bold">Rs. {parseFloat(acc.balance).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => handleOpenModal(acc)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors">
                                        <Edit3 size={20} />
                                    </button>
                                    <button onClick={() => setConfirmDelete(acc.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
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
                    <div className="card w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-slate-900 pb-2">
                            <h2 className="text-2xl font-bold">{editingAccount ? 'Edit Account' : 'New Account'}</h2>
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
                            {form.bank_name !== 'Cash' && (
                                <>
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
                                        <label className="block text-sm font-medium mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="0300..."
                                            value={form.account_number}
                                            onChange={e => setForm({ ...form, account_number: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">IBAN (Optional)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="PK..."
                                            value={form.iban}
                                            onChange={e => setForm({ ...form, iban: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1">Current Balance (Rs.)</label>
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
                            <button type="submit" className="btn btn-primary w-full mt-4">
                                {editingAccount ? 'Update Account' : 'Save Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={confirmDelete !== null}
                title="Delete Account"
                message="Are you sure? This will permanently delete the account and all associated records. This action cannot be undone."
                confirmText="Yes, Delete"
                onConfirm={() => confirmDelete !== null && deleteAccount(confirmDelete)}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
}
