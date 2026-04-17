import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getAICoachResponse } from '../lib/groq';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Sparkles, MessageCircle, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AICoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_QUESTIONS = [
  "How much did I spend this week?",
  "Am I on track for my goals?",
  "Give me 3 tips to save money.",
  "What is my biggest expense?",
];

export default function AICoachDrawer({ isOpen, onClose }: AICoachDrawerProps) {
  const { transactions, user, categories, goals } = useFinance();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi ${user.name || 'there'}! I'm Finny, your AI Finance Coach. How can I help you with your budget today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));
      history.push({ role: 'user', content: text });

      const context = {
        transactions,
        categories,
        budget: user.monthlyBudget,
        userName: user.name,
        goals
      };

      const response = await getAICoachResponse(history as any, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I hit a snag. Let's try that again!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-950/20 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Bot size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black leading-tight">AI Finance Coach</h2>
                  <div className="flex items-center gap-1.5 opacity-80">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Finny is Online</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-3 animate-in slide-in-from-bottom-2",
                  m.role === 'user' ? 'flex-row-reverse' : ''
                )}>
                  <div className={cn(
                    "p-2.5 rounded-xl flex-shrink-0",
                    m.role === 'assistant' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  )}>
                    {m.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-[24px] max-w-[85%] text-sm font-medium leading-relaxed shadow-sm",
                    m.role === 'assistant' 
                      ? 'bg-indigo-50 dark:bg-indigo-900/10 text-slate-800 dark:text-slate-200 rounded-tl-none' 
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
                    <Bot size={18} />
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-3xl rounded-tl-none">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              {/* Quick Questions */}
              {messages.length < 5 && (
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="text-[10px] font-bold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 transition-all text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Finny anything..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border-none outline-none px-5 py-3 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-[9px] text-center font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Sparkles size={10} className="text-amber-500" />
                Powered by Llama 3.3
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
