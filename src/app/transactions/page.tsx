'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, X, Search, Filter, Image as ImageIcon, Trash2, Download, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Handshake, WalletCards } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';

const TX_TYPES = [
    { value: 'EXPENSE', label: 'Expense' },
    { value: 'INCOME', label: 'Income' },
    { value: 'LOAN_REPAYMENT', label: 'Loan Repayment (I pay back)' },
    { value: 'REIMBURSEMENT', label: 'Lent Money Back (They pay me)' },
    { value: 'LOAN_TAKEN', label: 'Add to Loan Taken' },
    { value: 'MONEY_LENT', label: 'Lent New Money' },
    { value: 'TRANSFER', label: 'Internal Transfer' },
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
    type: string;
    remaining_amount: string;
    total_amount: string;
    is_closed: boolean;
}

interface ContactAccount {
    id: number;
    account_name: string;
    account_number: string;
    contact: number;
}

interface Contact {
    id: number;
    full_name: string;
    first_name: string;
    last_name: string;
    accounts: any[];
}

interface Category {
    id: number;
    name: string;
}

interface TransactionSplit {
    id: number;
    type: string;
    amount: string;
    loan: number | null;
}

interface TransactionAccount {
    id: number;
    account: number;
    account_name: string;
    bank_name: string;
    splits: TransactionSplit[];
}

interface Transaction {
    id: number;
    contact: number | null;
    contact_name: string | null;
    note: string;
    date: string;
    expense_category: number | null;
    expense_category_name: string | null;
    income_source: number | null;
    income_source_name: string | null;
    image: string | null;
    accounts: TransactionAccount[];
    total_amount: string;
    is_internal?: boolean;
}

interface InternalTransaction {
    id: number;
    from_account: number;
    from_account_name: string;
    to_account: number;
    to_account_name: string;
    amount: string;
    note: string;
    date: string;
    is_internal: true;
}

export default function TransactionsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [data, setData] = useState<{
        transactions: Transaction[];
        internalTransactions: InternalTransaction[];
        accounts: Account[];
        loans: Loan[];
        contacts: Contact[];
        expenseCategories: Category[];
        incomeSources: Category[];
        contactAccounts: ContactAccount[];
    }>({
        transactions: [],
        internalTransactions: [],
        accounts: [],
        loans: [],
        contacts: [],
        expenseCategories: [],
        incomeSources: [],
        contactAccounts: []
    });

    // Filter & sort state
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterAccount, setFilterAccount] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
    const [showFilters, setShowFilters] = useState(false);

    const [modalMode, setModalMode] = useState<'STANDARD' | 'LOAN' | 'TRANSFER'>('STANDARD');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({
        type: 'EXPENSE',
        account: '', // For simple non-split
        to_account: '', // For internal transfer
        amount: '',
        note: '',
        contact: '',
        contact_account: '',
        loan: '',
        expense_category: '',
        income_source: '',
        date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    });

    const [isSplitEnabled, setIsSplitEnabled] = useState(false);
    const [splits, setSplits] = useState<{
        account: string;
        amount: string;
        type: string;
        note: string;
        expense_category: string;
        income_source: string;
        loan: string
    }[]>([]);
    const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: number; isInternal: boolean } | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) fetchData();
    }, [user, loading, filterDateFrom, filterDateTo]);

    const fetchData = async () => {
        try {
            const params: any = {};
            if (filterDateFrom) params.start_date = filterDateFrom;
            if (filterDateTo) params.end_date = filterDateTo;

            const [txRes, internalRes, accRes, loanRes, contactRes, expCatRes, incSrcRes, contactAccRes] = await Promise.all([
                api.get('transactions/', { params }),
                api.get('internal-transactions/'),
                api.get('accounts/'),
                api.get('loans/'),
                api.get('contacts/'),
                api.get('expense-categories/'),
                api.get('income-sources/'),
                api.get('contact-accounts/'),
            ]);

            setData({
                transactions: txRes.data,
                internalTransactions: internalRes.data.map((t: any) => ({ ...t, is_internal: true })),
                accounts: accRes.data,
                loans: loanRes.data,
                contacts: contactRes.data,
                expenseCategories: expCatRes.data,
                incomeSources: incSrcRes.data,
                contactAccounts: contactAccRes.data,
            });

            if (accRes.data.length > 0 && !form.account) {
                setForm(prev => ({ ...prev, account: accRes.data[0].id.toString() }));
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load data', 'error');
        }
    };

    const combinedTransactions = useMemo(() => {
        const combined = [...data.transactions, ...data.internalTransactions];
        return combined.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (sortBy === 'date_desc') return dateB - dateA;
            if (sortBy === 'date_asc') return dateA - dateB;

            const amtA = parseFloat((a as any).total_amount || (a as any).amount);
            const amtB = parseFloat((b as any).total_amount || (b as any).amount);
            if (sortBy === 'amount_desc') return amtB - amtA;
            if (sortBy === 'amount_asc') return amtA - amtB;
            return 0;
        }).filter(t => {
            const matchesSearch = !search || t.note?.toLowerCase().includes(search.toLowerCase());
            const matchesType = !filterType || (t.is_internal ? filterType === 'TRANSFER' : (t as any).accounts?.some((acc: any) => acc.splits.some((s: any) => s.type === filterType)));

            // For internal transactions, check if either from or to account matches
            const matchesAccount = !filterAccount || (
                t.is_internal
                    ? ((t as InternalTransaction).from_account === parseInt(filterAccount) || (t as InternalTransaction).to_account === parseInt(filterAccount))
                    : (t as Transaction).accounts.some((acc: any) => acc.account === parseInt(filterAccount))
            );

            return matchesSearch && matchesType && matchesAccount;
        });
    }, [data.transactions, data.internalTransactions, sortBy, search, filterType, filterAccount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (modalMode === 'TRANSFER' || form.type === 'TRANSFER') {
                await api.post('internal-transactions/', {
                    from_account: form.account,
                    to_account: form.to_account,
                    amount: form.amount,
                    note: form.note,
                    date: form.date,
                });
            } else {
                const payload: any = {
                    date: form.date,
                    contact: form.contact || null,
                    contact_account: form.contact_account || null,
                };

                let accountsPayload = [];
                if (isSplitEnabled) {
                    const accountGroups: { [key: string]: any[] } = {};
                    splits.forEach(s => {
                        if (!accountGroups[s.account]) accountGroups[s.account] = [];

                        const splitPayload: any = {
                            type: modalMode === 'STANDARD' ? form.type : s.type,
                            amount: s.amount,
                            note: modalMode === 'STANDARD' ? form.note : s.note,
                            loan: s.loan || null
                        };

                        splitPayload.expense_category = s.expense_category || null;
                        splitPayload.income_source = s.income_source || null;

                        accountGroups[s.account].push(splitPayload);
                    });

                    accountsPayload = Object.keys(accountGroups).map(accId => ({
                        account: accId,
                        splits: accountGroups[accId]
                    }));
                } else {
                    accountsPayload = [{
                        account: form.account,
                        splits: [{
                            type: form.type,
                            amount: form.amount,
                            note: form.note,
                            expense_category: form.expense_category || null,
                            income_source: form.income_source || null,
                            loan: form.loan || null
                        }]
                    }];
                }

                if (image) {
                    const formData = new FormData();
                    formData.append('date', payload.date);
                    if (payload.contact) formData.append('contact', payload.contact);
                    if (payload.contact_account) formData.append('contact_account', payload.contact_account);
                    formData.append('image', image);
                    formData.append('accounts', JSON.stringify(accountsPayload));

                    await api.post('transactions/', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } else {
                    payload.accounts = accountsPayload;
                    await api.post('transactions/', payload);
                }
            }

            showToast('Success!', 'success');
            setIsModalOpen(false);
            fetchData();
            // Reset form
            setForm({
                type: 'EXPENSE',
                account: data.accounts[0]?.id.toString() || '',
                to_account: '',
                amount: '',
                note: '',
                contact: '',
                contact_account: '',
                loan: '',
                expense_category: '',
                income_source: '',
                date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
            });
            setIsSplitEnabled(false);
            setSplits([]);
            setImage(null);
        } catch (err: any) {
            console.error(err);
            showToast(err.response?.data?.detail || 'Operation failed', 'error');
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            const endpoint = confirmDelete.isInternal ? 'internal-transactions' : 'transactions';
            await api.delete(`${endpoint}/${confirmDelete.id}/`);
            showToast('Deleted and balances reversed', 'success');
            fetchData();
        } catch (err) {
            showToast('Failed to delete', 'error');
        } finally {
            setConfirmDelete(null);
        }
    };

    const addSplit = () => {
        setSplits([...splits, {
            account: '',
            amount: '',
            type: form.type,
            note: form.note,
            expense_category: form.expense_category,
            income_source: form.income_source,
            loan: ''
        }]);
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl font-black tracking-tight">Transaction History</h1>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                setModalMode('STANDARD');
                                setIsModalOpen(true);
                                setForm(prev => ({ ...prev, type: 'EXPENSE' }));
                            }}
                            className="btn btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} /> Income & Expense
                        </button>
                        <button
                            onClick={() => {
                                setModalMode('LOAN');
                                setIsModalOpen(true);
                                setForm(prev => ({ ...prev, type: 'LOAN_TAKEN' }));
                            }}
                            className="btn btn-secondary border-primary/20 text-primary flex items-center gap-2 hover:bg-primary/5"
                        >
                            <Handshake size={20} /> Loan & Debt
                        </button>
                        <button
                            onClick={() => {
                                setModalMode('TRANSFER');
                                setIsModalOpen(true);
                                setForm(prev => ({ ...prev, type: 'TRANSFER' }));
                            }}
                            className="btn btn-secondary border-slate-200 flex items-center gap-2"
                        >
                            <ArrowRightLeft size={20} /> Internal Transfer
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="card p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-none shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                            <Filter size={18} />
                            <span className="font-bold uppercase tracking-wider text-xs">Filters</span>
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className="text-xs font-bold text-primary hover:underline">
                            {showFilters ? 'Hide' : 'Show Options'}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                placeholder="Search notes..."
                                className="input-field"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value)}>
                                <option value="">All Types</option>
                                {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <select className="input-field" value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
                                <option value="">All Accounts</option>
                                {data.accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_name}</option>)}
                            </select>
                            <select className="input-field" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                                <option value="date_desc">Newest First</option>
                                <option value="date_asc">Oldest First</option>
                                <option value="amount_desc">Highest Amount</option>
                                <option value="amount_asc">Lowest Amount</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="space-y-4">
                    {combinedTransactions.map(t => (
                        <div key={`${t.is_internal ? 'int' : 'ext'}-${t.id}`} className="card group hover:border-primary/30 transition-all p-5">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${t.is_internal
                                        ? 'bg-blue-500/10 text-blue-500'
                                        : (t as Transaction).accounts.some(acc => acc.splits.some(s => ['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(s.type))) ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                        }`}>
                                        {t.is_internal ? <ArrowRightLeft size={24} /> : (
                                            (t as Transaction).accounts.some(acc => acc.splits.some(s => ['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(s.type)))
                                                ? <ArrowUpRight size={24} />
                                                : <ArrowDownLeft size={24} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                {t.is_internal ? 'Transfer' : (t as Transaction).accounts.length > 1 ? 'Split Transaction' : (t as Transaction).accounts[0]?.splits[0]?.type.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {format(new Date(t.date), 'MMM dd, yyyy • hh:mm a')}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                                                {t.is_internal
                                                    ? `Transfer: ${(t as any).from_account_name} ➔ ${(t as any).to_account_name}`
                                                    : (t as Transaction).note || (t as Transaction).expense_category_name || (t as Transaction).income_source_name || 'No Description'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                {!t.is_internal && (t as Transaction).contact_name && (
                                                    <span className="text-[10px] font-bold py-1 px-2 rounded-lg bg-blue-500/5 text-blue-500 border border-blue-500/10">
                                                        👤 {(t as Transaction).contact_name}
                                                    </span>
                                                )}
                                                {!t.is_internal && (t as Transaction).expense_category_name && (
                                                    <span className="text-[10px] font-bold py-1 px-2 rounded-lg bg-orange-500/5 text-orange-500 border border-orange-500/10">
                                                        📁 {(t as Transaction).expense_category_name}
                                                    </span>
                                                )}
                                                {!t.is_internal && (t as Transaction).income_source_name && (
                                                    <span className="text-[10px] font-bold py-1 px-2 rounded-lg bg-green-500/5 text-green-600 border border-green-500/10">
                                                        💰 {(t as Transaction).income_source_name}
                                                    </span>
                                                )}
                                                {!t.is_internal && (t as Transaction).accounts.length > 1 && (
                                                    <span className="text-[10px] font-bold py-1 px-2 rounded-lg bg-purple-500/5 text-purple-600 border border-purple-500/10">
                                                        🔀 Split across {(t as Transaction).accounts.length} accounts
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right space-y-2">
                                    <div className={`text-xl font-black ${t.is_internal
                                        ? 'text-slate-500'
                                        : (t as Transaction).accounts.some(acc => acc.splits.some(s => ['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(s.type))) ? 'text-green-600' : 'text-red-500'
                                        }`}>
                                        {t.is_internal ? '' : (
                                            (t as Transaction).accounts.some(acc => acc.splits.some(s => ['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(s.type))) ? '+' : '-'
                                        )}
                                        Rs. {parseFloat((t as any).total_amount || (t as any).amount).toLocaleString()}
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        {(t as any).image && (
                                            <button onClick={() => setPreviewImage((t as any).image)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                <ImageIcon size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {combinedTransactions.length === 0 && (
                        <div className="text-center py-20 text-slate-400 border-2 border-dashed rounded-3xl">
                            No transactions match your criteria.
                        </div>
                    )}
                </div>
            </main >

            {/* Transaction Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="card w-full max-w-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase">
                                    {modalMode === 'STANDARD' ? 'Income & Expense' : modalMode === 'LOAN' ? 'Loan / Debt Record' : 'Internal Transfer'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Entry Type</label>
                                        <select
                                            className="input-field py-3 font-bold"
                                            value={form.type}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setForm(prev => ({ ...prev, type: val, contact: '', contact_account: '', loan: '', expense_category: '', income_source: '' }));
                                                if (val === 'TRANSFER') setIsSplitEnabled(false);
                                            }}
                                            disabled={modalMode === 'TRANSFER'}
                                        >
                                            {TX_TYPES.filter(t => {
                                                if (modalMode === 'STANDARD') return ['INCOME', 'EXPENSE'].includes(t.value);
                                                if (modalMode === 'LOAN') return ['LOAN_TAKEN', 'MONEY_LENT', 'LOAN_REPAYMENT', 'REIMBURSEMENT'].includes(t.value);
                                                return t.value === 'TRANSFER';
                                            }).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            className="input-field py-3"
                                            value={form.date}
                                            onChange={e => setForm({ ...form, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {modalMode !== 'TRANSFER' && (
                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-sm">Complex Transaction?</h4>
                                            <p className="text-xs text-slate-500">
                                                {modalMode === 'STANDARD' ? 'Distribute amount across accounts' : 'Multiple transactions for this contact'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={modalMode === 'LOAN' && (!form.contact || !form.contact_account)}
                                            onClick={() => {
                                                if (!isSplitEnabled && splits.length === 0) {
                                                    setSplits([{
                                                        account: form.account,
                                                        amount: form.amount,
                                                        type: form.type,
                                                        note: form.note,
                                                        expense_category: form.expense_category,
                                                        income_source: form.income_source,
                                                        loan: form.loan
                                                    }]);
                                                }
                                                setIsSplitEnabled(!isSplitEnabled);
                                                if (!isSplitEnabled) setIsSplitModalOpen(true);
                                            }}
                                            className={`btn btn-sm ${isSplitEnabled ? 'btn-primary' : 'btn-secondary'} ${modalMode === 'LOAN' && (!form.contact || !form.contact_account) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isSplitEnabled ? 'Enabled' : 'Enable Split'}
                                        </button>
                                    </div>
                                )}

                                {!isSplitEnabled ? (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                                                    {form.type === 'TRANSFER' ? 'From Account' : 'Account'}
                                                </label>
                                                <select className="input-field py-3" value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} required>
                                                    {data.accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                {form.type === 'TRANSFER' ? (
                                                    <>
                                                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">To Account</label>
                                                        <select className="input-field py-3" value={form.to_account} onChange={e => setForm({ ...form, to_account: e.target.value })} required>
                                                            <option value="">-- Select Recipient --</option>
                                                            {data.accounts.filter(a => a.id.toString() !== form.account).map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_name}</option>)}
                                                        </select>
                                                    </>
                                                ) : (
                                                    <>
                                                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Amount (Rs.)</label>
                                                        <input type="number" step="0.01" className="input-field py-3 text-lg font-black" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {form.type === 'TRANSFER' && (
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Transfer Amount (Rs.)</label>
                                                <input type="number" step="0.01" className="input-field py-3 text-lg font-black" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {form.type === 'EXPENSE' && (
                                                <div>
                                                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Category</label>
                                                    <select className="input-field py-3" value={form.expense_category} onChange={e => setForm({ ...form, expense_category: e.target.value })} required={modalMode === 'STANDARD'}>
                                                        <option value="">-- Select Category --</option>
                                                        {data.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            {form.type === 'INCOME' && (
                                                <div>
                                                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Source</label>
                                                    <select className="input-field py-3" value={form.income_source} onChange={e => setForm({ ...form, income_source: e.target.value })} required={modalMode === 'STANDARD'}>
                                                        <option value="">-- Select Source --</option>
                                                        {data.incomeSources.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            {['LOAN_REPAYMENT', 'REIMBURSEMENT', 'LOAN_TAKEN', 'MONEY_LENT'].includes(form.type) && (
                                                <>
                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Contact Person</label>
                                                        <select className="input-field py-3" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value, contact_account: '', loan: '' })} required>
                                                            <option value="">-- Select Person --</option>
                                                            {data.contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Contact Account</label>
                                                        <select
                                                            className="input-field py-3"
                                                            value={form.contact_account}
                                                            onChange={e => setForm({ ...form, contact_account: e.target.value })}
                                                            required
                                                            disabled={!form.contact}
                                                        >
                                                            <option value="">-- Select Account --</option>
                                                            {data.contactAccounts.filter(acc => acc.contact.toString() === form.contact).map((acc: any) => (
                                                                <option key={acc.id} value={acc.id}>{acc.account_name} - {acc.account_number}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {['LOAN_REPAYMENT', 'REIMBURSEMENT'].includes(form.type) && (
                                                        <div className="md:col-span-2">
                                                            <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Specific Loan Record</label>
                                                            <select className="input-field py-3" value={form.loan} onChange={e => setForm({ ...form, loan: e.target.value })} required disabled={!form.contact}>
                                                                <option value="">-- Select Record --</option>
                                                                {data.loans.filter(l => l.contact?.toString() === form.contact && (form.type === 'LOAN_REPAYMENT' ? l.type === 'TAKEN' : l.type === 'LENT') && !l.is_closed).map(l => (
                                                                    <option key={l.id} value={l.id}>Rs. {parseFloat(l.remaining_amount).toLocaleString()} remaining</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-3xl text-center space-y-4">
                                        <h4 className="font-black text-xl">Split Configuration Active</h4>
                                        <p className="text-sm text-slate-500">You are managing transactions across {splits.length} accounts.</p>
                                        <button type="button" onClick={() => setIsSplitModalOpen(true)} className="btn btn-primary">Edit Split Details</button>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Note (Optional)</label>
                                    <textarea
                                        className="input-field min-h-[80px]"
                                        placeholder="Add a memo..."
                                        value={form.note}
                                        onChange={e => setForm({ ...form, note: e.target.value })}
                                    />
                                </div>

                                {form.type !== 'TRANSFER' && (
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Receipt / Attachment</label>
                                        <input
                                            type="file"
                                            className="text-sm block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                            onChange={e => setImage(e.target.files ? e.target.files[0] : null)}
                                        />
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button type="submit" className="btn btn-primary w-full py-4 text-lg shadow-2xl shadow-primary/30">
                                        Complete Record
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Split Modal */}
            {
                isSplitModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                        <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter">Split Manager</h2>
                                    <p className="text-slate-500 text-sm">Distribute the transaction across your accounts</p>
                                </div>
                                <button onClick={() => setIsSplitModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800"><X size={24} /></button>
                            </div>

                            <div className="grid gap-4">
                                {splits.map((s, idx) => (
                                    <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className={modalMode === 'STANDARD' ? 'md:col-span-4' : 'md:col-span-3'}>
                                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Account</label>
                                            <select
                                                className="input-field text-sm"
                                                value={s.account}
                                                onChange={e => {
                                                    const newSplits = [...splits];
                                                    newSplits[idx].account = e.target.value;
                                                    setSplits(newSplits);
                                                }}
                                                required
                                            >
                                                <option value="">-- Select --</option>
                                                {data.accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_name}</option>)}
                                            </select>
                                        </div>

                                        {modalMode === 'STANDARD' && (
                                            <div className="md:col-span-4">
                                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">
                                                    {form.type === 'INCOME' ? 'Source' : 'Category'}
                                                </label>
                                                <select
                                                    className="input-field text-sm"
                                                    value={form.type === 'INCOME' ? s.income_source : s.expense_category}
                                                    onChange={e => {
                                                        const newSplits = [...splits];
                                                        if (form.type === 'INCOME') newSplits[idx].income_source = e.target.value;
                                                        else newSplits[idx].expense_category = e.target.value;
                                                        setSplits(newSplits);
                                                    }}
                                                    required
                                                >
                                                    <option value="">-- Select --</option>
                                                    {form.type === 'INCOME'
                                                        ? data.incomeSources.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                                        : data.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                                    }
                                                </select>
                                            </div>
                                        )}

                                        {modalMode === 'LOAN' && (
                                            <div className="md:col-span-3">
                                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Type</label>
                                                <select
                                                    className="input-field text-sm"
                                                    value={s.type}
                                                    onChange={e => {
                                                        const newSplits = [...splits];
                                                        newSplits[idx].type = e.target.value;
                                                        setSplits(newSplits);
                                                    }}
                                                >
                                                    {TX_TYPES.filter(t => ['LOAN_TAKEN', 'MONEY_LENT', 'LOAN_REPAYMENT', 'REIMBURSEMENT'].includes(t.value)).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        <div className={modalMode === 'STANDARD' ? 'md:col-span-3' : 'md:col-span-3'}>
                                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Amount (Rs.)</label>
                                            <input
                                                type="number"
                                                className="input-field text-sm font-bold"
                                                placeholder="0.00"
                                                value={s.amount}
                                                onChange={e => {
                                                    const newSplits = [...splits];
                                                    newSplits[idx].amount = e.target.value;
                                                    setSplits(newSplits);
                                                }}
                                                required
                                            />
                                        </div>

                                        {modalMode === 'LOAN' && ['LOAN_REPAYMENT', 'REIMBURSEMENT'].includes(s.type) && (
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Loan Ref</label>
                                                <select
                                                    className="input-field text-sm"
                                                    value={s.loan}
                                                    onChange={e => {
                                                        const newSplits = [...splits];
                                                        newSplits[idx].loan = e.target.value;
                                                        setSplits(newSplits);
                                                    }}
                                                    required
                                                >
                                                    <option value="">-- Select --</option>
                                                    {data.loans.filter(l => l.contact?.toString() === form.contact && (s.type === 'LOAN_REPAYMENT' ? l.type === 'TAKEN' : l.type === 'LENT') && !l.is_closed).map(l => (
                                                        <option key={l.id} value={l.id}>Rs. {parseFloat(l.remaining_amount).toLocaleString()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="md:col-span-1 flex justify-end pb-1">
                                            <button
                                                type="button"
                                                onClick={() => setSplits(splits.filter((_, i) => i !== idx))}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={addSplit} className="w-full py-6 mt-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-bold hover:border-primary/40 hover:text-primary transition-all">
                                + Add Account Split
                            </button>

                            <div className="mt-8 flex items-center justify-between p-6 bg-slate-900 text-white rounded-3xl">
                                <div>
                                    <span className="text-xs uppercase font-bold opacity-60 block">Total Allocated</span>
                                    <span className="text-2xl font-black">Rs. {splits.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0).toLocaleString()}</span>
                                </div>
                                <button onClick={() => setIsSplitModalOpen(false)} className="btn btn-primary px-10">Confirm</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                confirmDelete && (
                    <ConfirmModal
                        isOpen={!!confirmDelete}
                        title="Reverse Transaction?"
                        message="This will delete the record and automatically reverse all balance and loan updates. Proceed?"
                        onConfirm={handleDelete}
                        onCancel={() => setConfirmDelete(null)}
                    />
                )
            }

            {
                previewImage && (
                    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                        <button onClick={() => setPreviewImage(null)} className="absolute top-8 right-8 text-white p-4 hover:bg-white/10 rounded-full"><X size={32} /></button>
                        <img src={previewImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl" alt="Attachment" />
                    </div>
                )
            }
        </div >
    );
}
