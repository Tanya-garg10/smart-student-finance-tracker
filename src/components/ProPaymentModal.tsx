import React, { useState } from 'react';
import { X, Check, CreditCard, Shield, Zap, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface ProPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProPaymentModal({ isOpen, onClose }: ProPaymentModalProps) {
  const { upgradeToPro } = useFinance();
  const [step, setStep] = useState<'plans' | 'payment' | 'success'>('plans');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    await upgradeToPro();
    setLoading(false);
    setStep('success');
  };

  const plans = [
    {
      name: 'Spark (Free)',
      price: '$0',
      description: 'Perfect for getting started with basic tracking.',
      features: ['Unlimited Transactions', 'Basic Analytics', 'Standard Support'],
      buttonText: 'Current Plan',
      isCurrent: true
    },
    {
      name: 'Pro Vision',
      price: '$9.99',
      period: '/month',
      description: 'Advanced insights and exclusive premium tools.',
      features: [
        'AI Financial Advisor (Turbo)',
        'Detailed PDF Reports',
        'Custom Categories',
        'Priority Support',
        'No Ads (Forever)'
      ],
      buttonText: 'Upgrade Now',
      highlight: true
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X size={20} className="text-slate-500" />
        </button>

        {step === 'plans' && (
          <div className="p-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
                <Sparkles size={24} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Upgrade to Pro</h2>
              <p className="text-slate-500 dark:text-slate-400">Unlock the full power of your financial potential.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
              {plans.map((plan) => (
                <div 
                  key={plan.name}
                  className={`relative p-6 rounded-3xl border-2 transition-all duration-300 ${
                    plan.highlight 
                      ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10 scale-105 shadow-xl' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                      Recommended
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <Check size={16} className="text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={plan.isCurrent}
                    onClick={() => setStep('payment')}
                    className={`w-full py-3 rounded-2xl font-bold transition-all ${
                      plan.highlight
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="p-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4">
                <Shield size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Confirm Upgrade</h2>
              <p className="text-slate-500 dark:text-slate-400">Sandbox Mode: No real payment required.</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-500 font-medium">Plan</span>
                <span className="font-bold text-slate-900 dark:text-white">Pro Vision Monthly</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <span className="text-slate-500 font-medium">Price</span>
                <span className="font-bold text-slate-900 dark:text-white">$9.99</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-900 dark:text-white font-black">Total Due Now</span>
                <span className="text-xl font-black text-indigo-600">$0.00</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={20} />
                    Activate Pro Now
                  </>
                )}
              </button>

              <button 
                onClick={() => setStep('plans')}
                className="w-full py-3 text-slate-500 text-sm font-bold hover:text-indigo-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6 scale-125">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">You're Pro!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
              Welcome to the elite club. All premium features have been unlocked for your account.
            </p>
            <button
              onClick={onClose}
              className="px-10 py-3.5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 dark:hover:shadow-none transition-all"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
