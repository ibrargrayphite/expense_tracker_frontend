'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { TrendingUp, TrendingDown, Landmark, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

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
}

interface Transaction {
  id: number;
  amount: string;
  type: string;
  note: string;
  date: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<{
    accounts: Account[];
    loans: Loan[];
    transactions: Transaction[];
  }>({
    accounts: [],
    loans: [],
    transactions: [],
  });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchDashboardData();
    }
  }, [user, loading]);

  const fetchDashboardData = async () => {
    try {
      const [accountsRes, loansRes, transactionsRes] = await Promise.all([
        api.get('accounts/'),
        api.get('loans/'),
        api.get('transactions/'),
      ]);
      setData({
        accounts: accountsRes.data,
        loans: loansRes.data,
        transactions: transactionsRes.data.slice(0, 5), // Only last 5
      });
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const totalBalance = data.accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance), 0);
  const totalLent = data.loans
    .filter((l: any) => l.type === 'LENT')
    .reduce((sum: number, l: any) => sum + parseFloat(l.remaining_amount), 0);
  const totalTaken = data.loans
    .filter((l: any) => l.type === 'TAKEN')
    .reduce((sum: number, l: any) => sum + parseFloat(l.remaining_amount), 0);

  return (
    <div className="min-h-screen pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8 animate-fade-in">
        <header>
          <h1 className="text-4xl font-extrabold tracking-tight">Finances Overview</h1>
          <p className="text-secondary mt-1">Everything looks good today.</p>
        </header>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="card bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none">
            <div className="flex justify-between items-start mb-4">
              <span className="opacity-80 font-medium text-sm md:text-base">Total Balance</span>
              <Landmark size={20} className="opacity-80 shrink-0" />
            </div>
            <div className="text-2xl md:text-3xl font-bold break-all">Rs. {totalBalance.toLocaleString()}</div>
            <div className="mt-4 text-xs font-semibold uppercase tracking-wider opacity-60">Across {data.accounts.length} accounts</div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <span className="text-secondary font-medium text-sm md:text-base">Money Lent</span>
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500 shrink-0">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold break-all">Rs. {totalLent.toLocaleString()}</div>
            <div className="mt-4 text-xs font-semibold text-green-600 uppercase tracking-wider">To be received</div>
          </div>

          <div className="card sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start mb-4">
              <span className="text-secondary font-medium text-sm md:text-base">Loans Taken</span>
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                <ArrowDownRight size={20} />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold break-all">Rs. {totalTaken.toLocaleString()}</div>
            <div className="mt-4 text-xs font-semibold text-red-600 uppercase tracking-wider">To be repaid</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Recent Transactions</h2>
              <button onClick={() => router.push('/transactions')} className="text-primary text-sm font-semibold hover:underline">View All</button>
            </div>
            <div className="card p-0 overflow-hidden">
              {data.transactions.length === 0 ? (
                <div className="p-8 text-center text-secondary">No transactions yet.</div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {data.transactions.map((t: any) => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type)
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                          }`}>
                          {['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type) ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{t.note || t.type}</p>
                          <div className="flex items-center gap-2 text-xs text-secondary">
                            <Clock size={12} />
                            {format(new Date(t.date), 'MMM dd, h:mm a')}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold ${['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type) ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type) ? '+' : '-'} Rs. {parseFloat(t.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Accounts Summary */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Your Accounts</h2>
              <button onClick={() => router.push('/accounts')} className="text-primary text-sm font-semibold hover:underline">Manage</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.accounts.map((acc: any) => (
                <div key={acc.id} className="card p-4 flex flex-col justify-between border-l-4" style={{ borderColor: 'var(--primary)' }}>
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase mb-1">{acc.bank_name}</p>
                    <p className="font-semibold truncate">{acc.account_name}</p>
                  </div>
                  <div className="mt-4 text-xl font-bold">Rs. {parseFloat(acc.balance).toLocaleString()}</div>
                </div>
              ))}
              {data.accounts.length === 0 && (
                <div className="col-span-2 text-center py-8 text-secondary">No accounts added.</div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
