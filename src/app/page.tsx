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
  Calendar,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/error-handler';
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
  total_amount: string;
  type?: string; // Type might be nested now, but for simple display we can use this if available
  note: string;
  date: string;
  accounts: { account: number; bank_name: string; splits: { type: string; amount: string }[] }[];
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
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

  // Filter & sort state for dashboard sections
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionSortBy, setTransactionSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [accountSearch, setAccountSearch] = useState('');
  const [accountSortBy, setAccountSortBy] = useState<'balance_desc' | 'balance_asc' | 'name_asc' | 'name_desc'>('balance_desc');
  const [showTransactionFilters, setShowTransactionFilters] = useState(false);
  const [showAccountFilters, setShowAccountFilters] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      const [accountsRes, loansRes, transactionsRes] = await Promise.all([
        api.get('accounts/'),
        api.get('loans/'),
        api.get('transactions/'),
      ]);
      setData({
        accounts: accountsRes.data.results ?? accountsRes.data,
        loans: loansRes.data.results ?? loansRes.data,
        transactions: transactionsRes.data.results ?? transactionsRes.data,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast(getErrorMessage(error), 'error');
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

    let totalIncome = 0;
    let totalExpenses = 0;

    recentTransactions.forEach(t => {
      t.accounts.forEach(acc => {
        acc.splits.forEach(s => {
          if (['INCOME', 'REIMBURSEMENT'].includes(s.type)) totalIncome += parseFloat(s.amount);
          if (['EXPENSE', 'REPAYMENT'].includes(s.type)) totalExpenses += parseFloat(s.amount);
        });
      });
    });

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
      t.accounts.forEach(acc => {
        acc.splits.forEach(s => {
          if (['EXPENSE', 'REPAYMENT', 'MONEY_LENT'].includes(s.type)) {
            typeMap[s.type] = (typeMap[s.type] || 0) + parseFloat(s.amount);
          }
        });
      });
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
        t.accounts.forEach(acc => {
          acc.splits.forEach(s => {
            if (['INCOME', 'LOAN_TAKEN', 'REIMBURSEMENT'].includes(s.type)) {
              balance += parseFloat(s.amount);
            } else if (['EXPENSE', 'MONEY_LENT', 'REPAYMENT'].includes(s.type)) {
              balance -= parseFloat(s.amount);
            }
          });
        });
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

  // Filtered and sorted transactions for dashboard
  const filteredTransactions = useMemo(() => {
    return data.transactions
      .filter(t => {
        const matchesSearch = !transactionSearch ||
          t.note?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
          t.accounts.some(acc => acc.splits.some(s => s.type.toLowerCase().includes(transactionSearch.toLowerCase())));
        return matchesSearch;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (transactionSortBy === 'date_desc') return timeB - timeA;
        if (transactionSortBy === 'date_asc') return timeA - timeB;

        const amtA = parseFloat(a.total_amount);
        const amtB = parseFloat(b.total_amount);
        if (transactionSortBy === 'amount_desc') return amtB - amtA;
        if (transactionSortBy === 'amount_asc') return amtA - amtB;
        return 0;
      })
      .slice(0, 5); // Show only 5 most recent/filtered
  }, [data.transactions, transactionSearch, transactionSortBy]);

  // Filtered and sorted accounts for dashboard
  const filteredAccounts = useMemo(() => {
    return data.accounts
      .filter(acc => {
        const matchesSearch = !accountSearch ||
          acc.account_name.toLowerCase().includes(accountSearch.toLowerCase()) ||
          acc.bank_name.toLowerCase().includes(accountSearch.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        if (accountSortBy === 'balance_desc') return parseFloat(b.balance) - parseFloat(a.balance);
        if (accountSortBy === 'balance_asc') return parseFloat(a.balance) - parseFloat(b.balance);
        if (accountSortBy === 'name_asc') return a.account_name.localeCompare(b.account_name);
        if (accountSortBy === 'name_desc') return b.account_name.localeCompare(a.account_name);
        return 0;
      });
  }, [data.accounts, accountSearch, accountSortBy]);

  if (loading || fetching) {
    return (
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
          <p className="text-slate-800 dark:text-slate-100 text-sm font-bold tracking-wide">Loading Dashboard</p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-[20px] py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Dashboard</h1>
            <p className="text-secondary mt-1">Welcome back, {user?.first_name} {user?.last_name}!</p>
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
              <button
                onClick={() => setShowTransactionFilters(!showTransactionFilters)}
                className={`p-2 rounded-lg transition-colors ${showTransactionFilters ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Filter size={16} />
              </button>
            </div>

            {/* Transaction Filters */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showTransactionFilters ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="input-field text-sm h-10 bg-white dark:bg-slate-900 border-none sm:w-40"
                    value={transactionSortBy}
                    onChange={e => setTransactionSortBy(e.target.value as any)}
                  >
                    <option value="date_desc">📅 Newest</option>
                    <option value="date_asc">📅 Oldest</option>
                    <option value="amount_desc">💰 High</option>
                    <option value="amount_asc">💰 Low</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-[10px] text-secondary uppercase tracking-widest font-bold">
                  <span>{filteredTransactions.length} items</span>
                  {(transactionSearch || transactionSortBy !== 'date_desc') && (
                    <button
                      onClick={() => { setTransactionSearch(''); setTransactionSortBy('date_desc'); }}
                      className="text-primary hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredTransactions.map((t) => {
                const mainSplit = t.accounts[0]?.splits[0];
                const type = mainSplit?.type || 'EXPENSE';
                const isIncome = ['INCOME', 'REIMBURSEMENT', 'LOAN_TAKEN'].includes(type);
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-xl">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isIncome ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{t.note || type.replace('_', ' ')}</p>
                        <p className="text-xs text-secondary">{t.accounts[0]?.bank_name} • {format(new Date(t.date), 'MMM dd')}</p>
                      </div>
                    </div>
                    <div className={`font-bold whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}Rs. {parseFloat(t.total_amount).toLocaleString()}
                    </div>
                  </div>
                );
              })}
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-secondary">
                  {data.transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
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
              <button
                onClick={() => setShowAccountFilters(!showAccountFilters)}
                className={`p-2 rounded-lg transition-colors ${showAccountFilters ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <ArrowUpDown size={16} />
              </button>
            </div>

            {/* Account Filters */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showAccountFilters ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                      type="text"
                      className="input-field pl-8 text-sm h-10 bg-white dark:bg-slate-900 border-none"
                      placeholder="Search accounts…"
                      value={accountSearch}
                      onChange={e => setAccountSearch(e.target.value)}
                    />
                  </div> */}
                  <select
                    className="input-field text-sm h-10 bg-white dark:bg-slate-900 border-none sm:w-40"
                    value={accountSortBy}
                    onChange={e => setAccountSortBy(e.target.value as 'balance_desc' | 'balance_asc' | 'name_asc' | 'name_desc')}
                  >
                    <option value="balance_desc">💰 Balance High</option>
                    <option value="balance_asc">💰 Balance Low</option>
                    <option value="name_asc">🔤 Name A→Z</option>
                    <option value="name_desc">🔤 Name Z→A</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-[10px] text-secondary uppercase tracking-widest font-bold">
                  <span>{filteredAccounts.length} accounts</span>
                  {(accountSearch || accountSortBy !== 'balance_desc') && (
                    <button
                      onClick={() => { setAccountSearch(''); setAccountSortBy('balance_desc'); }}
                      className="text-primary hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredAccounts.map((acc) => (
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
      </main >
    </>
  );
}
