'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, X, Search, Filter, Image as ImageIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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
    person_name: string;
    type: string;
    remaining_amount: string;
    total_amount: string;
    is_closed: boolean;
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
    const [data, setData] = useState<{
        transactions: Transaction[];
        accounts: Account[];
        loans: Loan[];
    }>({ transactions: [], accounts: [], loans: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [form, setForm] = useState({
        account: '',
        loan: '',
        amount: '',
        type: 'EXPENSE',
        note: '',
    });
    const [accountForm, setAccountForm] = useState({ bank_name: 'JazzCash', account_name: '', balance: '0' });
    const [image, setImage] = useState<File | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) fetchData();
    }, [user, loading]);

    const fetchData = async () => {
        try {
            const [txRes, accRes, loanRes] = await Promise.all([
                api.get('transactions/'),
                api.get('accounts/'),
                api.get('loans/'),
            ]);
            setData({ transactions: txRes.data, accounts: accRes.data, loans: loanRes.data });
            if (accRes.data.length > 0 && !form.account) {
                setForm(prev => ({ ...prev, account: accRes.data[0].id.toString() }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(form).forEach(key => {
            if (form[key as keyof typeof form]) {
                formData.append(key, form[key as keyof typeof form]);
            }
        });
        if (image) {
            formData.append('image', image);
        }

        try {
            await api.post('transactions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsModalOpen(false);
            setImage(null);
            setForm({ ...form, amount: '', note: '', loan: '' });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('accounts/', accountForm);
            setIsAccountModalOpen(false);
            setAccountForm({ bank_name: 'JazzCash', account_name: '', balance: '0' });
            fetchData();
            setForm(prev => ({ ...prev, account: res.data.id.toString() }));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteTransaction = async (id: number) => {
        if (confirm('Delete this transaction? The account balance will be reversed.')) {
            try {
                await api.delete(`transactions/${id}/`);
                fetchData();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const getLoanDisplayName = (loan: any) => {
        if (loan.contact_name) return loan.contact_name;
        return loan.person_name || 'Unknown';
    };

    const BANK_OPTIONS = ['JazzCash', 'EasyPaisa', 'Nayapay', 'SadaPay', 'Bank Alfalah', 'Meezan Bank'];

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
                                {data.transactions.map((t: Transaction) => {
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
                                                    {t.image && <ImageIcon size={14} className="text-primary shrink-0" />}
                                                    <span>{t.note || '-'}</span>
                                                </div>
                                            </td>
                                            <td className={`p-4 text-sm font-bold text-right whitespace-nowrap ${['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type) ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type) ? '+' : '-'} Rs. {parseFloat(t.amount).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => deleteTransaction(t.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all">
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
                    {data.transactions.map((t: Transaction) => {
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
                                        <button onClick={() => deleteTransaction(t.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all shrink-0">
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
                                            <span className="break-words">{t.note}</span>
                                        </div>
                                    )}
                                    {t.image && (
                                        <div className="flex items-center gap-2 text-primary">
                                            <ImageIcon size={14} />
                                            <span className="text-xs">Has attachment</span>
                                        </div>
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
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            {['REPAYMENT', 'REIMBURSEMENT', 'LOAN_TAKEN', 'MONEY_LENT'].includes(form.type) && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Select Loan Record</label>
                                    <select
                                        className="input-field"
                                        value={form.loan}
                                        onChange={e => setForm({ ...form, loan: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Choose Person --</option>
                                        {data.loans
                                            .filter((l: any) =>
                                                (form.type === 'REPAYMENT' || form.type === 'LOAN_TAKEN' ? l.type === 'TAKEN' : l.type === 'LENT')
                                                && !l.is_closed
                                            )
                                            .map((l: any) => (
                                                <option key={l.id} value={l.id}>{getLoanDisplayName(l)} (Rem: Rs. {l.remaining_amount})</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Amount (Rs.)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    required
                                />
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
                            </div>

                            <button type="submit" className="btn btn-primary w-full mt-4">Record Transaction</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Inline Account Modal */}
            {isAccountModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="card w-full max-w-sm animate-fade-in shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Quick Add Account</h2>
                            <button onClick={() => setIsAccountModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAccountSubmit} className="space-y-4">
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
                            <button type="submit" className="btn btn-primary w-full mt-4">Save & Select</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
