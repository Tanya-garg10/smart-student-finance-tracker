import React, { useState, useMemo } from 'react';
import { useFinance, Transaction } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Search, Download, Filter, Trash2, Pencil, FileText, Calendar } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToCSV, exportToJSON, saveFileAsync } from '../lib/reportUtils';

export default function Transactions() {
  const { transactions, categories, deleteTransaction, addNotification } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  const handleExportCSV = async () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = filteredTransactions.map(t => [
      t.date, t.description, t.category, t.type, t.amount
    ]);
    await exportToCSV(headers, rows, `StudentFin_Transactions_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportJSON = async () => {
    await exportToJSON(filteredTransactions, `StudentFin_Transactions_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('StudentFin Transaction Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 30);
    doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 35);

    const tableRows = filteredTransactions.map(t => [
      format(parseISO(t.date), 'MMM d, yyyy'),
      t.description,
      t.category,
      t.type.toUpperCase(),
      formatCurrency(t.amount)
    ]);

    autoTable(doc, {
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: tableRows,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { top: 45 }
    });

    const pdfBlob = doc.output('blob');
    await saveFileAsync(pdfBlob, `StudentFin_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`, 'application/pdf');

    addNotification({
      title: 'Export Successful',
      message: 'Your transaction report has been downloaded.',
      type: 'success'
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Transactions</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage and keep track of your money flow</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm"
            title="Export to CSV"
          >
            <Download size={16} /> CSV
          </button>
          <button 
            onClick={handleExportJSON}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm"
            title="Export to JSON"
          >
            <Download size={16} /> JSON
          </button>
          <button 
            onClick={exportToPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <FileText size={18} /> PDF Report
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by description or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-36 pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 appearance-none outline-none"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="relative flex-1 sm:flex-none">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-48 pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 appearance-none outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="pb-4 pl-6">Date</th>
                <th className="pb-4">Description</th>
                <th className="pb-4">Category</th>
                <th className="pb-4">Type</th>
                <th className="pb-4 text-right">Amount</th>
                <th className="pb-4 pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                    <td className="py-5 pl-6 text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {format(parseISO(t.date), 'MMM d, yyyy')}
                    </td>
                    <td className="py-5 text-sm font-black text-slate-900 dark:text-white">
                      {t.description}
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{backgroundColor: categories.find(c => c.name === t.category)?.color || '#94a3b8'}} />
                         <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.category}</span>
                      </div>
                    </td>
                    <td className="py-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                        t.type === 'income' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`py-5 text-sm font-black text-right ${
                      t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="py-5 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => setEditingTransaction(t)}
                          className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-300">
                        <Search size={40} />
                      </div>
                      <p className="text-slate-400 font-bold italic">No transactions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal 
        isOpen={!!editingTransaction} 
        onClose={() => setEditingTransaction(null)} 
        transactionToEdit={editingTransaction} 
      />
    </div>
  );
}
