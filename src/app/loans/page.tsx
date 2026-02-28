'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, X, ArrowUpRight, ArrowDownRight, CheckCircle2, Edit3, Trash2, Search, Filter } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import { getErrorMessage } from '@/lib/error-handler';
import Pagination from '@/components/Pagination';

export default function LoansPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [loans, setLoans] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState<any>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [form, setForm] = useState({ contact: '', type: 'TAKEN', total_amount: '', description: '', is_closed: false });
    const [contactForm, setContactForm] = useState({ first_name: '', last_name: '', phone1: '' });
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 5;

    // Filter & sort
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'TAKEN' | 'LENT'>('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
    const [filterMinAmount, setFilterMinAmount] = useState('');
    const [filterMaxAmount, setFilterMaxAmount] = useState('');
    const [sortBy, setSortBy] = useState<'amount_desc' | 'amount_asc' | 'name_asc' | 'name_desc'>('amount_desc');
    const [triggerFetch, setTriggerFetch] = useState(0);
    const [isFetching, setIsFetching] = useState(true);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) {
            fetchLoans();
            fetchContacts();
        }
    }, [user, loading, currentPage, triggerFetch]);

    const fetchLoans = async () => {
        setIsFetching(true);
        try {
            const params: any = {
                page: currentPage,
                search: search || undefined,
                type: filterType !== 'ALL' ? filterType : undefined,
                status: filterStatus !== 'ALL' ? filterStatus : undefined,
                min_amount: filterMinAmount || undefined,
                max_amount: filterMaxAmount || undefined,
                ordering: sortBy === 'amount_desc' ? '-amount' :
                    sortBy === 'amount_asc' ? 'amount' :
                        sortBy === 'name_asc' ? 'contact__first_name' :
                            sortBy === 'name_desc' ? '-contact__first_name' : '-created_at'
            };
            const res = await api.get('loans/', { params });
            setLoans(res.data.results);
            setTotalCount(res.data.count);
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetching(false);
        }
    };

    const fetchContacts = async () => {
        try {
            const res = await api.get('contacts/');
            setContacts(res.data);
        } catch (err) {
            console.error(err);
            showToast(getErrorMessage(err), 'error');
        }
    };

    const handleOpenModal = (loan: any = null) => {
        if (loan) {
            setEditingLoan(loan);
            setForm({
                contact: loan.contact || '',
                type: loan.type,
                total_amount: loan.total_amount,
                description: loan.description || '',
                is_closed: loan.is_closed || false
            });
        } else {
            setEditingLoan(null);
            setForm({ contact: '', type: 'TAKEN', total_amount: '', description: '', is_closed: false });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                remaining_amount: editingLoan ? editingLoan.remaining_amount : form.total_amount
            };

            if (editingLoan) {
                await api.put(`loans/${editingLoan.id}/`, payload);
                showToast('Loan record updated successfully!', 'success');
            } else {
                await api.post('loans/', payload);
                showToast('Loan record created!', 'success');
            }
            setIsModalOpen(false);
            setEditingLoan(null);
            setForm({ contact: '', type: 'TAKEN', total_amount: '', description: '', is_closed: false });
            fetchLoans();
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
            console.error(err);
        }
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('contacts/', contactForm);
            showToast('Contact created and selected!', 'success');
            setIsContactModalOpen(false);
            setContactForm({ first_name: '', last_name: '', phone1: '' });
            setForm({ ...form, contact: res.data.id });
            fetchContacts();
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
            console.error(err);
        }
    };

    const deleteLoan = async (id: number) => {
        try {
            await api.delete(`loans/${id}/`);
            showToast('Loan record deleted.', 'info');
            fetchLoans();
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
            console.error(err);
        } finally {
            setConfirmDelete(null);
        }
    };

    const getDisplayName = (loan: any) => {
        return loan.contact_name || 'Unknown Contact';
    };


    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="mx-[20px] mt-8 space-y-8 animate-fade-in">
                {/* Modern Filter & Sort Bar */}
                <div className="card overflow-hidden border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md mb-6 transition-all duration-300">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-2 text-primary">
                            <Filter size={18} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Find Records</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {(search || filterType !== 'ALL' || filterStatus !== 'ALL' || filterMinAmount || filterMaxAmount || sortBy !== 'amount_desc') && (
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
                                {showAdvancedFilters ? 'Hide Panel' : 'Filter Records'}
                            </button>
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${showAdvancedFilters ? 'max-h-[1000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Search</label>
                                <div className="relative group">
                                    {/* <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" /> */}
                                    <input
                                        type="text"
                                        className="input-field pl-10 h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="Name..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Type</label>
                                <select
                                    className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value as any)}
                                >
                                    <option value="ALL">All Records</option>
                                    <option value="TAKEN">Loans Taken</option>
                                    <option value="LENT">Money Lent</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Status</label>
                                <select
                                    className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value as any)}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="ACTIVE">Active Only</option>
                                    <option value="CLOSED">Closed Only</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Sort</label>
                                <select
                                    className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as any)}
                                >
                                    <option value="amount_desc">💰 Highest Amount</option>
                                    <option value="amount_asc">💰 Lowest Amount</option>
                                    <option value="name_asc">🔤 Name A→Z</option>
                                    <option value="name_desc">🔤 Name Z→A</option>
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Amount Range (Rs.)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="Minimum"
                                        value={filterMinAmount}
                                        onChange={e => setFilterMinAmount(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="input-field h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="Maximum"
                                        value={filterMaxAmount}
                                        onChange={e => setFilterMaxAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-secondary mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span>
                                Found {totalCount} matching records
                            </span>
                            <div className="flex items-center gap-3">
                                {(search || filterType !== 'ALL' || filterStatus !== 'ALL' || filterMinAmount || filterMaxAmount || sortBy !== 'amount_desc') && (
                                    <button
                                        onClick={() => {
                                            setSearch(''); setFilterType('ALL'); setFilterStatus('ALL'); setFilterMinAmount(''); setFilterMaxAmount(''); setSortBy('amount_desc');
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
                            <p className="text-slate-800 dark:text-slate-100 text-sm font-bold tracking-wide">Loading Loans</p>
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    </div>
                ) : loans.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        No loans match your criteria.
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Active Loans */}
                            <section className="space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <span className="p-1 px-3 bg-red-500/10 text-red-500 text-xs rounded-full">Owed by me</span>
                                    Loans Taken
                                </h2>
                                <div className="space-y-4">
                                    {loans.filter((l: any) => l.type === 'TAKEN' && !l.is_closed).map((loan: any) => (
                                        <div key={loan.id} className="card border-l-4 border-red-500">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-lg truncate">{getDisplayName(loan)}</h3>
                                                    <p className="text-sm text-secondary break-words whitespace-pre-wrap mt-1">{loan.description || 'No notes'}</p>
                                                </div>
                                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                    <div className="text-left sm:text-left">
                                                        <p className="text-xs font-bold text-secondary uppercase">Remaining</p>
                                                        <p className="text-xl font-bold text-red-500">Rs. {parseFloat(loan.remaining_amount).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                                <span className="text-xs text-secondary">Total: Rs. {parseFloat(loan.total_amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {loans.filter((l: any) => l.type === 'TAKEN' && !l.is_closed).length === 0 && (
                                        <div className="p-8 text-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-secondary text-sm">No active loans.</div>
                                    )}
                                </div>
                            </section>

                            {/* Money Lent */}
                            <section className="space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <span className="p-1 px-3 bg-green-500/10 text-green-500 text-xs rounded-full">Owed to me</span>
                                    Money Lent
                                </h2>
                                <div className="space-y-4">
                                    {loans.filter((l: any) => l.type === 'LENT' && !l.is_closed).map((loan: any) => (
                                        <div key={loan.id} className="card border-l-4 border-green-500">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-lg truncate">{getDisplayName(loan)}</h3>
                                                    <p className="text-sm text-secondary break-words whitespace-pre-wrap mt-1">{loan.description || 'No notes'}</p>
                                                </div>
                                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                    <div className="text-left sm:text-left">
                                                        <p className="text-xs font-bold text-secondary uppercase">Remaining</p>
                                                        <p className="text-xl font-bold text-green-500">Rs. {parseFloat(loan.remaining_amount).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                                <span className="text-xs text-secondary">Total: Rs. {parseFloat(loan.total_amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {loans.filter((l: any) => l.type === 'LENT' && !l.is_closed).length === 0 && (
                                        <div className="p-8 text-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-secondary text-sm">No pending collections.</div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Closed Records */}
                        <section className="space-y-4 mt-12 opacity-60 grayscale hover:grayscale-0 transition-all">
                            <h2 className="text-xl font-bold">Closed Records</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {loans.filter((l: any) => l.is_closed).map((loan: any) => (
                                    <div key={loan.id} className="card flex items-center justify-between p-4 bg-slate-50 relative group">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="text-green-500" size={20} />
                                            <div>
                                                <p className="font-bold text-sm">{getDisplayName(loan)}</p>
                                                <p className="text-xs text-secondary">{loan.type === 'TAKEN' ? 'Paid Back' : 'Reimbursed'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">Rs. {parseFloat(loan.total_amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {loans.filter((l: any) => l.is_closed).length === 0 && (
                                    <div className="p-8 text-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-secondary text-sm md:col-span-3">No closed records.</div>
                                )}
                            </div>
                        </section>
                    </>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                />
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="card w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-slate-900 pb-2">
                            <h2 className="text-2xl font-bold">{editingLoan ? 'Edit Record' : 'Add Loan Record'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex rounded-xl bg-slate-100 p-1">
                                <button
                                    type="button"
                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${form.type === 'TAKEN' ? 'bg-white shadow' : 'text-secondary'}`}
                                    onClick={() => setForm({ ...form, type: 'TAKEN' })}
                                >
                                    Loan Taken
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${form.type === 'LENT' ? 'bg-white shadow' : 'text-secondary'}`}
                                    onClick={() => setForm({ ...form, type: 'LENT' })}
                                >
                                    Money Lent
                                </button>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium">Select Contact</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsContactModalOpen(true)}
                                        className="text-xs text-primary font-bold hover:underline"
                                    >
                                        + New Contact
                                    </button>
                                </div>
                                <select
                                    className="input-field"
                                    value={form.contact}
                                    onChange={e => setForm({ ...form, contact: e.target.value })}
                                    required
                                >
                                    <option value="">-- Choose Contact --</option>
                                    {contacts.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Total Amount (Rs.)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="0.00"
                                    value={form.total_amount}
                                    onChange={e => setForm({ ...form, total_amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                            {editingLoan && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                    <input
                                        type="checkbox"
                                        id="is_closed"
                                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                        checked={form.is_closed}
                                        onChange={e => setForm({ ...form, is_closed: e.target.checked })}
                                    />
                                    <label htmlFor="is_closed" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                        Mark as Closed / Settled
                                    </label>
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary w-full mt-4">
                                {editingLoan ? 'Update Record' : 'Save Record'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Inline Contact Modal */}
            {isContactModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="card w-full max-w-sm animate-fade-in shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Quick Add Contact</h2>
                            <button onClick={() => setIsContactModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">First Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={contactForm.first_name}
                                        onChange={e => setContactForm({ ...contactForm, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={contactForm.last_name}
                                        onChange={e => setContactForm({ ...contactForm, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={contactForm.phone1}
                                    onChange={e => setContactForm({ ...contactForm, phone1: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full">Create & Select</button>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={confirmDelete !== null}
                title="Delete Loan Record"
                message="Are you sure? This will permanently delete the loan record. This action cannot be undone."
                confirmText="Yes, Delete"
                onConfirm={() => { if (confirmDelete !== null) deleteLoan(confirmDelete); }}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
}
