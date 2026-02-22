'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Wallet,
  PieChart as PieChartIcon,
  Activity,
  Calendar
} from 'lucide-react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

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
  amount: string;
  type: string;
  note: string;
  date: string;
  account: number;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

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
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      const [accountsRes, loansRes, transactionsRes] = await Promise.all([
        api.get('/accounts/'),
        api.get('/loans/'),
        api.get('/transactions/'),
      ]);
      setData({
        accounts: accountsRes.data,
        loans: loansRes.data,
        transactions: transactionsRes.data,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setFetching(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBalance = data.accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const totalLent = data.loans
      .filter(l => l.type === 'LENT' && !l.is_closed)
      .reduce((sum, l) => sum + parseFloat(l.remaining_amount), 0);
    const totalTaken = data.loans
      .filter(l => l.type === 'TAKEN' && !l.is_closed)
      .reduce((sum, l) => sum + parseFloat(l.remaining_amount), 0);

    // Calculate income vs expenses for last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentTransactions = data.transactions.filter(t =>
      new Date(t.date) >= thirtyDaysAgo
    );

    const totalIncome = recentTransactions
      .filter(t => ['INCOME', 'REIMBURSEMENT'].includes(t.type))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = recentTransactions
      .filter(t => ['EXPENSE', 'REPAYMENT'].includes(t.type))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      totalBalance,
      totalLent,
      totalTaken,
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses,
    };
  }, [data]);

  // Prepare chart data for spending by category
  const spendingByType = useMemo(() => {
    const typeMap: { [key: string]: number } = {};
    data.transactions.forEach(t => {
      if (['EXPENSE', 'REPAYMENT', 'MONEY_LENT'].includes(t.type)) {
        typeMap[t.type] = (typeMap[t.type] || 0) + parseFloat(t.amount);
      }
    });

    return Object.entries(typeMap).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value: Math.round(value),
    }));
  }, [data.transactions]);

  // Prepare data for balance trend (last 7 days)
  const balanceTrend = useMemo(() => {
    const days = 7;
    const trend = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);

      // Calculate balance up to this day
      const transactionsUpToDay = data.transactions.filter(t =>
        new Date(t.date) <= date
      );

      let balance = 0;
      transactionsUpToDay.forEach(t => {
        if (['INCOME', 'LOAN_TAKEN', 'REIMBURSEMENT'].includes(t.type)) {
          balance += parseFloat(t.amount);
        } else if (['EXPENSE', 'MONEY_LENT', 'REPAYMENT'].includes(t.type)) {
          balance -= parseFloat(t.amount);
        }
      });

      trend.push({
        date: format(date, 'MMM dd'),
        balance: Math.round(balance),
      });
    }

    return trend;
  }, [data.transactions]);

  // Account distribution
  const accountDistribution = useMemo(() => {
    return data.accounts.map(acc => ({
      name: acc.bank_name,
      value: Math.round(parseFloat(acc.balance)),
    }));
  }, [data.accounts]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Dashboard</h1>
            <p className="text-secondary mt-1">Welcome back, {user?.username}!</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-secondary">
            <Calendar size={16} />
            <span>{format(new Date(), 'EEEE, MMMM dd, yyyy')}</span>
          </div>
        </header>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <span className="opacity-80 font-medium text-sm md:text-base">Total Balance</span>
              <Landmark size={20} className="opacity-80 shrink-0" />
            </div>
            <div className="text-2xl md:text-3xl font-bold break-all">Rs. {stats.totalBalance.toLocaleString()}</div>
            <div className="mt-4 text-xs font-semibold uppercase tracking-wider opacity-60">
              {data.accounts.length} accounts
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <span className="text-secondary font-medium text-sm md:text-base">Money Lent</span>
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500 shrink-0">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold break-all">Rs. {stats.totalLent.toLocaleString()}</div>
            <div className="mt-4 text-xs font-semibold text-green-600 uppercase tracking-wider">To be received</div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <span className="text-secondary font-medium text-sm md:text-base">Loans Taken</span>
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                <ArrowDownRight size={20} />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold break-all">Rs. {stats.totalTaken.toLocaleString()}</div>
            <div className="mt-4 text-xs font-semibold text-red-600 uppercase tracking-wider">To be repaid</div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <span className="text-secondary font-medium text-sm md:text-base">Net Cash Flow</span>
              <div className={`p-2 rounded-lg ${stats.netCashFlow >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} shrink-0`}>
                {stats.netCashFlow >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
            </div>
            <div className={`text-2xl md:text-3xl font-bold break-all ${stats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rs. {Math.abs(stats.netCashFlow).toLocaleString()}
            </div>
            <div className="mt-4 text-xs font-semibold text-secondary uppercase tracking-wider">Last 30 days</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance Trend */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="text-primary" size={20} />
              <h2 className="text-xl font-bold">Balance Trend (7 Days)</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={balanceTrend}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Spending Distribution */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="text-primary" size={20} />
              <h2 className="text-xl font-bold">Spending Distribution</h2>
            </div>
            {spendingByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={spendingByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent !== undefined ? `${name}: ${(percent * 100).toFixed(0)}%` : name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {spendingByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-secondary">
                No spending data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions & Account Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="text-primary" size={20} />
                <h2 className="text-xl font-bold">Recent Transactions</h2>
              </div>
            </div>
            <div className="space-y-3">
              {data.transactions.slice(0, 5).map((t) => {
                const account = data.accounts.find(a => a.id === t.account);
                const isIncome = ['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(t.type);
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} shrink-0`}>
                        {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{t.note || t.type.replace('_', ' ')}</p>
                        <p className="text-xs text-secondary">{account?.bank_name} • {format(new Date(t.date), 'MMM dd')}</p>
                      </div>
                    </div>
                    <div className={`font-bold whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}Rs. {parseFloat(t.amount).toLocaleString()}
                    </div>
                  </div>
                );
              })}
              {data.transactions.length === 0 && (
                <div className="text-center py-8 text-secondary">
                  No transactions yet
                </div>
              )}
            </div>
          </div>

          {/* Account Summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Wallet className="text-primary" size={20} />
                <h2 className="text-xl font-bold">Account Summary</h2>
              </div>
            </div>
            <div className="space-y-3">
              {data.accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {acc.bank_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{acc.account_name}</p>
                      <p className="text-xs text-secondary">{acc.bank_name}</p>
                    </div>
                  </div>
                  <div className="font-bold whitespace-nowrap">
                    Rs. {parseFloat(acc.balance).toLocaleString()}
                  </div>
                </div>
              ))}
              {data.accounts.length === 0 && (
                <div className="text-center py-8 text-secondary">
                  No accounts added yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary">{data.accounts.length}</div>
            <div className="text-sm text-secondary mt-1">Total Accounts</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary">{data.loans.filter(l => !l.is_closed).length}</div>
            <div className="text-sm text-secondary mt-1">Active Loans</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary">{data.transactions.length}</div>
            <div className="text-sm text-secondary mt-1">Total Transactions</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600">Rs. {stats.totalIncome.toLocaleString()}</div>
            <div className="text-sm text-secondary mt-1">Income (30d)</div>
          </div>
        </div>
      </main>
    </>
  );
}
