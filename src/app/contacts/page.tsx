'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, Trash2, Edit3, Mail, X, Phone, User as UserIcon, CreditCard, Search, Filter, HandCoins, History as HistoryIcon, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import { getErrorMessage } from '@/lib/error-handler';
import Pagination from '@/components/Pagination';

const BANK_OPTIONS = [
    'JazzCash',
    'EasyPaisa',
    'Nayapay',
    'SadaPay',
    'Bank Alfalah',
    'Meezan Bank',
    'HBL',
];

interface ContactAccount {
    id: number;
    bank_name: string;
    account_name: string;
    account_number: string;
    iban?: string;
}

interface Loan {
    id: number;
    type: 'TAKEN' | 'LENT';
    total_amount: string;
    remaining_amount: string;
    description: string;
    is_closed: boolean;
    created_at: string;
}

interface Transaction {
    id: number;
    total_amount: string;
    note: string;
    date: string;
    accounts: { splits: { type: string; amount: string }[] }[];
}

interface Contact {
    id: number;
    first_name: string;
    last_name: string;
    phone1: string;
    phone2?: string;
    email?: string;
    accounts: ContactAccount[];
    loans: Loan[];
    transactions: Transaction[];
    loan_stats: {
        total_loaned: number;
        total_lent: number;
        net_balance: number;
    };
}

export default function ContactsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [form, setForm] = useState({ first_name: '', last_name: '', phone1: '', phone2: '', email: '' });
    const [editingAccount, setEditingAccount] = useState<ContactAccount | null>(null);
    const [accountForm, setAccountForm] = useState({ bank_name: 'JazzCash', account_name: '', account_number: '', iban: '' });
    const [confirmDeleteContact, setConfirmDeleteContact] = useState<number | null>(null);
    const [confirmDeleteAccount, setConfirmDeleteAccount] = useState<number | null>(null);
    const [expandedContacts, setExpandedContacts] = useState<Record<number, boolean>>({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 5;

    const toggleExpand = (id: number) => {
        setExpandedContacts(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Filter & sort
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'accounts_asc' | 'accounts_desc'>('name_asc');
    const [filterAccountCount, setFilterAccountCount] = useState<'ALL' | 'HAS_ACCOUNTS' | 'NO_ACCOUNTS'>('ALL');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [triggerFetch, setTriggerFetch] = useState(0);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) fetchContacts();
    }, [user, loading, currentPage, triggerFetch]);

    const fetchContacts = async () => {
        setIsFetching(true);
        try {
            const params: any = {
                page: currentPage,
                search: search || undefined,
                accounts: filterAccountCount !== 'ALL' ? filterAccountCount : undefined,
                ordering: sortBy === 'name_asc' ? 'first_name' :
                    sortBy === 'name_desc' ? '-first_name' :
                        sortBy === 'accounts_asc' ? 'accounts_count' :
                            sortBy === 'accounts_desc' ? '-accounts_count' : 'first_name'
            };
            const res = await api.get('contacts/', { params });
            // DRF returns { results: [], count: n } when paginated
            setContacts(res.data.results);
            setTotalCount(res.data.count);
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetching(false);
        }
    };

    const handleOpenModal = (contact: Contact | null = null) => {
        if (contact) {
            setEditingContact(contact);
            setForm({
                first_name: contact.first_name,
                last_name: contact.last_name,
                phone1: contact.phone1,
                phone2: contact.phone2 || '',
                email: contact.email || ''
            });
        } else {
            setEditingContact(null);
            setForm({ first_name: '', last_name: '', phone1: '', phone2: '', email: '' });
        }
        setIsModalOpen(true);
    };

    const handleOpenAccountModal = (contact: Contact, account: ContactAccount | null = null) => {
        setSelectedContact(contact);
        if (account) {
            setEditingAccount(account);
            setAccountForm({
                bank_name: account.bank_name,
                account_name: account.account_name,
                account_number: account.account_number,
                iban: account.iban || ''
            });
        } else {
            setEditingAccount(null);
            setAccountForm({ bank_name: 'JazzCash', account_name: '', account_number: '', iban: '' });
        }
        setIsAccountModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingContact) {
                await api.put(`contacts/${editingContact.id}/`, form);
                showToast('Contact updated!', 'success');
            } else {
                await api.post('contacts/', form);
                showToast('Contact added!', 'success');
            }
            setIsModalOpen(false);
            setEditingContact(null);
            setForm({ first_name: '', last_name: '', phone1: '', phone2: '', email: '' });
            fetchContacts();
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
            console.error(err);
        }
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContact) return;
        try {
            const data = {
                ...accountForm,
                contact: selectedContact.id
            };
            if (editingAccount) {
                await api.put(`contact-accounts/${editingAccount.id}/`, data);
                showToast('Account updated!', 'success');
            } else {
                await api.post('contact-accounts/', data);
                showToast('Account added to contact!', 'success');
            }
            setIsAccountModalOpen(false);
            setEditingAccount(null);
            setAccountForm({ bank_name: 'JazzCash', account_name: '', account_number: '', iban: '' });
            fetchContacts();
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
            console.error(err);
        }
    };

    const deleteContact = async (id: number) => {
        try {
            await api.delete(`contacts/${id}/`);
            showToast('Contact deleted.', 'info');
            fetchContacts();
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
            console.error(err);
        } finally {
            setConfirmDeleteContact(null);
        }
    };

    const deleteAccount = async (id: number) => {
        try {
            await api.delete(`contact-accounts/${id}/`);
            showToast('Account removed from contact.', 'info');
            fetchContacts();
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
            console.error(err);
        } finally {
            setConfirmDeleteAccount(null);
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="mx-[20px] mt-8 space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Contacts</h1>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus size={20} /> Add Contact
                    </button>
                </div>

                {/* Modern Filter & Sort Bar */}
                <div className="card overflow-hidden border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md mb-6 transition-all duration-300">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-2 text-primary">
                            <Filter size={18} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Find Contacts</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {(search || filterAccountCount !== 'ALL' || sortBy !== 'name_asc') && (
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                    Filters Active
                                </span>
                            )}
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`btn btn-sm px-4 rounded-full transition-all duration-200 ${showAdvancedFilters
                                    ? 'btn-primary shadow-lg shadow-primary/20'
                                    : 'btn-primary shadow-lg shadow-primary/20'
                                    }`}
                            >
                                {showAdvancedFilters ? 'Hide Panel' : 'Search Options'}
                            </button>
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${showAdvancedFilters ? 'max-h-[1000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Search</label>
                                <div className="relative group">
                                    {/* <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" /> */}
                                    <input
                                        type="text"
                                        className="input-field pl-10 h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="Name or phone…"
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
                                    <option value="name_asc">🔤 Name A→Z</option>
                                    <option value="name_desc">🔤 Name Z→A</option>
                                    <option value="accounts_asc">📇 Accounts (Low→High)</option>
                                    <option value="accounts_desc">📇 Accounts (High→Low)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Account Visibility</label>
                                <select
                                    className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    value={filterAccountCount}
                                    onChange={e => setFilterAccountCount(e.target.value as any)}
                                >
                                    <option value="ALL">All Contacts</option>
                                    <option value="HAS_ACCOUNTS">Has Linked Accounts</option>
                                    <option value="NO_ACCOUNTS">No Linked Accounts</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-secondary mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span>Found {totalCount} contacts matching criteria</span>
                            <div className="flex items-center gap-3">
                                {(search || filterAccountCount !== 'ALL' || sortBy !== 'name_asc') && (
                                    <button
                                        onClick={() => {
                                            setSearch(''); setFilterAccountCount('ALL'); setSortBy('name_asc');
                                            setCurrentPage(1);
                                            setTriggerFetch(prev => prev + 1);
                                        }}
                                        className="text-primary font-bold hover:underline py-1 px-3 bg-primary/5 rounded-full"
                                    >
                                        Reset Filters
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setCurrentPage(1);
                                        setTriggerFetch(prev => prev + 1);
                                    }}
                                    className="btn btn-sm btn-primary px-4 rounded-full"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isFetching ? (
                        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950">
                            <div className="relative flex items-center justify-center w-20 h-20">
                                {/* Outer ring */}
                                <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                                {/* Middle ring */}
                                <div className="absolute inset-3 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                                <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-red-400 animate-spin [animation-duration:600ms] [animation-direction:reverse]" />
                                {/* Inner dot */}
                                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-slate-800 dark:text-slate-100 text-sm font-bold tracking-wide">Loading Contacts</p>
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            No contacts match your criteria.
                        </div>
                    ) : (
                        contacts.map((contact: Contact) => (
                            <div key={contact.id} className="card p-6 flex flex-col gap-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-800 dark:text-blue-200 font-bold shrink-0">
                                            {contact.first_name[0]}{contact.last_name[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{contact.first_name} {contact.last_name}</h3>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                <p className="text-secondary flex items-center gap-1.5 text-sm font-medium">
                                                    <Phone size={14} className="text-primary" /> {contact.phone1}
                                                </p>
                                                {contact.phone2 && (
                                                    <p className="text-secondary flex items-center gap-1.5 text-sm font-medium">
                                                        <Phone size={14} className="text-primary" /> {contact.phone2}
                                                    </p>
                                                )}
                                                {contact.email && (
                                                    <p className="text-secondary flex items-center gap-1.5 text-sm font-medium">
                                                        <Mail size={14} className="text-primary" /> {contact.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleExpand(contact.id)}
                                            className={`p-2 rounded-xl transition-all ${expandedContacts[contact.id] ? 'bg-primary text-white shadow-md' : 'text-primary hover:bg-primary/10'}`}
                                            title="View Details"
                                        >
                                            <ArrowUpDown size={20} />
                                        </button>
                                        <button onClick={() => handleOpenModal(contact)} className="p-2 text-slate-400 hover:text-primary rounded-xl transition-colors">
                                            <Edit3 size={20} />
                                        </button>
                                        <button onClick={() => setConfirmDeleteContact(contact.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Loan Summary Mini-Dashboard */}
                                <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 mt-2">
                                    <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Total Lent</p>
                                        <p className="text-sm font-black text-emerald-500">Rs. {(contact.loan_stats?.total_lent || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Borrowed</p>
                                        <p className="text-sm font-black text-rose-500">Rs. {(contact.loan_stats?.total_loaned || 0).toLocaleString()}</p>
                                    </div>
                                    <div className={`text-center p-2 rounded-xl shadow-sm border ${(contact.loan_stats?.net_balance || 0) >= 0
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
                                        : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
                                        }`}>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Net Balance</p>
                                        <p className={`text-sm font-black ${(contact.loan_stats?.net_balance || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {(contact.loan_stats?.net_balance || 0) >= 0 ? '+' : ''} Rs. {(contact.loan_stats?.net_balance || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className={`transition-all duration-300 ease-in-out border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0 ${expandedContacts[contact.id] ? 'max-h-[1000px] opacity-100 visible' : 'max-h-0 opacity-0 invisible overflow-hidden pt-0 border-transparent'}`}>
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <h4 className="font-bold flex items-center gap-2">
                                            Linked Accounts
                                            <span className="bg-slate-200 dark:bg-slate-800 text-xs px-2 py-0.5 rounded-full">{contact.accounts?.length}</span>
                                        </h4>
                                        <button
                                            onClick={() => handleOpenAccountModal(contact)}
                                            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                                        >
                                            <Plus size={16} /> Link Account
                                        </button>
                                    </div>

                                    {contact.accounts && contact.accounts.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {contact.accounts.map((acc: ContactAccount) => (
                                                <div key={acc.id} className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl flex items-center justify-between group">
                                                    <div>
                                                        <h5 className="font-bold text-sm">{acc.account_name}</h5>
                                                        <p className="text-secondary text-xs">{acc.bank_name}</p>
                                                        {acc.account_number && <p className="text-slate-500 text-[10px] font-medium tracking-wide mt-1">{acc.account_number}</p>}
                                                        {acc.iban && <p className="text-slate-400 text-[10px] tracking-wide mt-0.5">{acc.iban}</p>}
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                                                        <button onClick={() => handleOpenAccountModal(contact, acc)} className="p-2 text-slate-400 hover:text-primary">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button onClick={() => setConfirmDeleteAccount(acc.id)} className="p-2 text-slate-400 hover:text-red-500">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-secondary bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">No accounts linked yet.</p>
                                    )}
                                </div>

                                {/* Expandable Details Section */}
                                {expandedContacts[contact.id] && (
                                    <div className="mt-4 space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 animate-scale-in">
                                        {/* Loans Section */}
                                        {(() => {
                                            const activeLoans = contact.loans?.filter((loan) => !loan.is_closed).slice(0, 5) ?? [];
                                            return activeLoans.length > 0 ? (
                                                <div>
                                                    <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 mb-3">
                                                        <HandCoins size={14} className="text-orange-500" /> Recent Loans & Lents
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                                        {activeLoans.map((loan) => (
                                                            <div key={loan.id} className="p-3 rounded-xl border bg-white dark:bg-slate-800 border-orange-100 dark:border-orange-900/30 shadow-sm flex flex-col gap-2">

                                                                {/* Header: Type badge + Status */}
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${loan.type === 'TAKEN' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20'}`}>
                                                                        {loan.type === 'TAKEN' ? 'BORROWED' : 'LENT'}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">
                                                                        Active
                                                                    </span>
                                                                </div>

                                                                {/* Amounts */}
                                                                <div className="flex items-end justify-between">
                                                                    <div>
                                                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Remaining</p>
                                                                        <p className="text-base font-black text-slate-800 dark:text-white">
                                                                            Rs. {parseFloat(loan.remaining_amount).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Total</p>
                                                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                                                            Rs. {parseFloat(loan.total_amount).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Progress bar: remaining vs total */}
                                                                {loan.total_amount && (
                                                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                                                        <div
                                                                            className={`h-1.5 rounded-full ${loan.type === 'TAKEN' ? 'bg-rose-400' : 'bg-emerald-400'}`}
                                                                            style={{ width: `${Math.min((parseFloat(loan.remaining_amount) / parseFloat(loan.total_amount)) * 100, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Description */}
                                                                <p className="text-[11px] text-secondary truncate">
                                                                    {loan.description || <span className="italic opacity-50">No description</span>}
                                                                </p>

                                                                {/* Date */}
                                                                <p className="text-[9px] text-slate-400 font-medium mt-auto">
                                                                    {new Date(loan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-secondary italic opacity-60">No active loans with this contact.</p>
                                            );
                                        })()}

                                        {/* Transactions Section */}
                                        <div>
                                            <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 mb-3">
                                                <HistoryIcon size={14} className="text-blue-500" /> Recent Activity
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                                {contact.transactions && contact.transactions.length > 0 ? (
                                                    contact.transactions.slice(0, 5).map((t) => {
                                                        const mainSplit = t.accounts[0]?.splits[0];
                                                        const type = mainSplit?.type || 'EXPENSE';
                                                        const isIncome = ['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(type);
                                                        return (
                                                            <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10'}`}>
                                                                        {type === 'INCOME' ? 'IN' : type === 'EXPENSE' ? 'EX' : type === 'LOAN_TAKEN' ? 'LT' : type === 'MONEY_LENT' ? 'ML' : type === 'REPAYMENT' ? 'RP' : 'RB'}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[13px] font-bold truncate">{t.note || type.replace('_', ' ')}</p>
                                                                        <p className="text-[9px] text-secondary font-medium">
                                                                            {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <p className={`text-[13px] font-black shrink-0 ml-2 ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {isIncome ? '+' : '-'} Rs. {parseFloat(t.total_amount).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="col-span-full text-center py-4 text-[11px] text-secondary italic opacity-60 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                        No activity history.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                />
            </main >

            {/* Contact Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="card w-full max-w-md animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">{editingContact ? 'Edit Contact' : 'New Contact'}</h2>
                                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">First Name</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={form.first_name}
                                            onChange={e => setForm({ ...form, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={form.last_name}
                                            onChange={e => setForm({ ...form, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Primary Phone</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="+92..."
                                            value={form.phone1}
                                            onChange={e => setForm({ ...form, phone1: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Secondary Phone</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="+92..."
                                            value={form.phone2}
                                            onChange={e => setForm({ ...form, phone2: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email Address (Optional)</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        placeholder="contact@example.com"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!form.first_name || !form.last_name || !form.phone1}
                                >
                                    {editingContact ? 'Update Contact' : 'Save Contact'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Account Modal */}
            {
                isAccountModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="card w-full max-w-md animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">
                                    {editingAccount ? `Edit Account for ${selectedContact?.first_name} ${selectedContact?.last_name}` : `Add Account for ${selectedContact?.first_name} ${selectedContact?.last_name}`}
                                </h2>
                                <button onClick={() => setIsAccountModalOpen(false)}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleAddAccount} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bank / Platform</label>
                                    <select
                                        className="input-field"
                                        value={accountForm.bank_name}
                                        onChange={e => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                                        required
                                    >
                                        {BANK_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Personal, Business"
                                        value={accountForm.account_name}
                                        onChange={e => setAccountForm({ ...accountForm, account_name: e.target.value })}
                                        required
                                    />
                                </div>
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
                                <button
                                    type="submit"
                                    className="btn btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!accountForm.account_name || !accountForm.account_number}
                                >
                                    {editingAccount ? 'Update Account' : 'Add Account'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
            <ConfirmModal
                isOpen={confirmDeleteContact !== null}
                title="⚠️ Delete Contact Permanently"
                message="This will permanently delete this contact and ALL of their associated accounts as well as Loan Records. This action is irreversible and cannot be undone."
                confirmText="Delete Permanently"
                variant="danger"
                onConfirm={() => {
                    if (confirmDeleteContact !== null) {
                        deleteContact(confirmDeleteContact);
                    }
                }}
                onCancel={() => setConfirmDeleteContact(null)}
            />
            <ConfirmModal
                isOpen={confirmDeleteAccount !== null}
                title="Remove Account from Contact"
                message="This will remove the account from this contact."
                confirmText="Remove Account"
                variant="warning"
                onConfirm={() => {
                    if (confirmDeleteAccount !== null) {
                        deleteAccount(confirmDeleteAccount);
                    }
                }}
                onCancel={() => setConfirmDeleteAccount(null)}
            />
        </div >
    );
}
