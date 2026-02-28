'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, X, Check, Search } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import { getErrorMessage } from '@/lib/error-handler';
import Pagination from '@/components/Pagination';
import { div } from 'framer-motion/client';

interface Category {
    id: number;
    name: string;
    description: string;
}

export default function CategoriesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
    const [incomeSources, setIncomeSources] = useState<Category[]>([]);
    const [fetching, setFetching] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [form, setForm] = useState({ name: '', description: '' });
    const [deleteConfig, setDeleteConfig] = useState<{ id: number; type: 'EXPENSE' | 'INCOME' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination state
    const [expPage, setExpPage] = useState(1);
    const [incPage, setIncPage] = useState(1);
    const [totalExpCount, setTotalExpCount] = useState(0);
    const [totalIncCount, setTotalIncCount] = useState(0);
    const PAGE_SIZE = 5;

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) {
            fetchCategories();
        }
    }, [user, loading, expPage, incPage]);

    const fetchCategories = async () => {
        try {
            const [expRes, incRes] = await Promise.all([
                api.get('expense-categories/', { params: { page: expPage } }),
                api.get('income-sources/', { params: { page: incPage } }),
            ]);
            setExpenseCategories(expRes.data.results);
            setTotalExpCount(expRes.data.count);
            setIncomeSources(incRes.data.results);
            setTotalIncCount(incRes.data.count);
        } catch (err) {
            console.error(err);
            showToast(getErrorMessage(err), 'error');
        } finally {
            setFetching(false);
        }
    };

    const handleOpenModal = (type: 'EXPENSE' | 'INCOME', category?: Category) => {
        setModalType(type);
        if (category) {
            setEditingCategory(category);
            setForm({ name: category.name, description: category.description || '' });
        } else {
            setEditingCategory(null);
            setForm({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = modalType === 'EXPENSE' ? 'expense-categories/' : 'income-sources/';
        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await api.put(`${endpoint}${editingCategory.id}/`, form);
                showToast('Category updated successfully', 'success');
            } else {
                await api.post(endpoint, form);
                showToast('Category created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (err) {
            console.error(err);
            showToast(getErrorMessage(err), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfig) return;
        const endpoint = deleteConfig.type === 'EXPENSE' ? 'expense-categories/' : 'income-sources/';
        setIsDeleting(true);
        try {
            await api.delete(`${endpoint}${deleteConfig.id}/`);
            showToast('Category deleted', 'success');
            fetchCategories();
        } catch (err) {
            console.error(err);
            showToast(getErrorMessage(err), 'error');
        } finally {
            setIsDeleting(false);
            setDeleteConfig(null);
        }
    };



    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <main className="mx-[20px] py-8 space-y-12">
                <header>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Categories</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage your expense types and income sources.</p>
                </header>

                {fetching ? (
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
                            <p className="text-slate-800 dark:text-slate-100 text-sm font-bold tracking-wide">Loading Categories</p>
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Expense Categories */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <span className="w-2 h-8 bg-red-500 rounded-full" />
                                    Expense Categories
                                </h2>
                                <button
                                    onClick={() => handleOpenModal('EXPENSE')}
                                    className="btn btn-primary btn-sm flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add New
                                </button>
                            </div>
                            <div className="grid gap-3">
                                {expenseCategories.map(cat => (
                                    <div key={cat.id} className="card flex items-center justify-between p-4 group hover:border-red-500/30 transition-all">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 break-words">{cat.name}</h3>
                                            {cat.description && <p className="text-xs text-slate-500 mt-1 break-words">{cat.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal('EXPENSE', cat)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => setDeleteConfig({ id: cat.id, type: 'EXPENSE' })} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {expenseCategories.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                        No expense categories found.
                                    </div>
                                )}
                            </div>
                            <Pagination
                                currentPage={expPage}
                                totalCount={totalExpCount}
                                pageSize={PAGE_SIZE}
                                onPageChange={setExpPage}
                            />
                        </section>

                        {/* Income Sources */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <span className="w-2 h-8 bg-green-500 rounded-full" />
                                    Income Sources
                                </h2>
                                <button
                                    onClick={() => handleOpenModal('INCOME')}
                                    className="btn btn-primary btn-sm flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add New
                                </button>
                            </div>
                            <div className="grid gap-3">
                                {incomeSources.map(cat => (
                                    <div key={cat.id} className="card flex items-center justify-between p-4 group hover:border-green-500/30 transition-all">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 break-words">{cat.name}</h3>
                                            {cat.description && <p className="text-xs text-slate-500 mt-1 break-words">{cat.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal('INCOME', cat)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => setDeleteConfig({ id: cat.id, type: 'INCOME' })} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {incomeSources.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                        No income sources found.
                                    </div>
                                )}
                            </div>
                            <Pagination
                                currentPage={incPage}
                                totalCount={totalIncCount}
                                pageSize={PAGE_SIZE}
                                onPageChange={setIncPage}
                            />
                        </section>
                    </div>
                )}
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black">{editingCategory ? 'Edit' : 'Add'} {modalType === 'EXPENSE' ? 'Expense Category' : 'Income Source'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    placeholder="e.g. Food, Salary, etc."
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description (Optional)</label>
                                <textarea
                                    className="input-field min-h-[100px]"
                                    placeholder="Add some details..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={!form.name || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving…
                                        </>
                                    ) : 'Save Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfig && (
                <ConfirmModal
                    isOpen={!!deleteConfig}
                    title="Delete Category?"
                    message="This action cannot be undone. Are you sure?"
                    isLoading={isDeleting}
                    onConfirm={handleDelete}
                    onCancel={() => !isDeleting && setDeleteConfig(null)}
                />
            )}
        </div>
    );
}
