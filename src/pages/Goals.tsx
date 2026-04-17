import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { 
  Plus, Target, Trophy, PiggyBank, Award, X, ChevronRight, Zap, Sparkles, ReceiptText 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO, addMonths, differenceInDays } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToCSV, exportToJSON, saveFileAsync } from '../lib/reportUtils';
import { Download, FileText } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Trophy: <Trophy size={28} />,
  PiggyBank: <PiggyBank size={28} />,
  Target: <Target size={28} />,
  Award: <Award size={28} />,
  ReceiptText: <ReceiptText size={28} />,
  Sparkles: <Sparkles size={28} />,
};

export default function Goals() {
  const { transactions, goals, badges, addGoal, updateGoalProgress, deleteGoal, addNotification } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) return;
    addGoal({
      name,
      targetAmount: Number(targetAmount),
      deadline
    });
    addNotification({
      title: 'Goal Created!',
      message: `"${name}" has been added to your savings goals.`,
      type: 'success'
    });
    setName('');
    setTargetAmount('');
    setDeadline('');
    setIsModalOpen(false);
  };

  const handleAddFunds = (id: string) => {
    const amount = window.prompt('Enter amount to add to this goal:');
    if (amount && !isNaN(Number(amount))) {
      updateGoalProgress(id, Number(amount));
    }
  };

  // Calculate historical monthly savings rate
  const monthlySavingsRate = React.useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const months = Math.max(1, transactions.length > 0 ? differenceInDays(new Date(), new Date(transactions[transactions.length - 1].date)) / 30 : 1);
    return Math.max(1, (income - expenses) / months);
  }, [transactions]);

  const handleExportGoalsCSV = async () => {
    const headers = ['Goal Name', 'Target Amount', 'Current Amount', 'Deadline', 'Progress %'];
    const rows = goals.map(g => [
      g.name, g.targetAmount, g.currentAmount, g.deadline, ((g.currentAmount / g.targetAmount) * 100).toFixed(2)
    ]);
    await exportToCSV(headers, rows, `StudentFin_Goals_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportGoalsJSON = async () => {
    await exportToJSON(goals, `StudentFin_Goals_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportGoalsPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('Savings Goals Progress Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);

    const rows = goals.map(g => [
      g.name,
      formatCurrency(g.targetAmount),
      formatCurrency(g.currentAmount),
      format(parseISO(g.deadline), 'MMM d, yyyy'),
      `${((g.currentAmount / g.targetAmount) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [['Goal', 'Target', 'Saved', 'Deadline', 'Progress']],
      body: rows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    const pdfBlob = doc.output('blob');
    await saveFileAsync(pdfBlob, `StudentFin_Goals_${format(new Date(), 'yyyy-MM-dd')}.pdf`, 'application/pdf');
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Goals Section */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Savings Goals</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium italic">What are you dreaming of today?</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <button onClick={handleExportGoalsCSV} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-500" title="Export CSV"><Download size={18} /></button>
              <button onClick={handleExportGoalsJSON} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-500" title="Export JSON"><div className="text-[10px] font-black">JS</div></button>
              <button onClick={handleExportGoalsPDF} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-500" title="Export PDF"><FileText size={18} /></button>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={20} /> Create New Goal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {goals.map(goal => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const isComplete = progress >= 100;
            
            return (
              <div key={goal.id} className="group bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden hover:shadow-xl transition-all duration-500">
                {isComplete && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-3xl z-10 uppercase tracking-widest">
                    Completed
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-4 rounded-[24px] shadow-lg",
                      isComplete 
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" 
                        : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                    )}>
                      <Target size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{goal.name}</h3>
                      <p className="text-xs font-bold text-slate-400 mt-1">By {format(parseISO(goal.deadline), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saved Amount</p>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(goal.currentAmount)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</p>
                      <span className="text-sm font-bold text-slate-500">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="h-6 w-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden p-1.5 border border-slate-200/50 dark:border-slate-800">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 rounded-[10px]",
                        isComplete ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>{progress.toFixed(0)}% Achieved</span>
                    {!isComplete && (
                      <span className="text-indigo-500 flex items-center gap-1">
                        <Sparkles size={10} /> 
                        Est. Reach: {format(addMonths(new Date(), (goal.targetAmount - goal.currentAmount) / monthlySavingsRate), 'MMM yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                {!isComplete && (
                  <button 
                    onClick={() => handleAddFunds(goal.id)}
                    className="w-full mt-8 py-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 text-sm font-bold text-slate-600 dark:text-slate-300 rounded-2xl transition-all flex items-center justify-center gap-2 border border-dashed border-slate-200 dark:border-slate-700 group-hover:border-indigo-500/50 group-hover:text-indigo-600"
                  >
                    <Plus size={16} /> Add Contribution
                  </button>
                )}
              </div>
            );
          })}
          
          {goals.length === 0 && (
            <div className="col-span-full py-20 bg-white dark:bg-slate-800 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-700 text-center">
              <div className="mx-auto w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 text-slate-300">
                <Target size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No goals in sight</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Set a savings goal to start your financial journey.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-600 dark:text-indigo-400 font-black flex items-center gap-2 mx-auto hover:gap-3 transition-all"
              >
                Create your first goal <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Badges Section */}
      <section className="bg-slate-900 dark:bg-indigo-900/10 p-10 rounded-[50px] text-white">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-black tracking-tight mb-2">Badges & Achievements</h2>
          <p className="text-indigo-200 font-medium">Small wins lead to big financial freedom</p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
          {badges.map(badge => (
            <div 
              key={badge.id} 
              className={cn(
                "group relative p-6 rounded-[32px] transition-all duration-500 text-center",
                badge.earned 
                  ? "bg-white/10 backdrop-blur-md border border-white/20 hover:scale-105" 
                  : "bg-black/20 opacity-40 grayscale"
              )}
            >
              <div className={cn(
                "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                badge.earned 
                  ? "bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20" 
                  : "bg-slate-700 text-slate-500"
              )}>
                {iconMap[badge.icon] || <Trophy size={28} />}
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest mb-1">{badge.name}</h3>
              {badge.earned && badge.earnedDate && (
                <p className="text-[9px] font-bold text-amber-400 uppercase tracking-tighter">
                  Unlocked {format(parseISO(badge.earnedDate), 'MMM yyyy')}
                </p>
              )}
              
              {/* Tooltip */}
              <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 flex items-center justify-center p-4">
                 <div className="bg-slate-950 text-[10px] font-medium p-2 rounded-lg leading-tight shadow-2xl">
                    {badge.description}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="flex justify-between items-center p-8 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">New Savings Goal</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddGoal} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Goal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Dream Laptop"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Target Amount</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="50,000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 mt-4"
              >
                Launch Savings Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

