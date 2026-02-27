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

    const toggleExpand = (id: number) => {
        setExpandedContacts(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Filter & sort
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'accounts_asc' | 'accounts_desc'>('name_asc');
    const [filterAccountCount, setFilterAccountCount] = useState<'ALL' | 'HAS_ACCOUNTS' | 'NO_ACCOUNTS'>('ALL');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) fetchContacts();
    }, [user, loading]);

    const fetchContacts = async () => {
        try {
            const res = await api.get('contacts/');
            setContacts(res.data);
        } catch (err) {
            console.error(err);
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

    const filteredContacts = contacts
        .filter(c => {
            const name = `${c.first_name} ${c.last_name}`.toLowerCase();
            const matchesSearch = !search ||
                name.includes(search.toLowerCase()) ||
                c.phone1.includes(search) ||
                (c.phone2 && c.phone2.includes(search)) ||
                (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
            const matchesAccountCount = filterAccountCount === 'ALL' ||
                (filterAccountCount === 'HAS_ACCOUNTS' && c.accounts.length > 0) ||
                (filterAccountCount === 'NO_ACCOUNTS' && c.accounts.length === 0);
            return matchesSearch && matchesAccountCount;
        })
        .sort((a, b) => {
            const nameA = `${a.first_name} ${a.last_name}`;
            const nameB = `${b.first_name} ${b.last_name}`;
            if (sortBy === 'name_asc') return nameA.localeCompare(nameB);
            if (sortBy === 'name_desc') return nameB.localeCompare(nameA);
            if (sortBy === 'accounts_asc') return a.accounts.length - b.accounts.length;
            if (sortBy === 'accounts_desc') return b.accounts.length - a.accounts.length;
            return 0;
        });
    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6 animate-fade-in">
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
                            <span>Found {filteredContacts.length} contacts matching criteria</span>
                            {(search || filterAccountCount !== 'ALL' || sortBy !== 'name_asc') && (
                                <button
                                    onClick={() => { setSearch(''); setFilterAccountCount('ALL'); setSortBy('name_asc'); }}
                                    className="text-primary font-bold hover:underline py-1 px-3 bg-primary/5 rounded-full"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {filteredContacts.map((contact: Contact) => (
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

                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-secondary">
                                        <CreditCard size={16} /> Linked Accounts
                                    </h4>
                                    <button
                                        onClick={() => handleOpenAccountModal(contact)}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {contact.accounts?.map((acc) => (
                                        <div key={acc.id} className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl flex items-center justify-between group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                            <div>
                                                <p className="font-bold text-[13px]">{acc.account_name} ({acc.bank_name})</p>
                                                <p className="text-[10px] text-secondary">{acc.account_number}{acc.iban ? ` | IBAN: ${acc.iban}` : ''}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {acc.bank_name !== "CASH" && (
                                                    <>
                                                        <button onClick={() => handleOpenAccountModal(contact, acc)} className="p-1 text-slate-400 hover:text-primary transition-colors">
                                                            <Edit3 size={12} />
                                                        </button>
                                                        <button onClick={() => setConfirmDeleteAccount(acc.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!contact.accounts || contact.accounts.length === 0) && (
                                        <p className="text-[11px] text-secondary italic opacity-60">No linked personal accounts.</p>
                                    )}
                                </div>
                            </div>

                            {/* Expandable Details Section */}
                            {expandedContacts[contact.id] && (
                                <div className="mt-4 space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 animate-scale-in">
                                    {/* Loans Section */}
                                    <div>
                                        <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 mb-3">
                                            <HandCoins size={14} className="text-orange-500" /> Loans & Lents
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {contact.loans && contact.loans.filter((loan) => !loan.is_closed).length > 0 ? (
                                                contact.loans.filter((loan) => !loan.is_closed).map((loan) => (
                                                    <div key={loan.id} className={`p-3 rounded-xl border ${loan.is_closed ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 border-orange-100 dark:border-orange-900/30 shadow-sm'}`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${loan.type === 'TAKEN' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10'}`}>
                                                                {loan.type === 'TAKEN' ? 'BORROWED' : 'LENT'}
                                                            </span>
                                                            <span className={`text-[10px] font-bold ${loan.is_closed ? 'text-slate-400' : 'text-orange-500'}`}>
                                                                {loan.is_closed ? 'Settled' : 'Active'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-black">Rs. {parseFloat(loan.remaining_amount).toLocaleString()}</p>
                                                        <p className="text-[10px] text-secondary truncate mt-1">{loan.description || 'No description'}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[11px] text-secondary italic opacity-60">No active loans with this contact.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transactions Section */}
                                    <div>
                                        <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 mb-3">
                                            <HistoryIcon size={14} className="text-blue-500" /> Recent Activity
                                        </h4>
                                        <div className="space-y-2">
                                            {contact.transactions && contact.transactions.length > 0 ? (
                                                contact.transactions.slice(0, 5).map((t) => {
                                                    const mainSplit = t.accounts[0]?.splits[0];
                                                    const type = mainSplit?.type || 'EXPENSE';
                                                    const isIncome = ['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(type);
                                                    return (
                                                        <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${isIncome
                                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10'
                                                                    : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10'
                                                                    }`}>
                                                                    {type === 'INCOME' ? 'IN' : type === 'EXPENSE' ? 'EX' : type === 'LOAN_TAKEN' ? 'LT' : type === 'MONEY_LENT' ? 'ML' : type === 'REPAYMENT' ? 'RP' : 'RB'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[13px] font-bold">{t.note || type.replace('_', ' ')}</p>
                                                                    <p className="text-[9px] text-secondary font-medium">
                                                                        {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p className={`text-[13px] font-black ${isIncome
                                                                ? 'text-emerald-500'
                                                                : 'text-rose-500'
                                                                }`}>
                                                                {isIncome ? '+' : '-'} Rs. {parseFloat(t.total_amount).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center py-4 text-[11px] text-secondary italic opacity-60 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                    No activity history.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {contacts.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl text-secondary">
                            No contacts added yet.
                        </div>
                    )}
                </div>
            </main>

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
