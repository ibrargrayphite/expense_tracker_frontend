'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, X, Search, Filter, Image as ImageIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';

const TX_TYPES = [
    { value: 'EXPENSE', label: 'Expense' },
    { value: 'INCOME', label: 'Income' },
    { value: 'REPAYMENT', label: 'Loan Repayment (I pay back)' },
    { value: 'REIMBURSEMENT', label: 'Lent Money Back (They pay me)' },
    { value: 'LOAN_TAKEN', label: 'Add to Loan Taken' },
    { value: 'MONEY_LENT', label: 'Lent New Money' },
];

interface Account {
    id: number;
    bank_name: string;
    account_name: string;
    balance: string;
}

interface Loan {
    id: number;
    contact: number | null;
    contact_name: string | null;
    person_name: string;
    type: string;
    remaining_amount: string;
    total_amount: string;
    is_closed: boolean;
}

interface Contact {
    id: number;
    full_name: string;
}

interface Transaction {
    id: number;
    account: number;
    loan: number | null;
    amount: string;
    type: string;
    note: string;
    image: string | null;
    date: string;
}

export default function TransactionsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [data, setData] = useState<{
        transactions: Transaction[];
        accounts: Account[];
        loans: Loan[];
        contacts: Contact[];
    }>({ transactions: [], accounts: [], loans: [], contacts: [] });
    const [selectedContactId, setSelectedContactId] = useState<string>('');

    // Filter & sort state
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterAccount, setFilterAccount] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterAmountMin, setFilterAmountMin] = useState('');
    const [filterAmountMax, setFilterAmountMax] = useState('');
    const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
    const [showFilters, setShowFilters] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [form, setForm] = useState({
        account: '',
        loan: '',
        contact: '',
        amount: '',
        type: 'EXPENSE',
        note: '',
    });
    const [splits, setSplits] = useState<{ account: string; amount: string }[]>([]);
    const [isSplitEnabled, setIsSplitEnabled] = useState(false);
    const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
    const [accountForm, setAccountForm] = useState({ bank_name: 'Cash', account_name: '', account_number: '', iban: '', balance: '0' });
    const [image, setImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) fetchData();
    }, [user, loading]);

    // Update total amount when splits change
    useEffect(() => {
        if (isSplitEnabled) {
            const total = splits.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
            setForm(prev => ({ ...prev, amount: total.toString() }));
        }
    }, [splits, isSplitEnabled]);

    const fetchData = async () => {
        try {
            const [txRes, accRes, loanRes, contactRes] = await Promise.all([
                api.get('transactions/'),
                api.get('accounts/'),
                api.get('loans/'),
                api.get('contacts/'),
            ]);
            setData({
                transactions: txRes.data,
                accounts: accRes.data,
                loans: loanRes.data,
                contacts: contactRes.data
            });
            if (accRes.data.length > 0 && !form.account) {
                setForm(prev => ({ ...prev, account: accRes.data[0].id.toString() }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const addSplit = () => {
        setSplits([...splits, { account: '', amount: '' }]);
    };

    const removeSplit = (index: number) => {
        if (splits.length <= 2) return;
        setSplits(splits.filter((_, i) => i !== index));
    };

    const handleSplitChange = (index: number, field: string, value: string) => {
        const newSplits = [...splits];
        newSplits[index] = { ...newSplits[index], [field]: value };
        setSplits(newSplits);
    };

    const getBalanceError = () => {
        if (!['EXPENSE', 'REPAYMENT', 'MONEY_LENT'].includes(form.type)) return null;

        if (isSplitEnabled) {
            for (const split of splits) {
                if (!split.account || !split.amount) continue;
                const account = data.accounts.find(a => a.id === parseInt(split.account));
                if (account && parseFloat(split.amount) > parseFloat(account.balance)) {
                    return `Split amount for ${account.bank_name} exceeds balance (Rs. ${parseFloat(account.balance).toLocaleString()})`;
                }
            }
        } else if (form.account && form.amount) {
            const account = data.accounts.find(a => a.id === parseInt(form.account));
            if (account && parseFloat(form.amount) > parseFloat(account.balance)) {
                return `Amount exceeds balance in ${account.bank_name} (Rs. ${parseFloat(account.balance).toLocaleString()})`;
            }
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const balanceError = getBalanceError();
        if (balanceError) {
            showToast(balanceError, 'error');
            return;
        }

        // Validation: Sum of splits must equal total amount
        if (isSplitEnabled) {
            const totalSplits = splits.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
            if (Math.abs(totalSplits - parseFloat(form.amount)) > 0.01) {
                showToast(`Split total (Rs. ${totalSplits.toLocaleString()}) must equal transaction total (Rs. ${parseFloat(form.amount).toLocaleString()})`, 'error');
                return;
            }
        }

        const formData = new FormData();
        Object.keys(form).forEach(key => {
            if (form[key as keyof typeof form]) {
                formData.append(key, form[key as keyof typeof form]);
            }
        });

        if (isSplitEnabled) {
            formData.append('splits', JSON.stringify(splits));
        }

        if (image) {
            formData.append('image', image);
        }

        try {
            await api.post('transactions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsModalOpen(false);
            setIsSplitEnabled(false);
            setSplits([]);
            setImage(null);
            setSelectedContactId('');
            setForm({ ...form, amount: '', note: '', loan: '', contact: '' });
            fetchData();
            showToast('Transaction recorded successfully!', 'success');
        } catch (err) {
            showToast('Failed to record transaction. Please try again.', 'error');
            console.error(err);
        }
    };

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('accounts/', accountForm);
            setIsAccountModalOpen(false);
            setAccountForm({ bank_name: 'Cash', account_name: '', account_number: '', iban: '', balance: '0' });
            fetchData();
            setForm(prev => ({ ...prev, account: res.data.id.toString() }));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteTransaction = async (id: number) => {
        try {
            await api.delete(`transactions/${id}/`);
            showToast('Transaction deleted and balance reversed.', 'info');
            fetchData();
        } catch (err) {
            showToast('Failed to delete transaction.', 'error');
            console.error(err);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const getLoanDisplayName = (loan: any) => {
        if (loan.contact_name) return loan.contact_name;
        return loan.person_name || 'Unknown';
    };

    const BANK_OPTIONS = ['Cash', 'JazzCash', 'EasyPaisa', 'Nayapay', 'SadaPay', 'Bank Alfalah', 'Meezan Bank', 'HBL'];

    const filteredTransactions = data.transactions
        .filter(t => {
            const matchesSearch = !search || t.note?.toLowerCase().includes(search.toLowerCase());
            const matchesType = !filterType || t.type === filterType;
            const matchesAccount = !filterAccount || t.account === parseInt(filterAccount);
            const matchesFrom = !filterDateFrom || new Date(t.date) >= new Date(filterDateFrom);
            const matchesTo = !filterDateTo || new Date(t.date) <= new Date(filterDateTo + 'T23:59:59');
            const amount = parseFloat(t.amount);
            const matchesMinAmount = !filterAmountMin || amount >= parseFloat(filterAmountMin);
            const matchesMaxAmount = !filterAmountMax || amount <= parseFloat(filterAmountMax);
            return matchesSearch && matchesType && matchesAccount && matchesFrom && matchesTo && matchesMinAmount && matchesMaxAmount;
        })
        .sort((a, b) => {
            if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
            if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
            if (sortBy === 'amount_desc') return parseFloat(b.amount) - parseFloat(a.amount);
            if (sortBy === 'amount_asc') return parseFloat(a.amount) - parseFloat(b.amount);
            return 0;
        });

    const activeFilterCount = [search, filterType, filterAccount, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax].filter(Boolean).length;

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold">Transaction History</h1>
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                        <Plus size={20} /> Add Transaction
                    </button>
                </div>

                {/* Modern Filter & Sort Bar */}
                <div className="card overflow-hidden border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md mb-6 transition-all duration-300">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-2 text-primary">
                            <Filter size={18} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Find Transactions</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {activeFilterCount > 0 && (
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                    {activeFilterCount} Active
                                </span>
                            )}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`btn btn-sm px-4 rounded-full transition-all duration-200 ${showFilters
                                    ? 'btn-primary shadow-lg shadow-primary/20'
                                    : 'btn-primary shadow-lg shadow-primary/20'
                                    }`}
                            >
                                {showFilters ? 'Hide Panel' : 'Apply Filters'}
                            </button>
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[1000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Search & Sort Row */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Search</label>
                                <div className="relative group">
                                    {/* <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" /> */}
                                    <input
                                        type="text"
                                        className="input-field pl-10 h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="Search by note…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Sort Order</label>
                                <select
                                    className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as any)}
                                >
                                    <option value="date_desc">📅 Newest First</option>
                                    <option value="date_asc">📅 Oldest First</option>
                                    <option value="amount_desc">💰 Highest Amount</option>
                                    <option value="amount_asc">💰 Lowest Amount</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Transaction Type</label>
                                <select
                                    className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Source Account</label>
                                <select
                                    className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    value={filterAccount}
                                    onChange={e => setFilterAccount(e.target.value)}
                                >
                                    <option value="">All Accounts</option>
                                    {data.accounts.map((a: Account) => (
                                        <option key={a.id} value={a.id}>{a.bank_name} – {a.account_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Date Range</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        className="input-field h-11 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        value={filterDateFrom}
                                        onChange={e => setFilterDateFrom(e.target.value)}
                                    />
                                    <input
                                        type="date"
                                        className="input-field h-11 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        value={filterDateTo}
                                        onChange={e => setFilterDateTo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Amount Range</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        className="input-field h-11 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="Min Rs."
                                        value={filterAmountMin}
                                        onChange={e => setFilterAmountMin(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="input-field h-11 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="Max Rs."
                                        value={filterAmountMax}
                                        onChange={e => setFilterAmountMax(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer details inside filter */}
                        <div className="flex items-center justify-between text-xs text-secondary mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span className="font-medium">Showing {filteredTransactions.length} of {data.transactions.length} records</span>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => { setSearch(''); setFilterType(''); setFilterAccount(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterAmountMin(''); setFilterAmountMax(''); }}
                                    className="text-primary font-bold hover:underline py-1 px-3 bg-primary/5 rounded-full"
                                >
                                    Reset All Parameters
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="card p-0 overflow-hidden hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="p-4 text-xs font-bold uppercase text-secondary">Date</th>
                                    <th className="p-4 text-xs font-bold uppercase text-secondary">Account</th>
                                    <th className="p-4 text-xs font-bold uppercase text-secondary">Type</th>
                                    <th className="p-4 text-xs font-bold uppercase text-secondary">Note</th>
                                    <th className="p-4 text-xs font-bold uppercase text-secondary text-right">Amount</th>
                                    <th className="p-4 text-xs font-bold uppercase text-secondary text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTransactions.map((t: Transaction) => {
                                    const account = data.accounts.find((a: Account) => a.id === t.account);
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="p-4 text-sm font-medium whitespace-nowrap">
                                                {format(new Date(t.date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="p-4 text-sm font-medium">
                                                {account ? `${account.bank_name} (${account.account_name})` : '-'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type)
                                                    ? 'bg-green-500/10 text-green-600'
                                                    : 'bg-red-500/10 text-red-600'
                                                    }`}>
                                                    {t.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm max-w-xs truncate">
                                                <div className="flex items-center gap-2">
                                                    {t.image && (
                                                        <button
                                                            onClick={() => setPreviewImage(t.image)}
                                                            className="p-1 hover:bg-primary/10 rounded transition-colors text-primary"
                                                            title="View Attachment"
                                                        >
                                                            <ImageIcon size={14} className="shrink-0" />
                                                        </button>
                                                    )}
                                                    <span className="whitespace-pre-wrap">{t.note || '-'}</span>
                                                </div>
                                            </td>
                                            <td className={`p-4 text-sm font-bold text-right whitespace-nowrap ${['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type) ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type) ? '+' : '-'} Rs. {parseFloat(t.amount).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => setConfirmDeleteId(t.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {data.transactions.length === 0 && (
                        <div className="p-20 text-center text-secondary">
                            No transactions found.
                        </div>
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredTransactions.map((t: Transaction) => {
                        const account = data.accounts.find((a: Account) => a.id === t.account);
                        return (
                            <div key={t.id} className="card">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type)
                                                ? 'bg-green-500/10 text-green-600'
                                                : 'bg-red-500/10 text-red-600'
                                                }`}>
                                                {t.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-secondary">
                                            {format(new Date(t.date), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-lg font-bold whitespace-nowrap ${['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type) ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type) ? '+' : '-'} Rs. {parseFloat(t.amount).toLocaleString()}
                                        </p>
                                        <button onClick={() => setConfirmDeleteId(t.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all shrink-0">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-secondary text-xs">Account: </span>
                                        <span className="font-medium">{account ? `${account.bank_name} (${account.account_name})` : '-'}</span>
                                    </div>
                                    {t.note && (
                                        <div>
                                            <span className="text-secondary text-xs">Note: </span>
                                            <span className="break-words whitespace-pre-wrap">{t.note}</span>
                                        </div>
                                    )}
                                    {t.image && (
                                        <button
                                            onClick={() => setPreviewImage(t.image)}
                                            className="flex items-center gap-2 text-primary p-1 hover:bg-primary/5 rounded -ml-1 transition-colors"
                                        >
                                            <ImageIcon size={14} />
                                            <span className="text-xs font-medium underline uppercase tracking-wider">View Attachment</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {data.transactions.length === 0 && (
                        <div className="card p-20 text-center text-secondary">
                            No transactions found.
                        </div>
                    )}
                </div>
            </main>

            {/* Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="card w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">New Transaction</h2>
                            <button onClick={() => {
                                setIsModalOpen(false);
                                setSelectedContactId('');
                            }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Transaction Type</label>
                                    <select
                                        className="input-field"
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value, loan: '' })}
                                    >
                                        {TX_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                        <input
                                            type="checkbox"
                                            checked={isSplitEnabled}
                                            onChange={(e) => {
                                                setIsSplitEnabled(e.target.checked);
                                                if (e.target.checked) {
                                                    if (splits.length === 0) {
                                                        setSplits([{ account: form.account, amount: form.amount || '' }, { account: '', amount: '' }]);
                                                    }
                                                    setIsSplitModalOpen(true);
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium">Split across accounts?</span>
                                    </label>
                                </div>
                            </div>

                            {!isSplitEnabled ? (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium">Account</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsAccountModalOpen(true)}
                                            className="text-[10px] text-primary font-bold hover:underline"
                                        >
                                            + New
                                        </button>
                                    </div>
                                    <select
                                        className="input-field"
                                        value={form.account}
                                        onChange={e => setForm({ ...form, account: e.target.value })}
                                        required
                                    >
                                        {data.accounts.map((acc: any) => (
                                            <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-primary uppercase">Split Mode Active</span>
                                        <span className="text-[10px] text-secondary">{splits.length} accounts selected</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsSplitModalOpen(true)}
                                        className="btn btn-primary py-2 px-4 text-xs"
                                    >
                                        Configure Split
                                    </button>
                                </div>
                            )}

                            {['REPAYMENT', 'REIMBURSEMENT', 'LOAN_TAKEN', 'MONEY_LENT'].includes(form.type) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={['LOAN_TAKEN', 'MONEY_LENT'].includes(form.type) ? 'col-span-2' : ''}>
                                        <label className="block text-sm font-medium mb-1">Select Contact</label>
                                        <select
                                            className="input-field"
                                            value={form.contact || selectedContactId}
                                            onChange={e => {
                                                setSelectedContactId(e.target.value);
                                                setForm({ ...form, contact: e.target.value, loan: '' });
                                            }}
                                            required
                                        >
                                            <option value="">-- Choose Contact --</option>
                                            {data.contacts.map((c: Contact) => (
                                                <option key={c.id} value={c.id}>{c.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {['REPAYMENT', 'REIMBURSEMENT'].includes(form.type) && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Select Loan Record</label>
                                            <select
                                                className={`input-field ${!selectedContactId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                value={form.loan}
                                                onChange={e => setForm({ ...form, loan: e.target.value })}
                                                required
                                                disabled={!selectedContactId}
                                            >
                                                <option value="">-- Choose Loan --</option>
                                                {data.loans
                                                    .filter((l: Loan) =>
                                                        (form.type === 'REPAYMENT' ? l.type === 'TAKEN' : l.type === 'LENT')
                                                        && !l.is_closed
                                                        && (l.contact === parseInt(selectedContactId))
                                                    )
                                                    .map((l: Loan) => (
                                                        <option key={l.id} value={l.id}>{getLoanDisplayName(l)} (Rem: Rs. {l.remaining_amount})</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Amount (Rs.)</label>
                                <input
                                    type="number"
                                    className={`input-field ${isSplitEnabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-75' : ''}`}
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    required
                                    readOnly={isSplitEnabled}
                                />
                                {isSplitEnabled && (
                                    <p className="text-[10px] text-primary mt-1 italic font-medium">
                                        * Calculated from split details. To change, click "Configure Split".
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Note</label>
                                <textarea
                                    className="input-field"
                                    rows={2}
                                    placeholder="What was this for?"
                                    value={form.note}
                                    onChange={e => setForm({ ...form, note: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Attachment (Image)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="text-sm block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    onChange={e => setImage(e.target.files ? e.target.files[0] : null)}
                                />
                                {getBalanceError() && (
                                    <p className="text-[10px] text-red-500 mt-1 font-bold animate-pulse">
                                        ⚠ {getBalanceError()}
                                    </p>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary w-full mt-4">Record Transaction</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Inline Account Modal */}
            {isAccountModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="card w-full max-w-lg animate-fade-in shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Quick Add Account</h2>
                            <button onClick={() => setIsAccountModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAccountSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bank / Platform</label>
                                    <select
                                        className="input-field"
                                        value={accountForm.bank_name}
                                        onChange={e => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                                    >
                                        {BANK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Account Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Personal, Work etc."
                                        value={accountForm.account_name}
                                        onChange={e => setAccountForm({ ...accountForm, account_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {accountForm.bank_name !== 'Cash' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-scale-in">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="0300..."
                                            value={accountForm.account_number}
                                            onChange={e => setAccountForm({ ...accountForm, account_number: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">IBAN (Optional)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="PK..."
                                            value={accountForm.iban}
                                            onChange={e => setAccountForm({ ...accountForm, iban: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Initial Balance (Rs.)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="0.00"
                                    value={accountForm.balance}
                                    onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-full mt-4">Save & Select</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Inline Split Modal */}
            {isSplitModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
                    <div className="card w-full max-w-md animate-fade-in shadow-2xl border-t-4 border-primary">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Configure Splits</h2>
                                <p className="text-xs text-secondary mt-1">Allocate amounts to different platforms</p>
                            </div>
                            <button onClick={() => setIsSplitModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {splits.map((split, index) => (
                                <div key={index} className="flex gap-2 items-start group">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] font-bold text-secondary uppercase px-1">Account {index + 1}</label>
                                        <select
                                            className="input-field"
                                            value={split.account}
                                            onChange={e => handleSplitChange(index, 'account', e.target.value)}
                                            required
                                        >
                                            <option value="">-- Choose Account --</option>
                                            {data.accounts.map((acc: any) => (
                                                <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32 space-y-1">
                                        <label className="text-[10px] font-bold text-secondary uppercase px-1">Amount</label>
                                        <input
                                            type="number"
                                            className={`input-field ${['EXPENSE', 'REPAYMENT', 'MONEY_LENT'].includes(form.type) &&
                                                split.account &&
                                                parseFloat(split.amount || '0') > parseFloat(data.accounts.find(a => a.id === parseInt(split.account))?.balance || '0')
                                                ? 'ring-2 ring-red-500 border-red-500 bg-red-50 dark:bg-red-900/10' : ''
                                                }`}
                                            placeholder="0.00"
                                            value={split.amount}
                                            onChange={e => handleSplitChange(index, 'amount', e.target.value)}
                                            required
                                        />
                                        {['EXPENSE', 'REPAYMENT', 'MONEY_LENT'].includes(form.type) &&
                                            split.account &&
                                            parseFloat(split.amount || '0') > parseFloat(data.accounts.find(a => a.id === parseInt(split.account))?.balance || '0') && (
                                                <p className="text-[9px] text-red-500 font-bold leading-tight">Exceeds Balance!</p>
                                            )}
                                    </div>
                                    <div className="pt-6">
                                        <button
                                            type="button"
                                            onClick={() => removeSplit(index)}
                                            disabled={splits.length <= 2}
                                            className={`p-2 rounded-lg transition-all ${splits.length <= 2 ? 'opacity-0' : 'text-slate-400 hover:text-red-500 hover:bg-red-500/5'}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addSplit}
                            className="w-full py-3 mt-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-secondary hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all mb-6"
                        >
                            + Add Another Account
                        </button>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-secondary">Summary (Sum of Splits)</span>
                                <span className="font-bold">Rs. {splits.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0).toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsSplitModalOpen(false)}
                            className="btn btn-primary w-full mt-6 py-4 shadow-lg shadow-primary/20"
                        >
                            Done & Update Total
                        </button>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={confirmDeleteId !== null}
                title="Delete Transaction"
                message="Are you sure? This will permanently delete the transaction and reverse its effect on the account balance."
                confirmText="Yes, Delete"
                onConfirm={() => confirmDeleteId !== null && deleteTransaction(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
            />

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="relative max-w-4xl w-full animate-fade-in group">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-primary transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-xs"
                        >
                            Close <X size={20} />
                        </button>
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-2xl overflow-hidden ring-4 ring-white/10">
                            <img
                                src={previewImage}
                                alt="Transaction Attachment"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
