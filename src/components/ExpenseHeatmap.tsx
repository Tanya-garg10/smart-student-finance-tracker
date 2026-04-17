import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subMonths } from 'date-fns';
import { cn, formatCurrency } from '../lib/utils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ExpenseHeatmap() {
  const { getDailySpendingMap } = useFinance();
  const spendingMap = getDailySpendingMap();
  
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const maxSpending = useMemo(() => {
    const values = Object.values(spendingMap) as number[];
    return values.length > 0 ? Math.max(...values) : 1;
  }, [spendingMap]);

  const getIntensityClass = (amount: number) => {
    if (amount === 0) return 'bg-slate-100 dark:bg-slate-900/50 text-slate-400';
    const ratio = amount / maxSpending;
    if (ratio < 0.25) return 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-400';
    if (ratio < 0.5) return 'bg-indigo-300 dark:bg-indigo-700/40 text-indigo-100';
    if (ratio < 0.75) return 'bg-indigo-500 text-white';
    return 'bg-indigo-700 text-white shadow-lg shadow-indigo-600/20';
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarIcon size={24} className="text-indigo-600" />
          Spending Heatmap
        </h3>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-black px-2 min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            disabled={isSameMonth(currentMonth, new Date())}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">{d}</div>
        ))}
        {/* Placeholder for days of the week before 1st of month */}
        {Array.from({ length: days[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const amount = spendingMap[dateStr] || 0;
          return (
            <div 
              key={dateStr}
              className={cn(
                "aspect-square rounded-2xl flex flex-col items-center justify-center relative group transition-all duration-300 hover:scale-110 cursor-help",
                getIntensityClass(amount)
              )}
            >
              <span className="text-[10px] font-bold">{format(day, 'd')}</span>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-900 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap shadow-2xl border border-white/10">
                <p className="text-[10px] font-black text-indigo-400 uppercase mb-0.5">{format(day, 'MMMM d, yyyy')}</p>
                <p className="text-sm font-black">{amount > 0 ? formatCurrency(amount) : 'No Spending'}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intensity:</span>
          <div className="flex gap-1.5">
            <div className="w-4 h-4 rounded-md bg-slate-100 dark:bg-slate-900/50" />
            <div className="w-4 h-4 rounded-md bg-indigo-100 dark:bg-indigo-900/20" />
            <div className="w-4 h-4 rounded-md bg-indigo-300 dark:bg-indigo-700/40" />
            <div className="w-4 h-4 rounded-md bg-indigo-500" />
            <div className="w-4 h-4 rounded-md bg-indigo-700" />
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
          Max Daily: {formatCurrency(maxSpending)}
        </p>
      </div>
    </div>
  );
}
