import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';

export default function RecurringExpenses() {
  const { getRecurringExpenses } = useFinance();
  const recurring = getRecurringExpenses();

  if (recurring.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <RefreshCw size={24} className="text-indigo-600 animate-spin-slow" />
          Recurring Expenses
        </h3>
        <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 dark:border-indigo-800">
          AI Detected
        </div>
      </div>

      <div className="space-y-4">
        {recurring.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-indigo-500 transition-colors shadow-sm">
                <Calendar size={20} />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white text-sm capitalize">{item.description}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Occurs every month • {item.frequency} times logged</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-slate-900 dark:text-white">
                {formatCurrency(item.amount)}
              </p>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Fixed Cost</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl flex gap-3">
        <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
          These expenses appear multiple times with similar amounts. Consider if you can cancel any unused subscriptions to save ₹500+ / month.
        </p>
      </div>
    </div>
  );
}
