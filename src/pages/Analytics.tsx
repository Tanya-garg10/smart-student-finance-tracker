import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Zap, 
  ChevronRight, Calculator, PieChart as PieIcon,
  BarChart2, Info, Lightbulb
} from 'lucide-react';
import { 
  format, parseISO, subMonths, startOfMonth, 
  endOfMonth, isWithinInterval, eachMonthOfInterval 
} from 'date-fns';
import { getFinancialAdvice, FinancialInsight } from '../lib/groq';
import { cn } from '../lib/utils';
import RecurringExpenses from '../components/RecurringExpenses';
import ExpenseHeatmap from '../components/ExpenseHeatmap';
import { generateMonthlyReport, exportToCSV, exportToJSON } from '../lib/reportUtils';
import { FileDown, Loader2, Download } from 'lucide-react';


export default function Analytics() {
  const { transactions, categories, goals, user, addGoal, addNotification, getHealthScore } = useFinance();
  const [viewType, setViewType] = useState<'month' | 'year'>('month');
  const [whatIfReduction, setWhatIfReduction] = useState(20);
  const [aiInsights, setAiInsights] = useState<FinancialInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAIAdvice = async () => {
    setIsGenerating(true);
    try {
      const advice = await getFinancialAdvice(transactions, categories, user.monthlyBudget);
      setAiInsights(advice);
      return advice;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadReport = async () => {
    setIsExporting(true);
    try {
      // 1. Get current month data
      const now = new Date();
      const currentTransactions = transactions.filter(t => 
        isWithinInterval(parseISO(t.date), { start: startOfMonth(now), end: endOfMonth(now) })
      );
      
      const income = currentTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = currentTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      // 2. Map categories for the report
      const reportCategories = categoryData.map(c => ({
        name: c.name,
        value: c.value,
        color: c.color
      }));

      // 3. Get AI insights (generate if not present)
      let currentInsights = aiInsights;
      if (currentInsights.length === 0) {
        currentInsights = await handleGenerateAIAdvice();
      }

      // 4. Map goals
      const reportGoals = goals.map(g => ({
        name: g.name,
        target: g.targetAmount,
        current: g.currentAmount,
        progress: (g.currentAmount / g.targetAmount) * 100
      }));

      // 5. Generate PDF
      await generateMonthlyReport({
        userName: user.name,
        month: now,
        summary: {
          income,
          expense,
          savings: income - expense,
          healthScore: getHealthScore()
        },
        categories: reportCategories,
        goals: reportGoals,
        insights: currentInsights.map(i => ({ title: i.title, desc: i.desc }))
      });

      addNotification({
        title: 'Report Downloaded',
        message: 'Your monthly statement is ready.',
        type: 'success'
      });
    } catch (error) {
      console.error(error);
      addNotification({
        title: 'Report Failed',
        message: 'Could not generate report.',
        type: 'warning'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAnalyticsCSV = async () => {
    const now = new Date();
    const currentTransactions = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: startOfMonth(now), end: endOfMonth(now) })
    );
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = currentTransactions.map(t => [
      t.date, t.description, t.category, t.type, t.amount
    ]);
    await exportToCSV(headers, rows, `StudentFin_Analytics_${format(now, 'MMM_yyyy')}`);
  };

  const handleExportAnalyticsJSON = async () => {
    const now = new Date();
    const currentTransactions = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: startOfMonth(now), end: endOfMonth(now) })
    );
    await exportToJSON(currentTransactions, `StudentFin_Analytics_${format(now, 'MMM_yyyy')}`);
  };


  // 1. Spending Trend (Last 6 Months)
  const spendingTrend = useMemo(() => {
    const end = new Date();
    const start = viewType === 'month' ? subMonths(end, 5) : subMonths(end, 11);
    const months = eachMonthOfInterval({ start, end });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTx = transactions.filter(t => 
        isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
      );

      return {
        name: format(month, 'MMM'),
        Income: monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        Expense: monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [transactions]);

  // 2. Category Breakdown (Current Month)
  const categoryData = useMemo(() => {
    const now = new Date();
    const interval = viewType === 'month' 
      ? { start: startOfMonth(now), end: endOfMonth(now) }
      : { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };

    const data: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), interval))
      .forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
      });

    return Object.entries(data).map(([name, value]) => ({
      name,
      value,
      color: categories.find(c => c.name === name)?.color || '#94a3b8'
    })).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // 3. Current vs Previous Month
  const comparisonData = useMemo(() => {
    const now = new Date();
    const currentStart = startOfMonth(now);
    const prevStart = startOfMonth(subMonths(now, 1));
    const prevEnd = endOfMonth(subMonths(now, 1));

    const currentExp = transactions
      .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: currentStart, end: now }))
      .reduce((sum, t) => sum + t.amount, 0);

    const prevExp = transactions
      .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: prevStart, end: prevEnd }))
      .reduce((sum, t) => sum + t.amount, 0);

    return [
      { name: 'Previous Month', amount: prevExp },
      { name: 'Current Month', amount: currentExp },
    ];
  }, [transactions]);

  // 4. Smart Insights
  const insights = useMemo(() => {
    const list = [];
    const totalExp = categoryData.reduce((sum, item) => sum + item.value, 0);
    
    // Top category insight
    if (categoryData.length > 0) {
      const top = categoryData[0];
      const percentage = ((top.value / totalExp) * 100).toFixed(0);
      list.push({
        title: `High ${top.name} Spending`,
        desc: `${top.name} accounts for ${percentage}% of your expenses this month.`,
        type: top.value > (user.monthlyBudget * 0.4) ? 'warning' : 'info'
      });
    }

    // Budget insight
    const budgetUsage = (totalExp / user.monthlyBudget) * 100;
    if (budgetUsage > 90) {
      list.push({
        title: 'Budget Alert',
        desc: 'You have used 90%+ of your monthly budget.',
        type: 'danger'
      });
    } else if (budgetUsage < 50 && totalExp > 0) {
      list.push({
        title: 'Great Progress',
        desc: 'You are well within your budget this month!',
        type: 'success'
      });
    }

    // Saving rate
    const now = new Date();
    const currentIncome = transactions
      .filter(t => t.type === 'income' && isWithinInterval(parseISO(t.date), { start: startOfMonth(now), end: now }))
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (currentIncome > 0) {
      const rate = ((currentIncome - totalExp) / currentIncome) * 100;
      if (rate > 20) {
        list.push({
          title: 'Strong Savings Rate',
          desc: `You're saving ${rate.toFixed(0)}% of your income!`,
          type: 'success'
        });
      }
    }

    return list;
  }, [categoryData, user.monthlyBudget, transactions]);

  const potentialSavings = (categoryData.length > 0 ? categoryData[0].value : 0) * (whatIfReduction / 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Financial Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Deep dive into your money patterns</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportAnalyticsCSV}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
            title="Download CSV"
          >
            <Download size={18} />
          </button>
          <button 
            onClick={handleExportAnalyticsJSON}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
            title="Download JSON"
          >
            <div className="font-black text-[10px]">JS</div>
          </button>
          <button 
            onClick={handleDownloadReport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
            Download AI Report
          </button>
          <button 
            onClick={handleGenerateAIAdvice}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
            Refresh AI Insights
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto">
          <button 
            onClick={() => setViewType('month')}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all",
              viewType === 'month' 
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Month View
          </button>
          <button 
            onClick={() => setViewType('year')}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all",
              viewType === 'year' 
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Year View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spending Trend Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 size={20} className="text-indigo-500" />
                Income vs Expenses
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-slate-500">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-medium text-slate-500">Expense</span>
                </div>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTrend}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    labelStyle={{fontWeight: 'bold', marginBottom: '4px'}}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <ExpenseHeatmap />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Pie */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <PieIcon size={20} className="text-indigo-500" />
                Category Split
              </h3>
              <div className="h-64">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">No data</div>
                )}
              </div>
            </div>

            {/* Comparison Bar */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-500" />
                Month Comparison
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={40}>
                      {comparisonData.map((entry, index) => (
                        <Cell key={index} fill={index === 0 ? '#cbd5e1' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Insights area */}
        <div className="space-y-6">
          {/* Smart Insights Panel */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lightbulb size={20} className="text-amber-300" />
                Smart Insights
              </h3>
              <button 
                onClick={handleGenerateAIAdvice}
                disabled={isGenerating}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50"
                title="Generate AI Advice"
              >
                <Zap size={16} className={isGenerating ? 'animate-pulse' : 'text-amber-300'} />
              </button>
            </div>
            <div className="space-y-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3 opacity-80">
                  <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-xs font-medium animate-pulse">Groq is analyzing your finances...</p>
                </div>
              ) : (
                <>
                  {[...insights, ...aiInsights].length > 0 ? [...insights, ...aiInsights].map((insight, i) => (
                    <div key={i} className={`bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 animate-in slide-in-from-bottom-2 duration-300`} style={{animationDelay: `${i * 100}ms`}}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          insight.type === 'danger' ? 'bg-rose-400' : 
                          insight.type === 'warning' ? 'bg-amber-400' : 
                          insight.type === 'success' ? 'bg-emerald-400' : 'bg-indigo-300'
                        }`} />
                        <p className="font-bold text-sm">{insight.title}</p>
                      </div>
                      <p className="text-xs text-indigo-100 leading-relaxed">{insight.desc}</p>
                    </div>
                  )) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-indigo-100 italic mb-4">Continue tracking to see smart insights.</p>
                      <button 
                        onClick={handleGenerateAIAdvice}
                        className="text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20"
                      >
                        Ask AI Advisor
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>


          {/* What-If Simulator */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-indigo-500" />
              What-If Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              See how much you could save if you reduced spending in your top category.
            </p>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Reduction</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{whatIfReduction}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={whatIfReduction}
                  onChange={(e) => setWhatIfReduction(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Estimated Extra Savings</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(potentialSavings)}
                </p>
                <p className="text-[10px] text-slate-400 mt-2">
                  *Based on reducing {categoryData[0]?.name || 'expenses'}
                </p>
              </div>

              <button 
                onClick={() => {
                  const goalName = `Saving from ${categoryData[0]?.name || 'Expenses'}`;
                  addGoal({
                    name: goalName,
                    targetAmount: potentialSavings * 4, // 4 months of these savings
                    deadline: format(subMonths(new Date(), -4), 'yyyy-MM-dd')
                  });
                  addNotification({
                    title: 'Goal Created!',
                    message: `Goal "${goalName}" added with target ₹${(potentialSavings * 4).toLocaleString()}.`,
                    type: 'success'
                  });
                }}
                className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                Create Savings Goal <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <RecurringExpenses />
        </div>
      </div>
    </div>
  );
}
