import React, { useState, useEffect } from 'react';
import { X, Mic, Send, Sparkles, Loader2, Wand2, Info } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { parseAICommand } from '../lib/groq';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AICommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AICommandModal({ isOpen, onClose }: AICommandModalProps) {
  const { categories, addTransaction, addNotification } = useFinance();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const suggestions = [
    "Spent 500 on dinner yesterday",
    "Received 2000 as monthly allowance",
    "Paid 1200 for books",
    "Add 50 for chai",
  ];

  useEffect(() => {
    setSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      const result = await parseAICommand(input, categories);
      
      if (result && result.amount && result.description) {
        await addTransaction({
          amount: result.amount,
          description: result.description,
          category: result.category || 'Other',
          type: result.type || 'expense',
          date: result.date || new Date().toISOString().split('T')[0]
        });

        addNotification({
          title: 'AI Command Executed',
          message: `Added ${result.type === 'income' ? 'income' : 'expense'}: ₹${result.amount} for ${result.description}`,
          type: 'success'
        });
        
        setInput('');
        onClose();
      } else {
        throw new Error("Could not understand command");
      }
    } catch (error) {
      console.error(error);
      addNotification({
        title: 'AI Parsing Failed',
        message: 'Try being more specific, e.g., "Spent 200 on food today"',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      addNotification({
        title: 'Speech Not Supported',
        message: 'Your browser does not support voice recognition. Please type your command.',
        type: 'info'
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800 relative"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">AI Command Hub</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Natural Language Entry</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-2xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <div className={cn(
                "absolute -inset-1 rounded-[32px] blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-focus-within:duration-200 animate-tilt",
                isListening ? "bg-rose-500" : "bg-indigo-500"
              )}></div>
              <div className="relative flex items-center bg-white dark:bg-slate-950 rounded-[28px] border border-slate-200 dark:border-slate-800 p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <input
                  type="text"
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`e.g. "${suggestion}"`}
                  className="w-full bg-transparent border-none outline-none px-6 py-4 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                  disabled={isProcessing}
                />
                <div className="flex items-center gap-2 pr-2">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={cn(
                      "p-4 rounded-2xl transition-all flex items-center justify-center relative overflow-hidden",
                      isListening 
                        ? "bg-rose-500 text-white animate-pulse" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    )}
                  >
                    <Mic size={24} />
                    {isListening && (
                      <span className="absolute inset-0 bg-white/20 animate-ping rounded-full" />
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !input.trim()}
                    className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:grayscale"
                  >
                    {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full mb-1 flex items-center gap-2">
                <Wand2 size={12} /> Try these commands:
              </span>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(s)}
                  className="text-xs font-bold px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-3xl flex gap-3">
              <Info className="text-amber-600 flex-shrink-0" size={18} />
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
                AI will automatically detect the category, date, and amount. You can say things like "Spent" or "Received" to specify type.
              </p>
            </div>
          </form>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <Sparkles className="absolute inset-0 m-auto text-indigo-500 animate-pulse" size={24} />
            </div>
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 animate-pulse capitalize">
              Llama AI is parsing your request...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
