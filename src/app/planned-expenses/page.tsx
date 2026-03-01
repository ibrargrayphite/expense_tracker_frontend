'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import {
    Plus, X, Trash2, Edit3, CalendarClock, CheckCircle2,
    Circle, Filter, ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/error-handler';
import ConfirmModal from '@/components/ConfirmModal';
import Pagination from '@/components/Pagination';

interface Category {
    id: number;
    name: string;
}

interface PlannedExpense {
    id: number;
    amount: string;
    start_date: string;
    end_date: string;
    category: number | null;
    category_name: string | null;
    note: string | null;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

const emptyForm = {
    amount: '',
    start_date: '',
    end_date: '',
    category: '',
    note: '',
    is_completed: false,
};

export default function PlannedExpensesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const [items, setItems] = useState<PlannedExpense[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Staged filter state (not yet applied)
    const [draftStatus, setDraftStatus] = useState<'pending' | 'completed' | 'overdue' | 'all'>('all');
    const [draftCategory, setDraftCategory] = useState('');
    const [draftOrdering, setDraftOrdering] = useState('end_date');

    // Applied filter state (triggers fetch)
    const [appliedStatus, setAppliedStatus] = useState<'pending' | 'completed' | 'overdue' | 'all'>('all');
    const [appliedCategory, setAppliedCategory] = useState('');
    const [appliedOrdering, setAppliedOrdering] = useState('end_date');
    const [triggerFetch, setTriggerFetch] = useState(0);

    // Pagination state
    const PAGE_SIZE = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<PlannedExpense | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const hasActiveFilters = appliedStatus !== 'all' || !!appliedCategory || appliedOrdering !== 'end_date';

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) fetchCategories();
    }, [user, loading]);

    useEffect(() => {
        if (user) fetchItems();
    }, [currentPage, triggerFetch, appliedStatus, appliedCategory, appliedOrdering]);

    const fetchCategories = async () => {
        try {
            const catRes = await api.get('expense-categories/dropdown/');
            setCategories(catRes.data.results ?? catRes.data);
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        }
    };

    const fetchItems = async () => {
        setIsFetching(true);
        try {
            const params: Record<string, any> = {
                page: currentPage,
                page_size: PAGE_SIZE,
            };
            if (appliedStatus !== 'all') params.status = appliedStatus;
            if (appliedCategory) params.category = appliedCategory;
            if (appliedOrdering !== 'end_date') params.ordering = appliedOrdering;

            const res = await api.get('planned-expenses/', { params });
            setItems(res.data.results ?? res.data);
            setTotalCount(res.data.count ?? (res.data.results ?? res.data).length);
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        } finally {
            setIsFetching(false);
        }
    };

    const applyFilters = () => {
        setAppliedStatus(draftStatus);
        setAppliedCategory(draftCategory);
        setAppliedOrdering(draftOrdering);
        setCurrentPage(1);
        setTriggerFetch(prev => prev + 1);
    };

    const clearFilters = () => {
        setDraftStatus('all');
        setDraftCategory('');
        setDraftOrdering('end_date');
        setAppliedStatus('all');
        setAppliedCategory('');
        setAppliedOrdering('end_date');
        setCurrentPage(1);
        setTriggerFetch(prev => prev + 1);
    };

    const openCreate = () => {
        setEditTarget(null);
        setForm(emptyForm);
        setIsModalOpen(true);
    };

    const openEdit = (item: PlannedExpense) => {
        setEditTarget(item);
        setForm({
            amount: item.amount,
            start_date: item.start_date,
            end_date: item.end_date,
            category: item.category?.toString() || '',
            note: item.note || '',
            is_completed: item.is_completed,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                amount: form.amount,
                start_date: form.start_date,
                end_date: form.end_date,
                category: form.category || null,
                note: form.note || null,
                is_completed: form.is_completed,
            };

            if (editTarget) {
                await api.patch(`planned-expenses/${editTarget.id}/`, payload);
                showToast('Planned expense updated!', 'success');
            } else {
                await api.post('planned-expenses/', payload);
                showToast('Planned expense created!', 'success');
            }
            setIsModalOpen(false);
            setCurrentPage(1);
            setTriggerFetch(prev => prev + 1);
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (confirmDelete === null) return;
        setIsDeleting(true);
        try {
            await api.delete(`planned-expenses/${confirmDelete}/`);
            showToast('Deleted successfully', 'success');
            setCurrentPage(1);
            setTriggerFetch(prev => prev + 1);
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        } finally {
            setIsDeleting(false);
            setConfirmDelete(null);
        }
    };

    const toggleComplete = async (item: PlannedExpense) => {
        console.log(item.id)
        console.log(item.is_completed)
        try {
            await api.patch(`planned-expenses/${item.id}/`, {
                amount: item.amount,
                start_date: item.start_date,
                end_date: item.end_date,
                category: item.category,
                note: item.note,
                is_completed: !item.is_completed
            });
            showToast(item.is_completed ? 'Marked as pending' : 'Marked as completed!', 'success');
            setTriggerFetch(prev => prev + 1);
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        }
    };

    const getItemStatus = (item: PlannedExpense): 'completed' | 'overdue' | 'pending' => {
        if (item.is_completed) return 'completed';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = parseISO(item.end_date);
        if (end < today) return 'overdue';
        return 'pending';
    };

    // Stats across the full unfiltered dataset — we re-fetch these via a separate "all" call
    // For simplicity, stats are computed from the current page items (approximation)
    const pageStats = useMemo(() => {
        const total = items.reduce((s, i) => s + parseFloat(i.amount), 0);
        return { total, count: totalCount };
    }, [items, totalCount]);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <main className="mx-[20px] py-8 space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Planned Expenses</h1>
                    <button onClick={() => openCreate()} className="btn btn-primary">
                        <Plus size={20} /> Add Planned Expense
                    </button>
                </div>

                {/* Filter Panel */}
                <div className="card overflow-hidden border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-2 text-primary">
                            <Filter size={18} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Filter Planned Expenses</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {hasActiveFilters && (
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold">
                                    Filters Applied
                                </span>
                            )}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="btn btn-sm px-4 rounded-full btn-primary shadow-lg shadow-primary/20 flex items-center gap-1"
                            >
                                {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {showFilters ? 'Hide' : 'Filter Options'}
                            </button>
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[400px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                                <select
                                    className="input-field h-11"
                                    value={draftStatus}
                                    onChange={e => setDraftStatus(e.target.value as any)}
                                >
                                    <option value="all">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                                <select
                                    className="input-field h-11"
                                    value={draftCategory}
                                    onChange={e => setDraftCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
                                <select
                                    className="input-field h-11"
                                    value={draftOrdering}
                                    onChange={e => setDraftOrdering(e.target.value)}
                                >
                                    <option value="end_date">Due Date (Soonest)</option>
                                    <option value="-end_date">Due Date (Latest)</option>
                                    <option value="amount">Amount (Low → High)</option>
                                    <option value="-amount">Amount (High → Low)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span>{totalCount} result{totalCount !== 1 ? 's' : ''} match your criteria</span>
                            <div className="flex items-center gap-3">
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-primary font-bold hover:underline py-1 px-3 bg-primary/5 rounded-full"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                                <button
                                    onClick={applyFilters}
                                    className="btn btn-sm btn-primary px-4 rounded-full"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active filter pills + clear */}
                {hasActiveFilters && !showFilters && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-secondary font-medium">Active filters:</span>
                        {appliedStatus !== 'all' && appliedStatus !== 'pending' && (
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold capitalize">
                                {appliedStatus}
                            </span>
                        )}
                        {appliedCategory && (
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                                {categories.find(c => c.id.toString() === appliedCategory)?.name}
                            </span>
                        )}
                        {appliedOrdering !== 'end_date' && (
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                                {appliedOrdering === '-amount' ? 'Amount ↓' :
                                    appliedOrdering === 'amount' ? 'Amount ↑' :
                                        appliedOrdering === '-end_date' ? 'Due Date ↓' : ''}
                            </span>
                        )}
                        <button
                            onClick={clearFilters}
                            className="text-xs text-red-500 hover:underline font-semibold flex items-center gap-1"
                        >
                            <X size={12} /> Clear all
                        </button>
                    </div>
                )}

                {/* List */}
                {isFetching ? (
                    <div className="min-h-[400px] flex flex-col items-center justify-center gap-6">
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
                            <p className="text-slate-800 dark:text-slate-100 text-sm font-bold tracking-wide">Loading Planned Expenses</p>
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="card text-center py-20">
                        <h3 className="text-lg font-bold text-secondary mb-2">
                            {hasActiveFilters ? 'No planned expenses match your filters' : 'No planned expenses yet'}
                        </h3>
                        <p className="text-sm text-secondary mb-6">
                            {hasActiveFilters
                                ? 'Try adjusting your filters or clearing them.'
                                : 'Start planning your future expenses to stay on budget.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {items.map(item => {
                                const status = getItemStatus(item);
                                return (
                                    <div
                                        key={item.id}
                                        className={`card relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
                                            ${status === 'completed' ? 'border-l-4 border-green-500' :
                                                status === 'overdue' ? 'border-l-4 border-red-500' :
                                                    'border-l-4 border-amber-400'}`}
                                    >
                                        {/* Status + Actions row */}
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full
                                                ${status === 'completed' ? 'bg-green-500/10 text-green-600' :
                                                    status === 'overdue' ? 'bg-red-500/10 text-red-600' :
                                                        'bg-amber-400/10 text-amber-600'}`}>
                                                {status === 'overdue' ? '⚠ Overdue' : status === 'completed' ? '✓ Completed' : '● Pending'}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    id={`edit-planned-${item.id}`}
                                                    onClick={() => openEdit(item)}
                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-primary"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                <button
                                                    id={`delete-planned-${item.id}`}
                                                    onClick={() => setConfirmDelete(item.id)}
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className={`text-3xl font-black tracking-tight mb-1 ${item.is_completed ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                                            Rs. {parseFloat(item.amount).toLocaleString()}
                                        </div>

                                        {/* Category */}
                                        {item.category_name && (
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Tag size={12} className="text-primary" />
                                                <span className="text-xs font-semibold text-primary">{item.category_name}</span>
                                            </div>
                                        )}

                                        {/* Note */}
                                        {item.note && (
                                            <p className="text-xs text-secondary mb-3 line-clamp-2 italic">"{item.note}"</p>
                                        )}

                                        {/* Dates */}
                                        <div className="flex items-center gap-2 text-xs text-secondary mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <CalendarClock size={12} />
                                            <span>{format(parseISO(item.start_date), 'MMM dd')} – {format(parseISO(item.end_date), 'MMM dd, yyyy')}</span>
                                        </div>

                                        {/* Updated at */}
                                        <div className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
                                            Updated {format(new Date(item.updated_at), 'MMM dd, yyyy')}
                                        </div>

                                        {/* Toggle complete */}
                                        <button
                                            id={`toggle-complete-${item.id}`}
                                            onClick={() => toggleComplete(item)}
                                            className={`mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all duration-200
                                                ${item.is_completed
                                                    ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary/10 hover:text-primary'}`}
                                        >
                                            {item.is_completed
                                                ? <><CheckCircle2 size={16} /> Mark as Pending</>
                                                : <><Circle size={16} /> Mark as Complete</>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
                <Pagination
                    currentPage={currentPage}
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                />
            </main>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="card w-full max-w-lg animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                                {editTarget ? 'Edit Plan' : 'New Planned Expense'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800">
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Amount */}
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Amount (Rs.) *</label>
                                <input
                                    id="planned-amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    placeholder="0.00"
                                    className="input-field py-3 text-xl font-black"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                />
                            </div>

                            {/* Date range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Start Date *</label>
                                    <input
                                        id="planned-start-date"
                                        type="date"
                                        required
                                        className="input-field py-3"
                                        value={form.start_date}
                                        onChange={e => setForm({ ...form, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">End Date *</label>
                                    <input
                                        id="planned-end-date"
                                        type="date"
                                        required
                                        min={form.start_date || undefined}
                                        className="input-field py-3"
                                        value={form.end_date}
                                        onChange={e => setForm({ ...form, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Category</label>
                                <select
                                    id="planned-category"
                                    className="input-field py-3"
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                >
                                    <option value="">-- No Category --</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Note</label>
                                <textarea
                                    id="planned-note"
                                    className="input-field min-h-[80px]"
                                    placeholder="What is this expense for?"
                                    value={form.note}
                                    onChange={e => setForm({ ...form, note: e.target.value })}
                                />
                            </div>

                            {/* Completed toggle */}
                            {editTarget && (
                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <input
                                        id="planned-is-completed"
                                        type="checkbox"
                                        className="w-4 h-4 accent-primary"
                                        checked={form.is_completed}
                                        onChange={e => setForm({ ...form, is_completed: e.target.checked })}
                                    />
                                    <label htmlFor="planned-is-completed" className="text-sm font-semibold cursor-pointer select-none">
                                        Mark as completed
                                    </label>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="planned-submit-btn"
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary flex-1"
                                >
                                    {isSubmitting ? 'Saving...' : editTarget ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmDelete !== null}
                title="Delete Planned Expense"
                message="Are you sure you want to delete this planned expense? This action cannot be undone."
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
}
