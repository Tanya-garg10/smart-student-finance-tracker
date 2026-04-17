import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { generateId } from '../lib/utils';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  description: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface UserProfile {
  name: string;
  balance: number;
  monthlyBudget: number;
  onboarded: boolean;
  isPro: boolean;
  email?: string;
  theme?: 'light' | 'dark';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Food', type: 'expense', color: '#ef4444' },
  { id: '2', name: 'Rent', type: 'expense', color: '#f97316' },
  { id: '3', name: 'Books', type: 'expense', color: '#eab308' },
  { id: '4', name: 'Entertainment', type: 'expense', color: '#8b5cf6' },
  { id: '5', name: 'Transport', type: 'expense', color: '#06b6d4' },
  { id: '6', name: 'Shopping', type: 'expense', color: '#ec4899' },
  { id: '7', name: 'Health', type: 'expense', color: '#14b8a6' },
  { id: '8', name: 'Salary', type: 'income', color: '#22c55e' },
  { id: '9', name: 'Freelance', type: 'income', color: '#3b82f6' },
  { id: '10', name: 'Allowance', type: 'income', color: '#14b8a6' },
  { id: '11', name: 'Gift', type: 'income', color: '#a855f7' },
];

const defaultBadges: Badge[] = [
  { id: 'b1', name: 'First Steps', description: 'Complete your profile setup', icon: 'Trophy', earned: false },
  { id: 'b2', name: 'First Saver', description: 'Achieve a positive balance', icon: 'PiggyBank', earned: false },
  { id: 'b3', name: 'Goal Crusher', description: 'Complete a savings goal', icon: 'Target', earned: false },
  { id: 'b4', name: 'Budget Master', description: 'Stay under budget for a month', icon: 'Award', earned: false },
  { id: 'b5', name: 'Transaction Pro', description: 'Log 10 transactions', icon: 'ReceiptText', earned: false },
  { id: 'b6', name: 'Smart Saver', description: 'Have 3 active goals', icon: 'Sparkles', earned: false },
];

interface FinanceContextType {
  user: UserProfile;
  transactions: Transaction[];
  goals: Goal[];
  categories: Category[];
  badges: Badge[];
  theme: 'light' | 'dark';
  loading: boolean;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  editTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => Promise<void>;
  updateGoalProgress: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleTheme: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  resetData: () => Promise<void>;
  notifications: Notification[];
  dismissNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  // Advanced Features
  getHealthScore: () => number;
  getMonthlyPrediction: () => number;
  getRecurringExpenses: () => { description: string, amount: number, frequency: number }[];
  getDailySpendingMap: () => Record<string, number>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const [user, setUser] = useState<UserProfile>({
    name: currentUser?.displayName || '',
    balance: 0,
    monthlyBudget: 0,
    onboarded: false,
    isPro: false,
    email: currentUser?.email || '',
    theme: 'light',
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [badges, setBadges] = useState<Badge[]>(defaultBadges);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = generateId();
    const newNotif = { ...notif, id, timestamp: new Date().toISOString() };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      dismissNotification(id);
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Apply theme to DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen to Firestore user profile
  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const userRef = doc(db, 'users', uid);
    const unsub = onSnapshot(userRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUser(data);
        setTheme(data.theme || 'light');
      } else {
        // New user – create default profile
        const defaultProfile: UserProfile = {
          name: currentUser?.displayName || '',
          balance: 0,
          monthlyBudget: 0,
          onboarded: false,
          isPro: false,
          email: currentUser?.email || '',
          theme: 'light',
        };
        await setDoc(userRef, defaultProfile);
      }
    });
    return unsub;
  }, [uid]);

  // Apply theme class to document root for Tailwind dark mode
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen to transactions
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const txs: Transaction[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(txs);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  // Listen to goals
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(collection(db, 'users', uid, 'goals'), (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));
    });
    return unsub;
  }, [uid]);

  // Listen to categories
  useEffect(() => {
    if (!uid) return;
    const ref = collection(db, 'users', uid, 'categories');
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.empty) {
        // Seed default categories
        for (const cat of defaultCategories) {
          await setDoc(doc(db, 'users', uid, 'categories', cat.id), cat);
        }
      } else {
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      }
    });
    return unsub;
  }, [uid]);

  // Listen to badges
  useEffect(() => {
    if (!uid) return;
    const ref = collection(db, 'users', uid, 'badges');
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.empty) {
        for (const b of defaultBadges) {
          await setDoc(doc(db, 'users', uid, 'badges', b.id), b);
        }
      } else {
        setBadges(snap.docs.map(d => ({ id: d.id, ...d.data() } as Badge)));
      }
    });
    return unsub;
  }, [uid]);

  // Badge check logic
  useEffect(() => {
    if (!uid || !user.onboarded) return;
    const awardBadge = async (id: string) => {
      const ref = doc(db, 'users', uid, 'badges', id);
      const snap = await getDoc(ref);
      if (snap.exists() && !snap.data()?.earned) {
        await updateDoc(ref, { earned: true, earnedDate: new Date().toISOString() });
      }
    };
    awardBadge('b1');
    if (user.balance > 0) awardBadge('b2');
    if (goals.some(g => g.currentAmount >= g.targetAmount)) awardBadge('b3');
    if (transactions.length >= 10) awardBadge('b5');
    if (goals.length >= 3) awardBadge('b6');
  }, [uid, user.onboarded, user.balance, goals, transactions.length]);

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!uid) return;
    await setDoc(doc(db, 'users', uid), { ...user, ...updates }, { merge: true });
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!uid) return;
    await addDoc(collection(db, 'users', uid, 'transactions'), transaction);
    const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    await updateDoc(doc(db, 'users', uid), { balance: user.balance + balanceChange });
  };

  const editTransaction = async (id: string, updated: Omit<Transaction, 'id'>) => {
    if (!uid) return;
    const old = transactions.find(t => t.id === id);
    if (!old) return;
    let delta = old.type === 'income' ? -old.amount : old.amount;
    delta += updated.type === 'income' ? updated.amount : -updated.amount;
    await updateDoc(doc(db, 'users', uid, 'transactions', id), { ...updated });
    await updateDoc(doc(db, 'users', uid), { balance: user.balance + delta });
  };

  const deleteTransaction = async (id: string) => {
    if (!uid) return;
    const t = transactions.find(t => t.id === id);
    if (!t) return;
    const delta = t.type === 'income' ? -t.amount : t.amount;
    await deleteDoc(doc(db, 'users', uid, 'transactions', id));
    await updateDoc(doc(db, 'users', uid), { balance: user.balance + delta });
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'currentAmount'>) => {
    if (!uid) return;
    await addDoc(collection(db, 'users', uid, 'goals'), { ...goal, currentAmount: 0 });
  };

  const updateGoalProgress = async (id: string, amount: number) => {
    if (!uid) return;
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    await updateDoc(doc(db, 'users', uid, 'goals', id), { currentAmount: goal.currentAmount + amount });
  };

  const deleteGoal = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'goals', id));
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (!uid) return;
    await addDoc(collection(db, 'users', uid, 'categories'), category);
  };

  const deleteCategory = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'categories', id));
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (uid) await updateDoc(doc(db, 'users', uid), { theme: newTheme });
  };

  const upgradeToPro = async () => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid), { isPro: true });
    setUser(prev => ({ ...prev, isPro: true }));
    addNotification({
      title: 'Premium Activated!',
      message: 'Welcome to StudentFin Pro. Enjoy your exclusive features!',
      type: 'success'
    });
  };

  const resetData = async () => {
    if (!uid) return;
    // Note: Deleting collections in Firestore client-side usually involves deleting each document
    const txDocs = transactions.map(t => deleteDoc(doc(db, 'users', uid, 'transactions', t.id)));
    const goalDocs = goals.map(g => deleteDoc(doc(db, 'users', uid, 'goals', g.id)));
    await Promise.all([...txDocs, ...goalDocs]);
    await updateDoc(doc(db, 'users', uid), { balance: 0 });
    addNotification({
      title: 'Data Reset',
      message: 'All your financial data has been cleared.',
      type: 'info'
    });
  };

  const getHealthScore = () => {
    const now = new Date();
    const currentMonth = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const income = currentMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = currentMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    let score = 0;

    // 1. Savings Rate (40 points)
    if (income > 0) {
      const savingsRate = (income - expense) / income;
      score += Math.max(0, savingsRate * 40);
    } else if (expense === 0) {
      score += 20; // Default safety
    }

    // 2. Budget Adherence (40 points)
    if (user.monthlyBudget > 0) {
      const budgetUsage = expense / user.monthlyBudget;
      if (budgetUsage <= 1) score += 40;
      else if (budgetUsage <= 1.2) score += 20;
    } else {
      score += 20;
    }

    // 3. Category Variety (20 points)
    const usedCategories = new Set(currentMonth.map(t => t.category)).size;
    score += Math.min(20, usedCategories * 4);

    return Math.round(score);
  };

  const getMonthlyPrediction = () => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    
    const expense = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    if (dayOfMonth === 0) return expense;
    return Math.round((expense / dayOfMonth) * daysInMonth);
  };

  const getRecurringExpenses = () => {
    const groups: Record<string, { amounts: Set<number>, dates: string[] }> = {};
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const key = t.description.toLowerCase().trim();
      if (!groups[key]) groups[key] = { amounts: new Set(), dates: [] };
      groups[key].amounts.add(t.amount);
      groups[key].dates.push(t.date);
    });

    return Object.entries(groups)
      .filter(([_, data]) => data.dates.length >= 2)
      .map(([desc, data]) => ({
        description: desc,
        amount: Array.from(data.amounts)[0], // Simplified: take first seen amount
        frequency: data.dates.length
      }));
  };

  const getDailySpendingMap = () => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const date = t.date.split('T')[0];
        map[date] = (map[date] || 0) + t.amount;
      });
    return map;
  };

  return (
    <FinanceContext.Provider value={{
      user, transactions, goals, categories, badges, theme, loading,
      updateUser, addTransaction, editTransaction, deleteTransaction,
      addGoal, updateGoalProgress, deleteGoal,
      addCategory, deleteCategory, toggleTheme, upgradeToPro, resetData,
      notifications, addNotification, dismissNotification,
      getHealthScore, getMonthlyPrediction, getRecurringExpenses, getDailySpendingMap
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
};
