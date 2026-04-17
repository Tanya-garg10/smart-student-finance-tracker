import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { Wallet, ArrowRight, Sparkles } from 'lucide-react';

export default function Onboarding() {
  const { updateUser } = useFinance();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    monthlyBudget: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: formData.name,
      balance: Number(formData.balance) || 0,
      monthlyBudget: Number(formData.monthlyBudget) || 0,
      onboarded: true
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="bg-indigo-600 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm">
              <Wallet size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">StudentFin</h1>
            <p className="text-indigo-100">Smart finance tracking for students</p>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-300">
            <Sparkles size={20} className="text-indigo-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Let's get started</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                What should we call you?
              </label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g. Alex"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Balance (₹)
              </label>
              <input
                type="number"
                id="balance"
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g. 500.00"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your starting seed money.</p>
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Budget Goal (₹)
              </label>
              <input
                type="number"
                id="budget"
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g. 800.00"
                value={formData.monthlyBudget}
                onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How much do you aim to spend max per month?</p>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-8"
            >
              Save & Continue
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
