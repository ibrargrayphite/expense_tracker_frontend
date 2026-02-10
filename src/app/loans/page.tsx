'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, X, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

export default function LoansPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [loans, setLoans] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ person_name: '', type: 'TAKEN', total_amount: '', description: '' });

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) fetchLoans();
    }, [user, loading]);

    const fetchLoans = async () => {
        try {
            const res = await api.get('loans/');
            setLoans(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('loans/', {
                ...form,
                remaining_amount: form.total_amount
            });
            setIsModalOpen(false);
            setForm({ person_name: '', type: 'TAKEN', total_amount: '', description: '' });
            fetchLoans();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Loans & Lending</h1>
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                        <Plus size={20} /> New Record
                    </button>
                </div>

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
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">{loan.person_name}</h3>
                                            <p className="text-sm text-secondary">{loan.description || 'No notes'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-secondary uppercase">Remaining</p>
                                            <p className="text-xl font-bold text-red-500">Rs. {parseFloat(loan.remaining_amount).toLocaleString()}</p>
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
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">{loan.person_name}</h3>
                                            <p className="text-sm text-secondary">{loan.description || 'No notes'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-secondary uppercase">Remaining</p>
                                            <p className="text-xl font-bold text-green-500">Rs. {parseFloat(loan.remaining_amount).toLocaleString()}</p>
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
                            <div key={loan.id} className="card flex items-center justify-between p-4 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="text-green-500" size={20} />
                                    <div>
                                        <p className="font-bold text-sm">{loan.person_name}</p>
                                        <p className="text-xs text-secondary">{loan.type === 'TAKEN' ? 'Paid Back' : 'Reimbursed'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm">Rs. {parseFloat(loan.total_amount).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="card w-full max-w-md animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Add Loan Record</h2>
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
                                <label className="block text-sm font-medium mb-1">Person Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Who is involved?"
                                    value={form.person_name}
                                    onChange={e => setForm({ ...form, person_name: e.target.value })}
                                    required
                                />
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
                            <button type="submit" className="btn btn-primary w-full mt-4">Save Record</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
