'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, X, Search, Filter, Image as ImageIcon, Trash2, Download, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Handshake, WalletCards, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import { getErrorMessage } from '@/lib/error-handler';
import Pagination from '@/components/Pagination';

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
    account_number: string;
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
    description: string;
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
    account_number: string;
    splits: TransactionSplit[];
}

interface Transaction {
    id: number;
    contact: number | null;
    contact_name: string | null;
    contact_account?: number | null;
    contact_account_name?: string | null;
    contact_account_number?: string | null;
    contact_bank_name?: string | null;
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
    from_account_number: string;
    from_bank_name: string;
    to_account: number;
    to_account_name: string;
    to_account_number: string;
    to_bank_name: string;
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
        transactions: any[];
        internalTransactions: any[];
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 10;

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
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) fetchData();
    }, [user, loading, currentPage, search, filterType, filterAccount, filterDateFrom, filterDateTo, sortBy]);

    const fetchData = async () => {
        try {
            const params: any = {
                page: currentPage,
                search: search || undefined,
                type: filterType || undefined,
                account: filterAccount || undefined,
                start_date: filterDateFrom || undefined,
                end_date: filterDateTo || undefined,
                ordering: sortBy === 'date_desc' ? '-date' :
                    sortBy === 'date_asc' ? 'date' :
                        sortBy === 'amount_desc' ? '-amount' :
                            sortBy === 'amount_asc' ? 'amount' : '-date'
            };

            const [historyRes, accRes, loanRes, contactRes, expCatRes, incSrcRes, contactAccRes] = await Promise.all([
                api.get('transactions/', { params }),
                api.get('accounts/'),
                api.get('loans/'),
                api.get('contacts/'),
                api.get('expense-categories/'),
                api.get('income-sources/'),
                api.get('contact-accounts/'),
            ]);

            setData({
                transactions: historyRes.data.results,
                internalTransactions: [], // Merged in results
                accounts: accRes.data.results || accRes.data,
                loans: loanRes.data.results || loanRes.data,
                contacts: contactRes.data.results || contactRes.data,
                expenseCategories: expCatRes.data.results || expCatRes.data,
                incomeSources: incSrcRes.data.results || incSrcRes.data,
                contactAccounts: contactAccRes.data.results || contactAccRes.data,
            });
            setTotalCount(historyRes.data.count);

            if (accRes.data.length > 0 && !form.account) {
                const firstAcc = accRes.data.results ? accRes.data.results[0] : accRes.data[0];
                setForm(prev => ({ ...prev, account: firstAcc.id.toString() }));
            }
        } catch (err) {
            console.error(err);
            showToast(getErrorMessage(err), 'error');
        }
    };

    const combinedTransactions = data.transactions;

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
            showToast(getErrorMessage(err), 'error');
        }
    };

    const handleDownloadExcel = async () => {
        setIsDownloading(true);
        try {
            const params: any = {};
            if (filterDateFrom) params.start_date = filterDateFrom;
            if (filterDateTo) params.end_date = filterDateTo;

            const response = await api.get('transactions/export_excel/', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `transactions_${format(new Date(), 'yyyyMMdd')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            showToast('Failed to download Excel', 'error');
        } finally {
            setIsDownloading(false);
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
            showToast(getErrorMessage(err), 'error');
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
            <main className="mx-[20px] py-8 space-y-6">
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
                        <button
                            onClick={handleDownloadExcel}
                            disabled={isDownloading}
                            className="btn btn-secondary border-green-200 text-green-600 flex items-center gap-2 hover:bg-green-50"
                        >
                            <Download size={20} /> {isDownloading ? 'Downloading...' : 'Download Excel'}
                        </button>
                    </div>
                </div>

                {/* Consistent Filter & Sort Bar */}
                <div className="card overflow-hidden border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md mb-6 transition-all duration-300">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-2 text-primary">
                            <Filter size={18} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Filter Transactions</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {(search || filterType || filterAccount || filterDateFrom || filterDateTo || sortBy !== 'date_desc') && (
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold">
                                    Filters Applied
                                </span>
                            )}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="btn btn-sm px-4 rounded-full btn-primary shadow-lg shadow-primary/20"
                            >
                                {showFilters ? 'Hide Panel' : 'Filter Options'}
                            </button>
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[1000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Notes</label>
                                <input
                                    type="text"
                                    placeholder="Keywords..."
                                    className="input-field h-11"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type</label>
                                <select className="input-field h-11" value={filterType} onChange={e => setFilterType(e.target.value)}>
                                    <option value="">All Types</option>
                                    {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</label>
                                <select className="input-field h-11" value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
                                    <option value="">All Accounts</option>
                                    {data.accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_number}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort Order</label>
                                <select className="input-field h-11" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                                    <option value="date_desc">Newest First</option>
                                    <option value="date_asc">Oldest First</option>
                                    <option value="amount_desc">Highest Amount</option>
                                    <option value="amount_asc">Lowest Amount</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">From Date</label>
                                <input type="date" className="input-field h-11" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">To Date</label>
                                <input type="date" className="input-field h-11" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span>{totalCount} transactions match your criteria</span>
                            {(search || filterType || filterAccount || filterDateFrom || filterDateTo || sortBy !== 'date_desc') && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setFilterType('');
                                        setFilterAccount('');
                                        setFilterDateFrom('');
                                        setFilterDateTo('');
                                        setSortBy('date_desc');
                                        setCurrentPage(1);
                                    }}
                                    className="text-primary font-bold hover:underline py-1 px-3 bg-primary/5 rounded-full"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabular List */}
                <div className="card overflow-hidden border-none shadow-sm bg-white dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">From</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">To</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Note</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {combinedTransactions.map(t => {
                                    const isIncome = !t.is_internal && (t as Transaction).accounts.some(acc => acc.splits.some(s => ['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(s.type)));
                                    const isExpense = !t.is_internal && (t as Transaction).accounts.some(acc => acc.splits.some(s => ['EXPENSE', 'MONEY_LENT', 'LOAN_REPAYMENT'].includes(s.type)));

                                    let fromDisplay: React.ReactNode = <span className="text-slate-300">-</span>;
                                    let toDisplay: React.ReactNode = <span className="text-slate-300">-</span>;

                                    if (t.is_internal) {
                                        const it = t as InternalTransaction;
                                        fromDisplay = (
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">{it.from_account_name}</span>
                                                <span className="text-[10px] text-slate-400">{it.from_bank_name} - {it.from_account_number}</span>
                                            </div>
                                        );
                                        toDisplay = (
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">{it.to_account_name}</span>
                                                <span className="text-[10px] text-slate-400">{it.to_bank_name} - {it.to_account_number}</span>
                                            </div>
                                        );
                                    } else {
                                        const xt = t as Transaction;
                                        const userAccounts = (
                                            <div className="flex flex-col gap-1.5">
                                                {xt.accounts.map(acc => (
                                                    <div key={acc.id} className="flex flex-col leading-tight">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{acc.account_name}</span>
                                                        <span className="text-[10px] text-slate-400">{acc.bank_name} - {acc.account_number}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                        const contactAccount = (
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">{xt.contact_account_name || xt.contact_name || 'N/A'}</span>
                                                {xt.contact_account_number && (
                                                    <span className="text-[10px] text-slate-400">{xt.contact_bank_name} - {xt.contact_account_number}</span>
                                                )}
                                            </div>
                                        );

                                        const type = xt.accounts[0]?.splits[0]?.type;
                                        if (['EXPENSE'].includes(type)) {
                                            fromDisplay = userAccounts;
                                            toDisplay = <span className="text-slate-300">-</span>;
                                        } else if (['INCOME'].includes(type)) {
                                            fromDisplay = <span className="text-slate-300">-</span>;
                                            toDisplay = userAccounts;
                                        } else if (['LOAN_TAKEN', 'REIMBURSEMENT'].includes(type)) {
                                            fromDisplay = contactAccount;
                                            toDisplay = userAccounts;
                                        } else if (['LOAN_REPAYMENT', 'MONEY_LENT'].includes(type)) {
                                            fromDisplay = userAccounts;
                                            toDisplay = contactAccount;
                                        }
                                    }

                                    return (
                                        <tr key={`${t.is_internal ? 'int' : 'ext'}-${t.id}`} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">{format(new Date(t.date), 'MMM dd, yyyy')}</span>
                                                    <span className="text-[10px] text-slate-400">{format(new Date(t.date), 'hh:mm a')}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 min-w-[150px]">
                                                {fromDisplay}
                                            </td>
                                            <td className="p-4 min-w-[150px]">
                                                {toDisplay}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${t.is_internal ? 'bg-blue-500/10 text-blue-500' :
                                                    isIncome ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                                    }`}>
                                                    {t.is_internal ? 'Transfer' : (t as Transaction).accounts.length > 1 ? 'Split' : (t as Transaction).accounts[0]?.splits[0]?.type?.replace('_', ' ') || '-'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-sm font-black ${t.is_internal ? 'text-slate-500' :
                                                    isIncome ? 'text-green-600' : 'text-red-500'
                                                    }`}>
                                                    {t.is_internal ? '' : isIncome ? '+' : '-'} Rs. {parseFloat((t as any).total_amount || (t as any).amount).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 italic">
                                                    {(t as Transaction).expense_category_name || (t as Transaction).income_source_name || '-'}
                                                </span>
                                            </td>
                                            <td className="p-4 max-w-[200px]">
                                                <p className="text-xs text-slate-400 truncate" title={(t as Transaction).note}>
                                                    {(t as Transaction).note || '-'}
                                                </p>
                                            </td>
                                            <td className="p-4 text-center">
                                                {(t as any).image ? (
                                                    <button
                                                        onClick={() => setPreviewImage((t as any).image)}
                                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    >
                                                        <ImageIcon size={18} />
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {combinedTransactions.length === 0 && (
                            <div className="text-center py-20 text-slate-400">
                                No transactions match your criteria.
                            </div>
                        )}
                    </div>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                />
            </main >

            {/* Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="card w-full max-w-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase">
                                {modalMode === 'STANDARD' ? 'Income & Expense' : modalMode === 'LOAN' ? 'Loan / Debt Record' : 'Internal Transfer'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {!isSplitEnabled && (
                                    <div className="animate-in slide-in-from-left duration-300">
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
                                )}
                                <div className={isSplitEnabled ? 'md:col-span-2' : ''}>
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
                                                {data.accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_number}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            {form.type === 'TRANSFER' ? (
                                                <>
                                                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">To Account</label>
                                                    <select className="input-field py-3" value={form.to_account} onChange={e => setForm({ ...form, to_account: e.target.value })} required>
                                                        <option value="">-- Select Recipient --</option>
                                                        {data.accounts.filter(a => a.id.toString() !== form.account).map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_number}</option>)}
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
                                                                <option key={l.id} value={l.id}>
                                                                    Total: {parseFloat(l.total_amount).toLocaleString()} |
                                                                    Remaining: {parseFloat(l.remaining_amount).toLocaleString()} |{" "}
                                                                    {l.description
                                                                        ? l.description.length > 50
                                                                            ? l.description.slice(0, 50) + "..."
                                                                            : l.description
                                                                        : "No Description"}
                                                                </option>))}
                                                        </select>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 bg-slate-900 dark:bg-slate-950 rounded-[40px] text-white overflow-hidden relative group/split-active border-4 border-slate-100 dark:border-slate-800 shadow-xl animate-in zoom-in duration-300">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/split-active:scale-110 transition-transform duration-500">
                                        <Handshake size={120} />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="text-center md:text-left">
                                            <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                                <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Split Mode Active</span>
                                            </div>
                                            <h4 className="text-3xl font-black tracking-tighter mb-1">
                                                Rs. {splits.reduce((acc: number, s: any) => acc + (parseFloat(s.amount) || 0), 0).toLocaleString()}
                                            </h4>
                                            <p className="text-slate-400 text-sm font-medium italic">Distributed across {splits.length} accounts</p>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full md:w-auto">
                                            <button
                                                type="button"
                                                onClick={() => setIsSplitModalOpen(true)}
                                                className="btn bg-white text-slate-900 border-none hover:bg-slate-100 py-3 px-8 text-sm font-bold shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <Edit3 size={16} /> Edit Split Details
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsSplitEnabled(false)}
                                                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors"
                                            >
                                                Discard Splits
                                            </button>
                                        </div>
                                    </div>
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
                                {(() => {
                                    let isFormValid = false;
                                    if (isSplitEnabled) {
                                        isFormValid = splits.length > 0 && splits.every((s: any) => {
                                            const basic = !!s.account && !!s.amount;
                                            if (modalMode === 'STANDARD') {
                                                return basic && (form.type === 'INCOME' ? !!s.income_source : !!s.expense_category);
                                            }
                                            if (modalMode === 'LOAN') {
                                                const requiresLoan = ['LOAN_REPAYMENT', 'REIMBURSEMENT'].includes(s.type);
                                                return basic && (requiresLoan ? !!s.loan : true);
                                            }
                                            return basic;
                                        });
                                    } else {
                                        const basic = !!form.account && !!form.amount;
                                        if (modalMode === 'TRANSFER') {
                                            isFormValid = basic && !!form.to_account;
                                        } else if (modalMode === 'STANDARD') {
                                            isFormValid = basic && (form.type === 'INCOME' ? !!form.income_source : !!form.expense_category);
                                        } else if (modalMode === 'LOAN') {
                                            const requiresLoan = ['LOAN_REPAYMENT', 'REIMBURSEMENT'].includes(form.type);
                                            isFormValid = basic && !!form.contact && !!form.contact_account && (requiresLoan ? !!form.loan : true);
                                        }
                                    }

                                    return (
                                        <button
                                            type="submit"
                                            className="btn btn-primary w-full py-4 text-lg shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!isFormValid}
                                        >
                                            Complete Record
                                        </button>
                                    );
                                })()}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Split Modal */}
            {isSplitModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Split Manager</h2>
                                <p className="text-slate-500 text-sm">Distribute the transaction across your accounts</p>
                            </div>
                            <button onClick={() => setIsSplitModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid gap-6">
                            {splits.map((s: any, idx: number) => (
                                <div key={idx} className="relative group/card animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="card p-0 overflow-hidden border-2 border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all duration-300 rounded-[32px]">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Left Section: Account & Type */}
                                            <div className="md:w-1/2 p-6 bg-slate-50/50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800">
                                                <div className="grid grid-cols-1 gap-6">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <WalletCards size={14} className="text-primary" />
                                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Source Account</label>
                                                        </div>
                                                        <select
                                                            className="input-field text-sm font-bold bg-white dark:bg-slate-900 border-slate-200"
                                                            value={s.account}
                                                            onChange={e => {
                                                                const newSplits = [...splits];
                                                                newSplits[idx].account = e.target.value;
                                                                setSplits(newSplits);
                                                            }}
                                                            required
                                                        >
                                                            <option value="">-- Select --</option>
                                                            {data.accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_number}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Filter size={14} className="text-primary" />
                                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Entry Type</label>
                                                            </div>
                                                            <select
                                                                className="input-field text-xs font-bold bg-white dark:bg-slate-900 border-slate-200"
                                                                value={modalMode === 'LOAN' ? s.type : form.type}
                                                                disabled={modalMode === 'STANDARD'}
                                                                onChange={e => {
                                                                    const newSplits = [...splits];
                                                                    newSplits[idx].type = e.target.value;
                                                                    setSplits(newSplits);
                                                                }}
                                                            >
                                                                {modalMode === 'STANDARD' ? (
                                                                    <option value={form.type}>{form.type}</option>
                                                                ) : (
                                                                    TX_TYPES.filter(t => ['LOAN_TAKEN', 'MONEY_LENT', 'LOAN_REPAYMENT', 'REIMBURSEMENT'].includes(t.value)).map(t => <option key={t.value} value={t.value}>{t.label}</option>)
                                                                )}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Plus size={14} className="text-primary" />
                                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category/Source</label>
                                                            </div>
                                                            {modalMode === 'STANDARD' ? (
                                                                <select
                                                                    className="input-field text-xs font-bold bg-white dark:bg-slate-900 border-slate-200"
                                                                    value={(form.type === 'INCOME' || s.type === 'INCOME') ? s.income_source : s.expense_category}
                                                                    onChange={e => {
                                                                        const newSplits = [...splits];
                                                                        if (form.type === 'INCOME' || s.type === 'INCOME') newSplits[idx].income_source = e.target.value;
                                                                        else newSplits[idx].expense_category = e.target.value;
                                                                        setSplits(newSplits);
                                                                    }}
                                                                    required
                                                                >
                                                                    <option value="">-- Select --</option>
                                                                    {(form.type === 'INCOME' || s.type === 'INCOME')
                                                                        ? data.incomeSources.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                                                        : data.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                                                    }
                                                                </select>
                                                            ) : (
                                                                <div className="h-10 flex items-center text-xs text-slate-400 italic bg-white dark:bg-slate-900 rounded-2xl px-4 border border-slate-100 dark:border-slate-800">
                                                                    Auto-Linked
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Section: Amount & Action */}
                                            <div className="md:w-1/2 p-8 flex flex-col justify-center bg-white dark:bg-slate-900">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Allocated Amount</label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">Rs.</span>
                                                            <input
                                                                type="number"
                                                                className="input-field pl-12 h-16 text-2xl font-black bg-slate-50 focus:bg-white border-transparent"
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
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSplits(splits.filter((_, i) => i !== idx))}
                                                        className="mt-6 p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-3xl transition-all"
                                                    >
                                                        <Trash2 size={24} />
                                                    </button>
                                                </div>

                                                {modalMode === 'LOAN' && ['LOAN_REPAYMENT', 'REIMBURSEMENT'].includes(s.type) && (
                                                    <div className="mt-4 animate-in slide-in-from-top-2">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Loan Reference</label>
                                                        <select
                                                            className="input-field text-xs bg-slate-50"
                                                            value={s.loan}
                                                            onChange={e => {
                                                                const newSplits = [...splits];
                                                                newSplits[idx].loan = e.target.value;
                                                                setSplits(newSplits);
                                                            }}
                                                            required
                                                        >
                                                            <option value="">-- Choose specific record --</option>
                                                            {data.loans.filter(l => l.contact?.toString() === form.contact && (s.type === 'LOAN_REPAYMENT' ? l.type === 'TAKEN' : l.type === 'LENT') && !l.is_closed).map(l => (
                                                                <option key={l.id} value={l.id}>Rs. {parseFloat(l.remaining_amount).toLocaleString()} remaining</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-[40px] flex flex-col md:flex-row items-stretch gap-2">
                            <button onClick={addSplit} className="flex-1 py-6 bg-white dark:bg-slate-900 rounded-[32px] text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center gap-3">
                                <Plus size={18} /> Add Another Account
                            </button>
                            <div className="flex-1 bg-slate-900 dark:bg-slate-950 rounded-[32px] p-6 text-white flex items-center justify-between shadow-xl">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Allocated</p>
                                    <h3 className="text-2xl font-black italic tracking-tighter">Rs. {splits.reduce((acc: number, s: any) => acc + (parseFloat(s.amount) || 0), 0).toLocaleString()}</h3>
                                </div>
                                <button
                                    onClick={() => setIsSplitModalOpen(false)}
                                    className="btn btn-primary px-10 rounded-2xl h-12 shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={splits.length === 0 || !splits.every((s: any) => {
                                        const basic = !!s.account && !!s.amount;
                                        if (modalMode === 'STANDARD') {
                                            return basic && (form.type === 'INCOME' ? !!s.income_source : !!s.expense_category);
                                        }
                                        if (modalMode === 'LOAN') {
                                            const requiresLoan = ['LOAN_REPAYMENT', 'REIMBURSEMENT'].includes(s.type);
                                            return basic && (requiresLoan ? !!s.loan : true);
                                        }
                                        return basic;
                                    })}
                                >
                                    Apply Config
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <ConfirmModal
                    isOpen={!!confirmDelete}
                    title="Reverse Transaction?"
                    message="This will delete the record and automatically reverse all balance and loan updates. Proceed?"
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            {previewImage && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                    <button onClick={() => setPreviewImage(null)} className="absolute top-8 right-8 text-white p-4 hover:bg-white/10 rounded-full">
                        <X size={32} />
                    </button>
                    <img src={previewImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl" alt="Attachment" />
                </div>
            )}
        </div>
    );
}
