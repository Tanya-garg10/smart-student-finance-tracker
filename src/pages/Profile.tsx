import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import ProPaymentModal from '../components/ProPaymentModal';
import { 
  User, Settings, Bell, Shield, LogOut, 
  Trash2, Save, CreditCard, Wallet, Download,
  FileText, Database, ChevronRight, Moon, Sun,
  Sparkles, CheckCircle2
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser, resetData, theme, toggleTheme, transactions, goals, categories, addNotification } = useFinance();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [monthlyBudget, setMonthlyBudget] = useState(user.monthlyBudget.toString());
  const [balance, setBalance] = useState(user.balance.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleExportArchive = () => {
    const archiveData = {
      profile: user,
      transactions,
      goals,
      categories,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StudentFin_Archive_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addNotification({
      title: 'Export Started',
      message: 'Your data archive is being prepared for download.',
      type: 'info'
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateUser({
      name,
      monthlyBudget: Number(monthlyBudget),
      balance: Number(balance),
    });
    setIsSaving(false);
  };

  const handleReset = () => {
    if (window.confirm('Are you SURE? This will permanently delete all your transactions, goals, and reset your balance. This cannot be undone.')) {
      resetData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-900 dark:from-indigo-600 dark:to-violet-700 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-[40px] bg-white p-1 shadow-2xl">
            <div className="w-full h-full bg-slate-100 rounded-[36px] flex items-center justify-center overflow-hidden">
               {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={60} className="text-slate-300" />
              )}
            </div>
          </div>
          <div className="text-center md:text-left text-white">
            <h2 className="text-4xl font-black tracking-tight">{currentUser?.displayName || user.name || 'Student'}</h2>
            <p className="text-indigo-200 font-bold mt-1 uppercase tracking-widest text-xs">{currentUser?.email}</p>
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
              {user.isPro ? (
                <span className="px-4 py-1.5 bg-indigo-500/30 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-400/50 text-indigo-100 flex items-center gap-2">
                  <Sparkles size={12} /> Pro Member
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Student Tier</span>
              )}
              <span className="px-4 py-1.5 bg-emerald-500/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 text-emerald-300">Verified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="space-y-3">
          {[
            { id: 'general', label: 'General Settings', icon: Settings },
            { id: 'billing', label: 'Subscription', icon: CreditCard },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              <ChevronRight size={16} className={activeTab === item.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
          
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-8">
          
          {activeTab === 'general' && (
            <>
              {/* Edit Profile Form */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                  <Settings className="text-indigo-600" /> Account Configuration
                </h3>
                
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Preferred Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Current Balance</label>
                      <div className="relative">
                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="number"
                          value={balance}
                          onChange={(e) => setBalance(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Monthly Spending Budget</label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="number"
                          value={monthlyBudget}
                          onChange={(e) => setMonthlyBudget(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Save size={20} /> {isSaving ? 'Saving Changes...' : 'Save Configuration'}
                  </button>
                </form>
              </div>

              {/* Data Management */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <Database className="text-indigo-600" /> Data Sovereignty
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={handleExportArchive}
                    className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 group cursor-pointer hover:border-indigo-500/50 transition-all"
                  >
                    <Download className="text-indigo-600 mb-4" />
                    <h4 className="font-black text-sm mb-1">Export Archive</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Download all your records in JSON format.</p>
                  </div>
                  <div 
                    onClick={handleReset}
                    className="p-6 rounded-[32px] bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 group cursor-pointer hover:border-rose-500 transition-all"
                  >
                    <Trash2 className="text-rose-600 mb-4" />
                    <h4 className="font-black text-sm mb-1 text-rose-600">Total Reset</h4>
                    <p className="text-xs text-rose-500/70 leading-relaxed font-medium">Wipe all data and start from scratch.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                <CreditCard className="text-indigo-600" /> Subscription Plan
              </h3>
              
              <div className="space-y-6">
                <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-black mb-1">{user.isPro ? 'Pro Plan' : 'Free Spark Plan'}</h4>
                      <p className="text-sm text-slate-500 font-bold">{user.isPro ? '$9.99/month (Active)' : '$0.00/month (Active)'}</p>
                    </div>
                    {user.isPro ? (
                      <CheckCircle2 className="text-emerald-500" size={32} />
                    ) : (
                      <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600">Current</span>
                    )}
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {[
                      { text: 'Manual transaction tracking', included: true },
                      { text: 'Budget alerts', included: true },
                      { text: 'AI Financial Insights', included: user.isPro },
                      { text: 'Custom PDF Reports', included: user.isPro },
                      { text: 'Early access to new features', included: user.isPro },
                    ].map((feature, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm font-bold ${feature.included ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>
                        <CheckCircle2 size={16} className={feature.included ? 'text-indigo-500' : 'text-slate-200 dark:text-slate-700'} />
                        <span className={!feature.included ? 'line-through opacity-50' : ''}>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  {!user.isPro && (
                    <button 
                      onClick={() => setIsProModalOpen(true)}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Sparkles size={20} /> Upgrade to Pro
                    </button>
                  )}
                </div>

                <div className="p-6 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    Billing handled via simulated sandbox<br />No real charges will be processed in this demo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700 text-center py-20">
              <Bell size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="font-black text-slate-400 uppercase tracking-widest">Notification settings coming soon</h3>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700 text-center py-20">
              <Shield size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="font-black text-slate-400 uppercase tracking-widest">Security controls coming soon</h3>
            </div>
          )}

          <div className="pt-4 flex justify-center">
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-slate-400 hover:text-rose-500 font-black uppercase tracking-widest text-xs transition-colors"
            >
              <LogOut size={16} /> Sign out from all devices
            </button>
          </div>
        </div>
      </div>
      
      <ProPaymentModal 
        isOpen={isProModalOpen} 
        onClose={() => setIsProModalOpen(false)} 
      />
    </div>
  );
}
