'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, Trash2, Edit3, X, Search, ArrowUpDown } from 'lucide-react';
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

    // Filter & sort state
    const [search, setSearch] = useState('');
    const [filterBank, setFilterBank] = useState('');
    const [filterMinBalance, setFilterMinBalance] = useState('');
    const [filterMaxBalance, setFilterMaxBalance] = useState('');
    const [sortBy, setSortBy] = useState<'balance_desc' | 'balance_asc' | 'name_asc' | 'name_desc'>('balance_desc');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const filteredAccounts = accounts
        .filter(acc => {
            const matchesSearch = !search ||
                acc.account_name.toLowerCase().includes(search.toLowerCase()) ||
                acc.bank_name.toLowerCase().includes(search.toLowerCase());
            const matchesBank = !filterBank || acc.bank_name === filterBank;
            const balance = parseFloat(acc.balance);
            const matchesMinBalance = !filterMinBalance || balance >= parseFloat(filterMinBalance);
            const matchesMaxBalance = !filterMaxBalance || balance <= parseFloat(filterMaxBalance);
            return matchesSearch && matchesBank && matchesMinBalance && matchesMaxBalance;
        })
        .sort((a, b) => {
            if (sortBy === 'balance_desc') return parseFloat(b.balance) - parseFloat(a.balance);
            if (sortBy === 'balance_asc') return parseFloat(a.balance) - parseFloat(b.balance);
            if (sortBy === 'name_asc') return a.account_name.localeCompare(b.account_name);
            if (sortBy === 'name_desc') return b.account_name.localeCompare(a.account_name);
            return 0;
        });

    const totalBalance = filteredAccounts.reduce((s, a) => s + parseFloat(a.balance), 0);

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

                {/* Modern Filter & Sort Bar */}
                <div className="card overflow-hidden border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md mb-6 transition-all duration-300">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-2 text-primary">
                            <Search size={18} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Search & Filter</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {(search || filterBank || filterMinBalance || filterMaxBalance || sortBy !== 'balance_desc') && (
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                    Filters Applied
                                </span>
                            )}
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`btn btn-sm px-4 rounded-full transition-all duration-200 ${showAdvancedFilters
                                    ? 'btn-primary shadow-lg shadow-primary/20'
                                    : 'btn-primary shadow-lg shadow-primary/20'
                                    }`}
                            >
                                {showAdvancedFilters ? 'Hide Panel' : 'Filter Accounts'}
                            </button>
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${showAdvancedFilters ? 'max-h-[1000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Search Accounts</label>
                                <div className="relative group">
                                    {/* <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" /> */}
                                    <input
                                        type="text"
                                        className="input-field pl-10 h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="Name or platform…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Bank / Platform</label>
                                <select
                                    className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    value={filterBank}
                                    onChange={e => setFilterBank(e.target.value)}
                                >
                                    <option value="">All Platforms</option>
                                    {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Sort By</label>
                                <select
                                    className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as any)}
                                >
                                    <option value="balance_desc">💰 Highest Balance</option>
                                    <option value="balance_asc">💰 Lowest Balance</option>
                                    <option value="name_asc">🔤 Name A→Z</option>
                                    <option value="name_desc">🔤 Name Z→A</option>
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Balance Range (Rs.)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="Minimum"
                                        value={filterMinBalance}
                                        onChange={e => setFilterMinBalance(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="Maximum"
                                        value={filterMaxBalance}
                                        onChange={e => setFilterMaxBalance(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-secondary mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <span>{filteredAccounts.length} accounts found</span>
                                <span className="font-bold text-primary">Total: Rs. {totalBalance.toLocaleString()}</span>
                            </div>
                            {(search || filterBank || filterMinBalance || filterMaxBalance || sortBy !== 'balance_desc') && (
                                <button
                                    onClick={() => { setSearch(''); setFilterBank(''); setFilterMinBalance(''); setFilterMaxBalance(''); setSortBy('balance_desc'); }}
                                    className="text-primary font-bold hover:underline py-1 px-3 bg-primary/5 rounded-full"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredAccounts.map((acc: Account) => (
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
