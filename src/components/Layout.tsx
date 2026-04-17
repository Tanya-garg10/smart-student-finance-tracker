import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useFinance, Notification } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Search, ChevronRight, Sparkles, AlertCircle, CheckCircle2, 
  Info as InfoIcon, AlertTriangle, LayoutDashboard, BarChart2, ReceiptText, 
  Target, User, Wallet, LogOut, Bell, Moon, Sun, MessageCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import ProPaymentModal from './ProPaymentModal';
import AICommandModal from './AICommandModal';
import AICoachDrawer from './AICoachDrawer';

export default function Layout() {
  const { theme, toggleTheme, transactions, user: financeUser, notifications, dismissNotification } = useFinance();
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/transactions', label: 'Transactions', icon: ReceiptText },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const budgetUsage = financeUser.monthlyBudget > 0 
    ? (transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0) / financeUser.monthlyBudget) * 100
    : 0;

  const hasAlert = budgetUsage > 80;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen z-20 transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Wallet size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 tracking-tighter">
              StudentFin
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-semibold group relative overflow-hidden",
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 active-nav-pill" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110", isActive && "animate-pulse-once")} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          {!financeUser.isPro ? (
            <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white relative overflow-hidden group shadow-xl">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all" />
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1 relative z-10">Pro Insights</p>
              <p className="text-sm font-medium mb-4 relative z-10 leading-relaxed">Upgrade to see detailed projection maps!</p>
              <button 
                onClick={() => setIsProModalOpen(true)}
                className="bg-white text-slate-900 w-full py-2.5 rounded-xl text-xs font-black shadow-lg relative z-10 hover:scale-105 transition-transform active:scale-95"
              >
                Unlock Pro
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-indigo-200" />
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Pro Member</p>
              </div>
              <p className="text-sm font-bold leading-tight">Advanced tools are unlocked!</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl w-64 border border-transparent focus-within:border-indigo-500/50 transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-full font-medium" 
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button 
              onClick={() => setIsAIModalOpen(true)}
              className="p-2.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 group relative overflow-hidden"
              title="AI Command Hub"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Sparkles size={20} className="relative z-10" />
            </button>
            <button 
              onClick={() => setIsAICoachOpen(true)}
              className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-800"
              title="AI Finance Coach"
            >
              <MessageCircle size={20} />
            </button>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2" />
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="relative">
              <button className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                <Bell size={20} />
              </button>
              {hasAlert && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
              )}
            </div>
            
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right hidden md:block">
                <div className="flex items-center justify-end gap-2">
                  <p className="text-sm font-black truncate max-w-[120px]">{currentUser?.displayName || financeUser.name || 'Student'}</p>
                  {financeUser.isPro && (
                    <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[8px] font-black rounded-md border border-indigo-200 dark:border-indigo-800 uppercase tracking-tighter">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Student Account</p>
              </div>
              <div className="group relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer">
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-indigo-500">
                        { (currentUser?.displayName || financeUser.name || 'S').charAt(0).toUpperCase() }
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2.5 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                title="Sign out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-6 sm:p-10 pb-32 lg:pb-10">
            <Outlet />
          </div>
        </main>

        {/* Mobile Nav Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-sm animate-in fade-in transition-all">
            <div className="absolute left-0 top-0 h-full w-4/5 max-w-sm bg-white dark:bg-slate-900 p-8 shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <Wallet size={24} className="text-indigo-600" />
                  <span className="text-xl font-black">StudentFin</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400">
                  <X size={24} />
                </button>
              </div>
              <nav className="space-y-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all",
                        isActive 
                          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                          : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Notifications Toast */}
        <div className="fixed bottom-6 right-6 z-[100] space-y-3 pointer-events-none">
          <AnimatePresence>
            {notifications.map((notif: Notification) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                className="pointer-events-auto flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl min-w-[300px] max-w-md group overflow-hidden relative"
              >
                {/* Progress bar effect */}
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className={cn(
                    "absolute bottom-0 left-0 h-1",
                    notif.type === 'success' ? 'bg-emerald-500' :
                    notif.type === 'warning' ? 'bg-amber-500' :
                    notif.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
                  )}
                />
                
                <div className={cn(
                  "p-2 rounded-2xl",
                  notif.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20' :
                  notif.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20' :
                  notif.type === 'error' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20' :
                  'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20'
                )}>
                  {notif.type === 'success' && <CheckCircle2 size={18} />}
                  {notif.type === 'warning' && <AlertTriangle size={18} />}
                  {notif.type === 'error' && <AlertCircle size={18} />}
                  {notif.type === 'info' && <InfoIcon size={18} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{notif.title}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">{notif.message}</p>
                </div>
                
                <button 
                  onClick={() => dismissNotification(notif.id)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Tab Bar */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 shadow-2xl rounded-3xl z-40 flex items-center justify-around px-4">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "p-3 rounded-2xl transition-all",
                  isActive ? "text-indigo-600 dark:text-indigo-400 scale-110" : "text-slate-400"
                )}
              >
                <Icon size={22} />
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Floating AI Action Button (Mobile) */}
      <button
        onClick={() => setIsAIModalOpen(true)}
        className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl z-50 flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
      >
        <Sparkles size={24} />
      </button>

      <ProPaymentModal 
        isOpen={isProModalOpen} 
        onClose={() => setIsProModalOpen(false)} 
      />
      
      <AICommandModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />

      <AICoachDrawer
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
      />
    </div>
  );
}
