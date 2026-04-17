import React, { useState, useMemo } from 'react';
import { useFinance, Transaction } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { 
  ArrowUpRight, ArrowDownRight, Plus, Lightbulb, 
  Target, Pencil, Trash2, TrendingUp, AlertCircle,
  TrendingDown, Zap, ChevronRight, Brain, Activity, Sparkles
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import TransactionModal from '../components/TransactionModal';

const TIPS = [
  "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
  "Look for student discounts on software and subscriptions.",
  "Cook meals at home instead of eating out to save significantly.",
  "Buy used textbooks or rent them instead of buying new.",
  "Track every small expense; they add up quickly!",
];

export default function Dashboard() {
  const { user, transactions, categories, goals, deleteTransaction, getHealthScore, getMonthlyPrediction } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Calculate metrics
  const currentMonthTransactions = transactions.filter(t => 
    isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
  );

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Chart Data: Expenses by Category
  const expenseByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({
      name,
      value,
      color: categories.find(c => c.name === name)?.color || '#cbd5e1'
    })).sort((a, b) => b.value - a.value);
  }, [currentMonthTransactions, categories]);

  // Budget Progress
  const budgetPercentage = user.monthlyBudget > 0 ? (monthlyExpense / user.monthlyBudget) * 100 : 0;
  
  const getBudgetStatus = () => {
    if (budgetPercentage > 100) return { color: 'text-rose-600', bg: 'bg-rose-500', label: 'Over Budget!' };
    if (budgetPercentage > 85) return { color: 'text-amber-600', bg: 'bg-amber-500', label: 'Warning' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Healthy' };
  };

  const status = getBudgetStatus();
  const healthScore = getHealthScore();
  const projectedExpense = getMonthlyPrediction();

  // AI Behavior Analyst logic
  const behaviorInsights = useMemo(() => {
    const insights = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekExp = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= oneWeekAgo)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastWeekExp = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    if (thisWeekExp > lastWeekExp * 1.25 && lastWeekExp > 0) {
      const diff = ((thisWeekExp - lastWeekExp) / lastWeekExp) * 100;
      insights.push({
        title: 'Spending Spike',
        desc: `You're spending ${diff.toFixed(0)}% more than last week.`,
        type: 'warning',
        icon: TrendingUp
      });
    }

    if (projectedExpense > user.monthlyBudget && user.monthlyBudget > 0) {
      insights.push({
        title: 'Budget Projection',
        desc: `At this rate, you'll exceed your budget by ${formatCurrency(projectedExpense - user.monthlyBudget)}.`,
        type: 'danger',
        icon: AlertCircle
      });
    }

    return insights;
  }, [transactions, projectedExpense, user.monthlyBudget]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Header Welcome */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hi, {user.name || 'Student'} 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
            "Your money goes where you tell it to go."
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {setModalType('expense'); setIsModalOpen(true);}}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} /> Add Expense
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-slate-900 to-indigo-900 dark:from-indigo-600 dark:to-violet-700 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Total Balance</p>
            <h3 className="text-4xl font-black text-white mb-6">
              {formatCurrency(user.balance)}
            </h3>
            <div className="flex gap-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-3 py-1.5 flex items-center gap-1">
                <ArrowUpRight size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-white">{formatCurrency(monthlyIncome)}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-3 py-1.5 flex items-center gap-1">
                <ArrowDownRight size={14} className="text-rose-400" />
                <span className="text-xs font-bold text-white">{formatCurrency(monthlyExpense)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Progress Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity size={100} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Monthly Budget</h3>
              <p className="text-sm font-bold text-slate-400">Limit: {formatCurrency(user.monthlyBudget)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Score</p>
              <div className={cn(
                "text-2xl font-black",
                healthScore >= 80 ? "text-emerald-500" : healthScore >= 60 ? "text-amber-500" : "text-rose-500"
              )}>
                {healthScore}/100
              </div>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-black">
                <span className="text-indigo-600 dark:text-indigo-400">{budgetPercentage.toFixed(1)}% Used</span>
                <span className="text-slate-400">{formatCurrency(user.monthlyBudget - monthlyExpense)} Remaining</span>
              </div>
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 rounded-xl ${status.bg}`} 
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Projection</p>
                <p className={cn(
                  "text-lg font-black",
                  projectedExpense > user.monthlyBudget ? "text-rose-500" : "text-emerald-500"
                )}>
                  {formatCurrency(projectedExpense)}
                </p>
              </div>
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                status.color,
                "bg-slate-50 dark:bg-slate-900"
              )}>
                {status.label}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Alerts & Tips */}
        <div className="space-y-6">
          {/* AI Analysts */}
          {behaviorInsights.map((insight, idx) => (
            <div key={idx} className={cn(
              "p-6 rounded-3xl border flex gap-4 animate-in slide-in-from-left duration-500 shadow-sm",
              insight.type === 'danger' ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30'
            )} style={{ animationDelay: `${idx * 150}ms` }}>
              <div className={cn(
                "p-3 rounded-2xl",
                insight.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              )}>
                <insight.icon size={24} />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Brain size={14} className="text-indigo-500" />
                  {insight.title}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {insight.desc}
                </p>
              </div>
            </div>
          ))}

          {/* Fallback Overspending Alert if no AI insights */}
          {behaviorInsights.length === 0 && budgetPercentage > 80 && (
            <div className={`p-6 rounded-3xl border ${budgetPercentage > 100 ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30'} flex gap-4 animate-in zoom-in duration-300`}>
              <div className={`p-3 rounded-2xl ${budgetPercentage > 100 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white">Overspending Alert!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  You have used <span className="font-bold text-rose-500">{budgetPercentage.toFixed(0)}%</span> of your budget. Slow down on non-essentials!
                </p>
              </div>
            </div>
          )}

          {/* Smart Tip Card */}
          <div className="bg-indigo-600 p-8 rounded-[40px] text-white relative overflow-hidden group shadow-xl shadow-indigo-600/20">
            <Lightbulb size={100} className="absolute -bottom-4 -right-4 opacity-10 group-hover:rotate-12 transition-transform duration-500" />
            <h3 className="text-lg font-black mb-3 flex items-center gap-2">
              <Zap size={20} className="text-amber-300" />
              Smart Finance Tip
            </h3>
            <p className="text-indigo-100 font-medium leading-relaxed italic">
              "{tip}"
            </p>
            <div className="mt-6">
              <Link to="/analytics" className="text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                See Analytics <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Col: Category Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Target size={24} className="text-indigo-600" />
              Category Breakdown
            </h3>
            <Link to="/transactions" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-48">
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic font-bold">No Data Yet</div>
              )}
            </div>
            <div className="space-y-3">
              {expenseByCategory.slice(0, 4).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}} />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{entry.name}</span>
                  </div>
                  <span className="text-sm font-black">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight size={24} className="text-indigo-600" />
            Recent Activity
          </h3>
          <Link to="/transactions" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View All Records</Link>
        </div>
        
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-[28px] bg-slate-50 dark:bg-slate-900/40 hover:scale-[1.01] transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                    {t.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-sm">{t.description}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{t.category} • {format(parseISO(t.date), 'MMM d')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-slate-400 font-bold italic">Start adding transactions to see them here!</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal 
        isOpen={isModalOpen || !!editingTransaction} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }} 
        initialType={modalType} 
        transactionToEdit={editingTransaction}
      />
    </div>
  );
}
