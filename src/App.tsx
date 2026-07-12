import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  DollarSign,
  Wallet,
  TrendingUp,
  Calendar,
  AlertTriangle,
  FileText,
  Settings,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Award,
  Bell,
  Sun,
  Moon,
  CheckCircle2,
  X,
  Filter,
  Search,
  RotateCcw,
  Share2,
  Sliders,
  ChevronRight,
  Calculator,
  User,
  MapPin,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import confetti from 'canvas-confetti';
// API endpoint base configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

import type {
  Loan,
  Payment,
  Account,
  Expense,
  Budget,
  Investment,
  Asset,
  Income,
  Alert,
  LoanType,
  InterestType,
  Priority
} from './types/finance';
import {
  generateAmortizationSchedule,
  calculatePaymentSplit,
  generatePayoffRecommendations,
  generateSystemAlerts,
  calculatePrepaymentBenefit
} from './utils/mathEngine';

// Seed Initial Data for a Premium Out-of-the-Box Experience
const INITIAL_ACCOUNTS: Account[] = [];
const INITIAL_LOANS: Loan[] = [];
const INITIAL_PAYMENTS: Payment[] = [];
const INITIAL_EXPENSES: Expense[] = [];
const INITIAL_INCOMES: Income[] = [];
const INITIAL_BUDGETS: Budget[] = [];
const INITIAL_ASSETS: Asset[] = [];
const INITIAL_INVESTMENTS: Investment[] = [];

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Auth state
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; token: string } | null>(() => {
    const saved = localStorage.getItem('finance_os_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const endpoint = authMode === 'LOGIN' ? 'login' : 'register';
      const response = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authForm.email,
          passwordHash: authForm.password,
          name: authForm.name
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Authentication failed');
      }

      const data = await response.json();
      localStorage.setItem('finance_os_user', JSON.stringify(data));
      setCurrentUser(data.user ? { ...data.user, token: data.token } : data);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      setAuthError(err.message || 'Unable to connect to NestJS. (You can click "Explore with Demo Account" to run frontend-only)');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser = { name: 'Demo Sathish', email: 'sathish@financeos.com', token: 'demo-token-123' };
    localStorage.setItem('finance_os_user', JSON.stringify(demoUser));
    setCurrentUser(demoUser);
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
  };

  const handleLogout = () => {
    localStorage.removeItem('finance_os_user');
    setCurrentUser(null);
  };

  // Database states
  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('finance_os_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('finance_os_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('finance_os_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });
  const [incomes, setIncomes] = useState<Income[]>(() => {
    const saved = localStorage.getItem('finance_os_incomes');
    return saved ? JSON.parse(saved) : INITIAL_INCOMES;
  });
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('finance_os_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('finance_os_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });
  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem('finance_os_investments');
    return saved ? JSON.parse(saved) : INITIAL_INVESTMENTS;
  });
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('finance_os_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Currency config
  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem('currency') || 'INR';
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'INR' ? '₹' : '$';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return `${symbol}${Number(amount).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Dialog State
  const [selectedLoanForSchedule, setSelectedLoanForSchedule] = useState<Loan | null>(null);
  const [showAddLoanModal, setShowAddLoanModal] = useState<boolean>(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState<boolean>(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState<boolean>(false);
  const [showAddInvestmentModal, setShowAddInvestmentModal] = useState<boolean>(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState<boolean>(false);
  const [simulatedPrepayment, setSimulatedPrepayment] = useState<number>(0);

  // Investment & Asset Form State
  const [newInvestment, setNewInvestment] = useState<Partial<Investment>>({
    name: '',
    type: 'MUTUAL_FUND',
    investedValue: 0,
    currentValue: 0
  });

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '',
    type: 'HOUSE',
    value: 0
  });
  
  // Loan Form State
  const [newLoan, setNewLoan] = useState<Partial<Loan>>({
    name: '',
    type: 'PERSONAL_LOAN',
    lenderName: '',
    loanNumber: '',
    originalAmount: 100000,
    currentOutstanding: 100000,
    interestRate: 10,
    interestType: 'FIXED',
    tenureMonths: 12,
    emi: 8791.00,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    processingFee: 0,
    insurance: 0,
    lateFee: 0,
    prepaymentCharges: 0,
    priority: 'MEDIUM',
    status: 'ACTIVE'
  });

  // Payment Form State
  const [newPayment, setNewPayment] = useState<Partial<Payment> & {
    // Advanced fields
    isManualOverride: boolean;
    emiOverride?: number;
    interestRateOverride?: number;
    tenureOverride?: number;
    startDateOverride?: string;
    endDateOverride?: string;
    processingFeeOverride?: number;
    penaltyChargesOverride?: number;
    lateFeeOverride?: number;
    prepaymentAmountOverride?: number;
    prepaymentDateOverride?: string;
  }>({
    loanId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paidAmount: 0,
    referenceNumber: '',
    notes: '',
    accountId: '',
    isManualOverride: false,
    principalPaid: 0,
    interestPaid: 0,
    remainingBalance: 0
  });

  // Expense Form State
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    amount: 0,
    paymentMethod: 'CASH',
    notes: '',
    recurring: 'NONE'
  });

  // Income Form State
  const [newIncome, setNewIncome] = useState<Partial<Income>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Salary',
    amount: 0,
    notes: ''
  });

  // Apply CSS theme triggers
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Sync data dynamically from backend (MongoDB)
  useEffect(() => {
    if (!currentUser || currentUser.token.startsWith('demo-')) return;

    const fetchAllData = async () => {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.token
      };

      try {
        const [resAcc, resLoans, resPay, resExp, resBudg] = await Promise.all([
          fetch(`${API_BASE}/finance/accounts`, { headers }),
          fetch(`${API_BASE}/finance/loans`, { headers }),
          fetch(`${API_BASE}/finance/payments`, { headers }),
          fetch(`${API_BASE}/finance/expenses`, { headers }),
          fetch(`${API_BASE}/finance/budgets`, { headers })
        ]);

        if (resAcc.ok) setAccounts(await resAcc.json());
        if (resLoans.ok) setLoans(await resLoans.json());
        if (resPay.ok) setPayments(await resPay.json());
        if (resExp.ok) setExpenses(await resExp.json());
        if (resBudg.ok) setBudgets(await resBudg.json());
      } catch (err) {
        console.error("Failed to sync dynamically from MongoDB backend:", err);
      }
    };

    fetchAllData();
  }, [currentUser]);

  // LocalStorage Persistence observers for Demo Mode / Local fallback
  useEffect(() => {
    localStorage.setItem('finance_os_loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('finance_os_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('finance_os_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('finance_os_incomes', JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem('finance_os_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('finance_os_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('finance_os_investments', JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem('finance_os_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Recalculator: Ensure loan currentOutstandings reflect all standard payments applied to them
  const recalculateSystemMetrics = () => {
    // Re-evaluate currentOutstanding for each active loan based on payments made
    const updatedLoans = loans.map(loan => {
      const loanPayments = payments.filter(p => p.loanId === loan.id);
      if (loanPayments.length === 0) {
        return { ...loan, currentOutstanding: loan.originalAmount };
      }
      
      // Sort payments by date to get final balance
      const sorted = [...loanPayments].sort(
        (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
      );
      const lastPayment = sorted[sorted.length - 1];
      
      // Check if closing
      const finalOutstanding = lastPayment.remainingBalance;
      const status = finalOutstanding <= 0.05 ? 'CLOSED' : loan.status;

      return {
        ...loan,
        currentOutstanding: finalOutstanding,
        status: status as any
      };
    });

    // Check if loans changed to trigger update
    const diff = JSON.stringify(updatedLoans) !== JSON.stringify(loans);
    if (diff) {
      setLoans(updatedLoans);
    }
  };

  useEffect(() => {
    recalculateSystemMetrics();
  }, [payments]);

  // Handle Add Loan Form submission
  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.name || !newLoan.lenderName || !newLoan.originalAmount) return;

    // Calculate end date based on tenure
    const start = new Date(newLoan.startDate || '');
    start.setMonth(start.getMonth() + Number(newLoan.tenureMonths || 12));
    const calculatedEndDate = start.toISOString().split('T')[0];

    const loanToAdd: Loan = {
      id: `loan-${Date.now()}`,
      name: newLoan.name,
      type: newLoan.type as LoanType,
      lenderName: newLoan.lenderName,
      loanNumber: newLoan.loanNumber,
      originalAmount: Number(newLoan.originalAmount),
      currentOutstanding: Number(newLoan.originalAmount),
      interestRate: Number(newLoan.interestRate || 10),
      interestType: (newLoan.interestType || 'FIXED') as InterestType,
      tenureMonths: Number(newLoan.tenureMonths || 12),
      emi: Number(newLoan.emi || 0),
      startDate: newLoan.startDate || new Date().toISOString().split('T')[0],
      endDate: calculatedEndDate,
      processingFee: Number(newLoan.processingFee || 0),
      insurance: Number(newLoan.insurance || 0),
      lateFee: Number(newLoan.lateFee || 0),
      prepaymentCharges: Number(newLoan.prepaymentCharges || 0),
      priority: (newLoan.priority || 'MEDIUM') as Priority,
      status: 'ACTIVE',
      // Gold parameters if selected
      goldRenewalDate: newLoan.type === 'GOLD_LOAN' ? new Date(start.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      goldPenaltyRate: newLoan.type === 'GOLD_LOAN' ? 2 : undefined,
      creditLimit: newLoan.type === 'CREDIT_CARD' ? Number(newLoan.originalAmount) : undefined,
      minDue: newLoan.type === 'CREDIT_CARD' ? Number(newLoan.emi) : undefined
    };

    if (currentUser && !currentUser.token.startsWith('demo-')) {
      fetch(`${API_BASE}/finance/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.token
        },
        body: JSON.stringify(loanToAdd),
      })
      .then(res => res.json())
      .then(savedLoan => {
        setLoans([...loans, savedLoan]);
      })
      .catch(err => console.error(err));
    } else {
      setLoans([...loans, loanToAdd]);
    }
    setShowAddLoanModal(false);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
  };

  // Handle Add Payment Submission
  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.loanId || !newPayment.paidAmount) return;

    const targetLoan = loans.find(l => l.id === newPayment.loanId);
    if (!targetLoan) return;

    const targetLoanPayments = payments.filter(p => p.loanId === targetLoan.id);

    let paymentToAdd: Payment;

    if (newPayment.isManualOverride) {
      // Manual override handles all inputs literally from statements
      paymentToAdd = {
        id: `pay-${Date.now()}`,
        loanId: newPayment.loanId,
        paymentDate: newPayment.paymentDate || new Date().toISOString().split('T')[0],
        paidAmount: Number(newPayment.paidAmount),
        referenceNumber: newPayment.referenceNumber,
        notes: newPayment.notes,
        accountId: newPayment.accountId,
        principalPaid: Number(newPayment.principalPaid || 0),
        interestPaid: Number(newPayment.interestPaid || 0),
        remainingBalance: Number(newPayment.remainingBalance || 0),
        isManualOverride: true
      };

      // Also dynamically modify parameters of the loan if overrides are inputted
      if (newPayment.interestRateOverride || newPayment.tenureOverride || newPayment.emiOverride) {
        setLoans(loans.map(l => {
          if (l.id === targetLoan.id) {
            return {
              ...l,
              interestRate: newPayment.interestRateOverride ? Number(newPayment.interestRateOverride) : l.interestRate,
              tenureMonths: newPayment.tenureOverride ? Number(newPayment.tenureOverride) : l.tenureMonths,
              emi: newPayment.emiOverride ? Number(newPayment.emiOverride) : l.emi,
              processingFee: newPayment.processingFeeOverride ? Number(newPayment.processingFeeOverride) : l.processingFee,
              lateFee: newPayment.lateFeeOverride ? Number(newPayment.lateFeeOverride) : l.lateFee
            };
          }
          return l;
        }));
      }
    } else {
      // Default: Math split engine determines principal & interest automatically
      const splits = calculatePaymentSplit(targetLoan, Number(newPayment.paidAmount), newPayment.paymentDate!, targetLoanPayments);
      
      paymentToAdd = {
        id: `pay-${Date.now()}`,
        loanId: newPayment.loanId,
        paymentDate: newPayment.paymentDate || new Date().toISOString().split('T')[0],
        paidAmount: Number(newPayment.paidAmount),
        referenceNumber: newPayment.referenceNumber,
        notes: newPayment.notes,
        accountId: newPayment.accountId,
        principalPaid: splits.principalPaid,
        interestPaid: splits.interestPaid,
        remainingBalance: splits.remainingBalance,
        interestSaved: splits.interestSaved,
        monthsSaved: splits.monthsSaved,
        isManualOverride: false
      };
    }

    // Debit the corresponding bank/cash account
    if (newPayment.accountId) {
      setAccounts(accounts.map(acc => {
        if (acc.id === newPayment.accountId) {
          return { ...acc, balance: acc.balance - Number(newPayment.paidAmount) };
        }
        return acc;
      }));
    }

    if (currentUser && !currentUser.token.startsWith('demo-')) {
      fetch(`${API_BASE}/finance/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.token
        },
        body: JSON.stringify(paymentToAdd),
      })
      .then(res => res.json())
      .then(savedPayment => {
        setPayments([...payments, savedPayment]);
      })
      .catch(err => console.error(err));
    } else {
      setPayments([...payments, paymentToAdd]);
    }
    setShowAddPaymentModal(false);
    
    // Play sound/animation if loan becomes closed
    if (paymentToAdd.remainingBalance <= 0) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    }
  };

  // Handle Add Expense Submission
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.category) return;

    const expenseToAdd: Expense = {
      id: `exp-${Date.now()}`,
      date: newExpense.date || new Date().toISOString().split('T')[0],
      category: newExpense.category,
      subCategory: newExpense.subCategory || 'General',
      amount: Number(newExpense.amount),
      paymentMethod: newExpense.paymentMethod as any,
      notes: newExpense.notes,
      recurring: (newExpense.recurring || 'NONE') as any,
      accountId: newExpense.accountId
    };

    // Auto debit account
    if (newExpense.accountId) {
      setAccounts(accounts.map(acc => {
        if (acc.id === newExpense.accountId) {
          return { ...acc, balance: acc.balance - Number(newExpense.amount) };
        }
        return acc;
      }));
    }

    if (currentUser && !currentUser.token.startsWith('demo-')) {
      fetch(`${API_BASE}/finance/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.token
        },
        body: JSON.stringify(expenseToAdd),
      })
      .then(res => res.json())
      .then(savedExpense => {
        setExpenses([...expenses, savedExpense]);
      })
      .catch(err => console.error(err));
    } else {
      setExpenses([...expenses, expenseToAdd]);
    }
    setShowAddExpenseModal(false);
  };

  // Handle Add Income Submission
  const handleCreateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncome.amount || !newIncome.category) return;

    const incomeToAdd: Income = {
      id: `inc-${Date.now()}`,
      date: newIncome.date || new Date().toISOString().split('T')[0],
      category: newIncome.category as any,
      amount: Number(newIncome.amount),
      notes: newIncome.notes,
      accountId: newIncome.accountId
    };

    // Auto credit account
    if (newIncome.accountId) {
      setAccounts(accounts.map(acc => {
        if (acc.id === newIncome.accountId) {
          return { ...acc, balance: acc.balance + Number(newIncome.amount) };
        }
        return acc;
      }));
    }

    setIncomes([...incomes, incomeToAdd]);
    setShowAddIncomeModal(false);
  };

  // Handle Add Investment Submission
  const handleCreateInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestment.name || !newInvestment.investedValue || !newInvestment.currentValue) return;

    const investmentToAdd: Investment = {
      id: `inv-${Date.now()}`,
      name: newInvestment.name,
      type: newInvestment.type as any,
      investedValue: Number(newInvestment.investedValue),
      currentValue: Number(newInvestment.currentValue)
    };

    setInvestments([...investments, investmentToAdd]);
    setShowAddInvestmentModal(false);
    setNewInvestment({ name: '', type: 'MUTUAL_FUND', investedValue: 0, currentValue: 0 });
  };

  // Handle Add Asset Submission
  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.value) return;

    const assetToAdd: Asset = {
      id: `ast-${Date.now()}`,
      name: newAsset.name,
      type: newAsset.type as any,
      value: Number(newAsset.value)
    };

    setAssets([...assets, assetToAdd]);
    setShowAddAssetModal(false);
    setNewAsset({ name: '', type: 'HOUSE', value: 0 });
  };

  // Calculations for dashboard
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const totalDebtOriginal = loans.reduce((sum, l) => sum + Number(l.originalAmount), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + Number(l.currentOutstanding), 0);
  
  const totalInterestPaid = payments.reduce((sum, p) => sum + Number(p.interestPaid), 0);
  const totalPrincipalPaid = payments.reduce((sum, p) => sum + Number(p.principalPaid), 0);
  
  const totalMonthlyEMI = activeLoans.reduce((sum, l) => sum + Number(l.emi), 0);

  const totalAssetsValue = assets.reduce((sum, a) => sum + Number(a.value), 0);
  const totalInvestmentsValue = investments.reduce((sum, i) => sum + Number(i.currentValue), 0);
  const totalBankBalance = accounts.filter(a => a.type !== 'CREDIT_CARD').reduce((sum, a) => sum + a.balance, 0);

  const netWorth = (totalAssetsValue + totalInvestmentsValue + totalBankBalance) - totalOutstanding;
  const debtFreeProgress = totalDebtOriginal > 0 ? ((totalDebtOriginal - totalOutstanding) / totalDebtOriginal) * 100 : 100;

  // Monthly income vs monthly expenses
  const curMonth = new Date().getMonth();
  const curYear = new Date().getFullYear();
  
  const monthlyIncome = incomes.filter(inc => {
    const d = new Date(inc.date);
    return d.getMonth() === curMonth && d.getFullYear() === curYear;
  }).reduce((sum, inc) => sum + inc.amount, 0);

  const monthlyExpense = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getMonth() === curMonth && d.getFullYear() === curYear;
  }).reduce((sum, exp) => sum + exp.amount, 0) + totalMonthlyEMI;

  const monthlySavings = monthlyIncome - monthlyExpense;

  // Dynamic recommendations & Alerts
  const advisor = generatePayoffRecommendations(loans, 15000);
  const systemAlerts = generateSystemAlerts(loans, expenses, budgets, assets, incomes, totalBankBalance * 0.3);

  // Chart data: Debt breakdown
  const debtBreakdownData = loans.filter(l => l.currentOutstanding > 0).map(l => ({
    name: l.name,
    value: Number(l.currentOutstanding)
  }));

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981', '#06b6d4', '#eab308'];

  // Chart data: Monthly trends
  const trendData = [
    { name: 'Feb', Income: 140000, Expense: 95000, NetWorth: 4100000 },
    { name: 'Mar', Income: 155000, Expense: 102000, NetWorth: 4300000 },
    { name: 'Apr', Income: 160000, Expense: 89000, NetWorth: 4550000 },
    { name: 'May', Income: 180000, Expense: 110000, NetWorth: 4800000 },
    { name: 'Jun', Income: 200000, Expense: 125000, NetWorth: 5100000 },
    { name: 'Jul', Income: monthlyIncome, Expense: monthlyExpense, NetWorth: netWorth }
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-200/50 dark:border-slate-800/80 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto">
              <TrendingUp className="text-white h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Finance<span className="text-blue-600 dark:text-blue-400 font-medium">OS</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">Your Personal Finance OS</p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border-l-2 border-rose-500 text-xs text-rose-500">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
            {authMode === 'REGISTER' && (
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sathish Kumar"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="sathish@example.com"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/20"
            >
              {authLoading ? 'Authenticating...' : authMode === 'LOGIN' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center justify-between text-xs pt-2">
            <button
              onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
              className="text-blue-500 hover:underline cursor-pointer"
            >
              {authMode === 'LOGIN' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase">Or</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <button
            onClick={handleDemoLogin}
            className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Explore with Demo Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp className="text-white h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              Finance<span className="text-blue-600 dark:text-blue-400 font-medium">OS</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">Financial Freedom Engine</p>
          </div>
        </div>

        {/* Global Stats bar */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-400 dark:text-slate-500 block">Total Net Worth</span>
            <span className="text-sm font-bold text-gradient-emerald font-sans">
              {formatCurrency(netWorth)}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="text-right">
            <span className="text-xs text-slate-400 dark:text-slate-500 block">Current Outstanding</span>
            <span className="text-sm font-bold text-gradient-rose font-sans">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* System Alerts Badge */}
          <div className="relative group cursor-pointer">
            <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-center transition-all duration-200">
              <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              {systemAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </div>
            
            {/* Popover */}
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-4 border border-slate-200/60 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">System Alerts ({systemAlerts.length})</h4>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {systemAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">All financial metrics clear! No alerts.</p>
                ) : (
                  systemAlerts.map(alert => (
                    <div key={alert.id} className="p-2 rounded bg-rose-500/10 dark:bg-rose-500/5 border-l-2 border-rose-500 text-xs">
                      <p className="font-bold text-slate-800 dark:text-rose-200">{alert.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">
        
        {/* SIDE NAV */}
        <aside className="w-full lg:w-64 bg-white/70 dark:bg-[#0e1017] p-6 border-r border-slate-200/40 dark:border-slate-900/60 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-3">Main Panel</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('loans')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'loans'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Loan Master
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'payments'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Calculator className="h-4 w-4" />
                  Monthly Payments
                </button>
              </nav>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-3">Trackers</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'expenses'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  Expenses & Budgets
                </button>
                <button
                  onClick={() => setActiveTab('investments')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'investments'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Investments & Assets
                </button>
              </nav>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-3">Analytics</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'reports'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Detailed Reports
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'calendar'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Due Calendar
                </button>
              </nav>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-3">System</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Admin Console
                </button>
              </nav>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-900/60 text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Logged in as</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{currentUser?.name || 'Sathish Kumar'}</span>
            <button
              onClick={handleLogout}
              className="text-[10px] text-rose-500 hover:text-rose-400 font-bold transition block mx-auto cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* WORKSPACE VIEWPORT */}
        <main className="flex-1 p-6 lg:p-8 overflow-x-hidden space-y-6">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* TOP HERO BANNER */}
              <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-blue-600 relative overflow-hidden">
                <div className="space-y-2 relative z-10">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    AI Wealth Insight
                  </span>
                  <h2 className="text-xl font-bold tracking-tight">Your path to zero debt is accelerated.</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                    {advisor.reason}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 relative z-10 shrink-0">
                  <div className="text-center p-3 px-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Debt Free Progress</span>
                    <span className="text-lg font-extrabold text-gradient-emerald">{debtFreeProgress.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* CARD GRID METRICS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Net Worth */}
                <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">Net Worth</span>
                      <h3 className="text-xl font-extrabold font-sans mt-2 text-gradient-emerald">
                        {formatCurrency(netWorth)}
                      </h3>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="font-bold text-emerald-500 flex items-center">
                      <ArrowUpRight className="h-3 w-3" /> {netWorth > 0 ? '+0.0%' : '0.0%'}
                    </span> vs last month
                  </div>
                </div>

                {/* Outstanding Debt */}
                <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">Outstanding Debt</span>
                      <h3 className="text-xl font-extrabold font-sans mt-2 text-gradient-rose">
                        {formatCurrency(totalOutstanding)}
                      </h3>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="font-bold text-rose-500 flex items-center">
                      <ArrowDownRight className="h-3 w-3" /> {totalDebtOriginal > 0 ? ((totalDebtOriginal - totalOutstanding) / totalDebtOriginal * 100).toFixed(1) : '0.0'}%
                    </span> paid down
                  </div>
                </div>

                {/* Income */}
                <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">Monthly Income</span>
                      <h3 className="text-xl font-extrabold font-sans mt-2 text-slate-900 dark:text-white">
                        {formatCurrency(monthlyIncome)}
                      </h3>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="font-bold text-blue-500">{incomes.length} active sources</span> this month
                  </div>
                </div>

                {/* Expenses */}
                <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">Monthly Expenses</span>
                      <h3 className="text-xl font-extrabold font-sans mt-2 text-slate-900 dark:text-white">
                        {formatCurrency(monthlyExpense)}
                      </h3>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="font-bold text-purple-500">{monthlyIncome > 0 ? ((monthlyExpense / monthlyIncome) * 100).toFixed(0) : '0'}%</span> debt & expense ratio
                  </div>
                </div>

              </div>

              {/* DYNAMIC CHARTS ZONE */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Trend Chart */}
                <div className="glass-card rounded-2xl p-5 lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold">Income vs. Expense Trend</h3>
                      <p className="text-[10px] text-slate-400">Rolling 6-month budget analysis</p>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                        <YAxis stroke="#6b7280" fontSize={11} />
                        <Tooltip />
                        <Area type="monotone" dataKey="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Expense" stroke="#a855f7" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Debt Breakdown Pie */}
                <div className="glass-card rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold">Debt Breakdown</h3>
                    <p className="text-[10px] text-slate-400">Allocation of active liabilities</p>
                  </div>
                  <div className="h-56 w-full flex items-center justify-center">
                    {debtBreakdownData.length === 0 ? (
                      <span className="text-xs text-slate-400">No active debts! 🎉</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={debtBreakdownData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {debtBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {loans.filter(l => l.currentOutstanding > 0).map((l, index) => (
                      <div key={l.id} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          {l.name}
                        </span>
                        <span className="font-semibold">${Number(l.currentOutstanding).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* QUICK ACCOUNTS AND LOANS LISTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Accounts balance board */}
                <div className="glass-card rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold">Bank & Cash Accounts</h3>
                    <button
                      onClick={() => setActiveTab('admin')}
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      Manage
                    </button>
                  </div>
                  <div className="space-y-3">
                    {accounts.map(acc => (
                      <div key={acc.id} className="p-3 rounded-xl bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-900/40 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-300 block">{acc.name}</span>
                          <span className="text-[10px] text-slate-400 capitalize">{(acc.type || '').toLowerCase()}</span>
                        </div>
                        <span className={`text-xs font-bold ${acc.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatCurrency(acc.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming EMI / Loan payments list */}
                <div className="glass-card rounded-2xl p-5 lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold">Upcoming EMI Due Dates</h3>
                      <p className="text-[10px] text-slate-400">Auto-generated loan schedule calendar feeds</p>
                    </div>
                    <button
                      onClick={() => setShowAddPaymentModal(true)}
                      className="glow-btn bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Pay EMI
                    </button>
                  </div>
                  <div className="space-y-3">
                    {loans.filter(l => l.status === 'ACTIVE').map(l => {
                      const nextPayDate = new Date();
                      nextPayDate.setDate(15); // standard due date mock
                      return (
                        <div key={l.id} className="p-3 rounded-xl bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-wide uppercase shrink-0">
                              {l.type.replace('_', ' ')}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold">{l.name}</h4>
                              <p className="text-[10px] text-slate-400">{l.lenderName} • Rate: {l.interestRate}%</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-6">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">EMI Amount</span>
                              <span className="text-xs font-bold">${Number(l.emi).toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-medium">Due Date</span>
                              <span className="text-xs font-semibold text-rose-500">{nextPayDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: LOAN MASTER */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Loan Master Directory</h2>
                  <p className="text-xs text-slate-400">Add original loan details once. Zen Debt calculates the outstanding and payoff automatically.</p>
                </div>
                <button
                  onClick={() => setShowAddLoanModal(true)}
                  className="glow-btn bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" /> Add New Loan
                </button>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by loan name, lender, account number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Loan Types</option>
                    <option value="HOME_LOAN">Home Loan</option>
                    <option value="GOLD_LOAN">Gold Loan</option>
                    <option value="PERSONAL_LOAN">Personal Loan</option>
                    <option value="CREDIT_CARD">Credit Cards</option>
                  </select>
                </div>
              </div>

              {/* LOAN CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loans
                  .filter(l => {
                    const matchesSearch = (l.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (l.lenderName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
                    const matchesFilter = filterType === 'ALL' || l.type === filterType;
                    return matchesSearch && matchesFilter;
                  })
                  .map(loan => {
                    const paydownPercent = ((Number(loan.originalAmount) - Number(loan.currentOutstanding)) / Number(loan.originalAmount)) * 100;
                    
                    return (
                      <div key={loan.id} className="glass-card rounded-2xl p-5 border border-slate-200/40 dark:border-slate-900/40 relative flex flex-col justify-between h-[340px]">
                        
                        {/* CARD TOP HEADER */}
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
                              {loan.type.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              loan.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'
                            }`}>
                              {loan.priority} Priority
                            </span>
                          </div>

                          <h3 className="text-sm font-bold mt-3 text-slate-900 dark:text-white">{loan.name}</h3>
                          <span className="text-[10px] text-slate-400 block">{loan.lenderName} • {loan.loanNumber || 'No Acc Num'}</span>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <span className="text-[9px] text-slate-400 block uppercase font-semibold">Outstanding</span>
                              <span className="text-xs font-bold text-gradient-rose">
                                {formatCurrency(loan.currentOutstanding)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block uppercase font-semibold">Original Loan</span>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {formatCurrency(loan.originalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* MIDDLE paydown progress bar */}
                        <div className="my-4">
                          <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                            <span>Payoff Progress</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{paydownPercent.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${paydownPercent}%` }}></div>
                          </div>
                        </div>

                        {/* BOTTOM STATS & DETAILS BUTTON */}
                        <div>
                          <div className="grid grid-cols-3 gap-2 border-t border-slate-200/50 dark:border-slate-800/40 pt-3 text-center">
                            <div>
                              <span className="text-[8px] text-slate-400 block uppercase">EMI</span>
                              <span className="text-[10px] font-bold">{formatCurrency(loan.emi)}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 block uppercase">Rate</span>
                              <span className="text-[10px] font-bold">{loan.interestRate}%</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 block uppercase">Tenure</span>
                              <span className="text-[10px] font-bold">{loan.tenureMonths} mo</span>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => setSelectedLoanForSchedule(loan)}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-[10px] font-bold py-2 rounded-lg text-center cursor-pointer transition"
                            >
                              Amortization Schedule
                            </button>
                            <button
                              onClick={() => {
                                setLoans(loans.filter(l => l.id !== loan.id));
                              }}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
              </div>

            </div>
          )}

          {/* TAB 3: MONTHLY PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Repayments Ledger</h2>
                  <p className="text-xs text-slate-400">Record payments simply. The system calculates and logs the breakdown automatically.</p>
                </div>
                <button
                  onClick={() => setShowAddPaymentModal(true)}
                  className="glow-btn bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Record Repayment
                </button>
              </div>

              {/* DYNAMIC PAYMENT LEDGER TABLE */}
              <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/40 dark:border-slate-900/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Payment Date</th>
                        <th className="py-4 px-6">Loan & Lender</th>
                        <th className="py-4 px-6 text-right">Amount Paid</th>
                        <th className="py-4 px-6 text-right">Principal Paid</th>
                        <th className="py-4 px-6 text-right">Interest Paid</th>
                        <th className="py-4 px-6 text-right">New Balance</th>
                        <th className="py-4 px-6">Reference & Notes</th>
                        <th className="py-4 px-6 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                      {payments.map(p => {
                        const associatedLoan = loans.find(l => l.id === p.loanId);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                            <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-semibold">{p.paymentDate}</td>
                            <td className="py-4 px-6 font-bold">
                              <span className="block text-slate-950 dark:text-white">{associatedLoan?.name || 'Unknown Loan'}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{associatedLoan?.lenderName}</span>
                            </td>
                            <td className="py-4 px-6 text-right font-extrabold text-blue-600 dark:text-blue-400">
                              {formatCurrency(p.paidAmount)}
                            </td>
                            <td className="py-4 px-6 text-right text-emerald-500 font-medium">
                              {formatCurrency(p.principalPaid)}
                            </td>
                            <td className="py-4 px-6 text-right text-amber-500 font-medium">
                              {formatCurrency(p.interestPaid)}
                            </td>
                            <td className="py-4 px-6 text-right font-semibold text-rose-500">
                              {formatCurrency(p.remainingBalance)}
                            </td>
                            <td className="py-4 px-6">
                              <span className="block font-bold text-[10px] text-slate-400">{p.referenceNumber || 'No Reference'}</span>
                              <span className="text-[10px] italic text-slate-500">{p.notes || 'None'}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => {
                                  setPayments(payments.filter(pay => pay.id !== p.id));
                                }}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: EXPENSES & BUDGETS */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Expense Manager & Budget</h2>
                  <p className="text-xs text-slate-400">Track standard expenses. Color indicators alert you immediately when approaching thresholds.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="glow-btn bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add Expense
                  </button>
                  <button
                    onClick={() => setShowAddIncomeModal(true)}
                    className="glow-btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add Income
                  </button>
                </div>
              </div>

              {/* Premium MoM Daily Spends Analytics */}
              {(() => {
                const now = new Date();
                const curM = now.getMonth();
                const curY = now.getFullYear();
                
                const prevM = curM === 0 ? 11 : curM - 1;
                const prevY = curM === 0 ? curY - 1 : curY;

                const curMonthSpends = expenses
                  .filter(e => {
                    const d = new Date(e.date);
                    return !isNaN(d.getTime()) && d.getMonth() === curM && d.getFullYear() === curY;
                  })
                  .reduce((sum, e) => sum + Number(e.amount), 0);

                const prevMonthSpends = expenses
                  .filter(e => {
                    const d = new Date(e.date);
                    return !isNaN(d.getTime()) && d.getMonth() === prevM && d.getFullYear() === prevY;
                  })
                  .reduce((sum, e) => sum + Number(e.amount), 0);

                const diff = curMonthSpends - prevMonthSpends;
                const pct = prevMonthSpends > 0 ? (diff / prevMonthSpends) * 100 : 0;
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-900/40 shadow-sm flex flex-col justify-between h-32">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Month Spends</span>
                        <span className="text-2xl font-black mt-2 block text-slate-900 dark:text-white">{formatCurrency(curMonthSpends)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Total recorded this month</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-900/40 shadow-sm flex flex-col justify-between h-32">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Previous Month Spends</span>
                        <span className="text-2xl font-black mt-2 block text-slate-900 dark:text-white">{formatCurrency(prevMonthSpends)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Total recorded last month</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-900/40 shadow-sm flex flex-col justify-between h-32">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Month-over-Month Delta</span>
                        <span className={`text-2xl font-black mt-2 flex items-center gap-1 ${diff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {diff > 0 ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                          {Math.abs(pct).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold text-slate-500 dark:text-slate-400">
                        {diff > 0 
                          ? `Spent ${formatCurrency(diff)} more than last month` 
                          : `Saved ${formatCurrency(Math.abs(diff))} compared to last month`}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* BUDGET HEALTH PROGRESS INDICATORS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map(b => {
                  const spent = expenses.filter(exp => {
                    const d = new Date(exp.date);
                    return exp.category === b.category && d.getMonth() === curMonth;
                  }).reduce((sum, exp) => sum + exp.amount, 0);

                  const limit = Number(b.limitAmount);
                  const pct = Math.min(100, (spent / limit) * 100);
                  
                  // Color calculation
                  let barColor = 'bg-emerald-500';
                  let textColor = 'text-emerald-500';
                  if (pct >= 85) {
                    barColor = 'bg-rose-500';
                    textColor = 'text-rose-500';
                  } else if (pct >= 65) {
                    barColor = 'bg-amber-500';
                    textColor = 'text-amber-500';
                  }

                  return (
                    <div key={b.id} className="glass-card rounded-2xl p-5 border border-slate-200/40 dark:border-slate-900/40 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300">{b.category}</h4>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          pct >= 85 ? 'bg-rose-500/10' : 'bg-emerald-500/10'
                        } ${textColor}`}>{pct.toFixed(0)}% Used</span>
                      </div>
                      
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                        <span>Spent: ${spent.toLocaleString()}</span>
                        <span>Budget: ${limit.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* EXPENSE LEDGER */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold">Transaction History</h3>
                <div className="space-y-3">
                  {expenses.map((e, idx) => (
                    <div key={e.id || idx} className="p-3 rounded-xl bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-900/40 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300 block">{e.category}</span>
                        <span className="text-[9px] text-slate-400">{e.date} • {e.paymentMethod}</span>
                      </div>
                      <span className="text-xs font-bold text-rose-500">-{formatCurrency(e.amount || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: INVESTMENTS & ASSETS */}
          {activeTab === 'investments' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Investments & Assets</h2>
                  <p className="text-xs text-slate-400">Add assets or funds. FinanceOS automatically calculates current totals and net worth.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddInvestmentModal(true)}
                    className="glow-btn bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    + Add Investment
                  </button>
                  <button
                    onClick={() => setShowAddAssetModal(true)}
                    className="glow-btn bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    + Add Asset
                  </button>
                </div>
              </div>

              {/* INVESTMENTS TABLE */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold">Investment Ledger</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {investments.map(inv => {
                    const gain = inv.currentValue - inv.investedValue;
                    const pct = (gain / inv.investedValue) * 100;
                    return (
                      <div key={inv.id} className="p-4 rounded-2xl bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-900/40 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-300 block">{inv.name}</span>
                          <span className="text-[9px] text-slate-400">{inv.type}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold block">${inv.currentValue.toLocaleString()}</span>
                          <span className={`text-[10px] font-bold ${gain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {gain >= 0 ? '+' : ''}{pct.toFixed(1)}% (${gain.toLocaleString()})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ASSETS LIST */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold">Asset Directory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assets.map(ast => (
                    <div key={ast.id} className="p-4 rounded-2xl bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-900/40 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300 block">{ast.name}</span>
                        <span className="text-[9px] text-slate-400">{ast.type}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-500">{formatCurrency(ast.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: DETAILED REPORTS */}
          {activeTab === 'reports' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Financial Reports Console</h2>
                <p className="text-xs text-slate-400">Generate and export system-wide database tables.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Monthly Report', 'Yearly Report', 'Loan Report', 'Interest Report', 'Net Worth Report', 'Expense Report'].map(rep => (
                  <div key={rep} className="p-4 rounded-xl bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 flex flex-col justify-between h-28">
                    <span className="text-xs font-bold">{rep}</span>
                    <button
                      onClick={() => alert(`Exporting ${rep}...`)}
                      className="mt-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 rounded-lg cursor-pointer"
                    >
                      Export CSV / PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: DUE CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Due Date Calendar</h2>
                <p className="text-xs text-slate-400">Review future scheduled EMI payments, renewals, and budget cycles.</p>
              </div>

              {/* Premium Calendar Prepayment Advice */}
              {loans.filter(l => l.status === 'ACTIVE').length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/20 space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">💡 Calendar Optimization Advice</span>
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {loans.filter(l => l.status === 'ACTIVE').slice(0, 2).map(l => {
                      const suggestAmount = Math.round(l.emi * 0.1);
                      const benefit = calculatePrepaymentBenefit(Number(l.currentOutstanding), Number(l.interestRate), Number(l.emi), suggestAmount);
                      return (
                        <p key={l.id} className="leading-relaxed">
                          • On your <strong className="text-slate-900 dark:text-white">{l.name}</strong> (due monthly at {l.lenderName}): paying an extra <strong className="text-blue-500">{formatCurrency(suggestAmount)}</strong> on the payment date reduces interest by <strong className="text-emerald-500">{formatCurrency(benefit.interestSaved)}</strong> and clears the debt <strong className="text-emerald-500">{benefit.monthsSaved} months sooner</strong>.
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center font-bold text-xs text-slate-400 py-2 border-b border-slate-200 dark:border-slate-800">{day}</div>
                ))}
                
                {Array.from({ length: 28 }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dueLoansForDay = loans.filter(l => {
                    if (l.status !== 'ACTIVE') return false;
                    const startDate = new Date(l.startDate);
                    return !isNaN(startDate.getTime()) && startDate.getDate() === dayNum;
                  });
                  const isEmiDay = dueLoansForDay.length > 0;
                  
                  return (
                    <div key={idx} className={`h-24 rounded-xl border border-slate-200/40 dark:border-slate-900/60 p-2 flex flex-col justify-between text-xs ${
                      isEmiDay ? 'bg-rose-500/10 border-rose-500' : 'bg-slate-100/10'
                    }`}>
                      <span className="font-bold text-slate-400">{dayNum}</span>
                      {isEmiDay && (
                        <div className="space-y-1 overflow-y-auto max-h-16">
                          {dueLoansForDay.map(dl => (
                            <span key={dl.id} className="block px-1 py-0.5 rounded bg-rose-500 text-white text-[8px] font-bold uppercase truncate" title={dl.name}>
                              {dl.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: ADMIN CONSOLE */}
          {activeTab === 'admin' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Admin & System Settings</h2>
                <p className="text-xs text-slate-400">Configure global configurations, currency parameters, system backups, and database restores.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Reset & Settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Interface Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Base Currency</label>
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Language</label>
                      <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs">
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => {
                        setLoans(INITIAL_LOANS);
                        setPayments(INITIAL_PAYMENTS);
                        setExpenses(INITIAL_EXPENSES);
                        setIncomes(INITIAL_INCOMES);
                        setAccounts(INITIAL_ACCOUNTS);
                        alert("Database restored to defaults!");
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
                    >
                      Restore System Seed
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* AMORTIZATION SCHEDULE DIALOG MODAL */}
      {selectedLoanForSchedule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/80 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Amortization Schedule</h3>
                <p className="text-xs text-slate-400">{selectedLoanForSchedule.name} • Lender: {selectedLoanForSchedule.lenderName}</p>
              </div>
              <button
                onClick={() => setSelectedLoanForSchedule(null)}
                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body Table */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Interactive Payoff Prepayment Simulator Card */}
              <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Payoff Prepayment Simulator</h4>
                    <p className="text-[10px] text-slate-400">Increase monthly repayments to calculate time and interest saved.</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-extrabold font-mono">
                    +{formatCurrency(simulatedPrepayment)} / mo
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={currency === 'INR' ? '100000' : '5000'}
                  step={currency === 'INR' ? '1000' : '50'}
                  value={simulatedPrepayment}
                  onChange={(e) => setSimulatedPrepayment(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                {/* Precalculation of savings */}
                {(() => {
                  const baseSchedule = generateAmortizationSchedule(selectedLoanForSchedule, payments.filter(p => p.loanId === selectedLoanForSchedule.id), 0);
                  const simSchedule = generateAmortizationSchedule(selectedLoanForSchedule, payments.filter(p => p.loanId === selectedLoanForSchedule.id), simulatedPrepayment);
                  
                  const baseInterest = baseSchedule.reduce((sum, r) => sum + r.interest, 0);
                  const simInterest = simSchedule.reduce((sum, r) => sum + r.interest, 0);
                  const interestSaved = Math.max(0, baseInterest - simInterest);
                  
                  const monthsSaved = Math.max(0, baseSchedule.length - simSchedule.length);
                  
                  return (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80">
                        <span className="text-[9px] text-slate-400 block uppercase font-semibold">New Duration</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">{simSchedule.length} months</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80">
                        <span className="text-[9px] text-slate-400 block uppercase font-semibold">Time Saved</span>
                        <span className="text-xs font-bold text-emerald-500">{monthsSaved} months</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80">
                        <span className="text-[9px] text-slate-400 block uppercase font-semibold">Interest Saved</span>
                        <span className="text-xs font-bold text-blue-500">{formatCurrency(interestSaved)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4">Opening Balance</th>
                      <th className="py-3 px-4 text-right">Scheduled EMI</th>
                      <th className="py-3 px-4 text-right">Interest Paid</th>
                      <th className="py-3 px-4 text-right">Principal Paid</th>
                      <th className="py-3 px-4 text-right">Closing Balance</th>
                      <th className="py-3 px-4 text-right">Extra Prepayment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                    {generateAmortizationSchedule(
                      selectedLoanForSchedule,
                      payments.filter(p => p.loanId === selectedLoanForSchedule.id),
                      simulatedPrepayment
                    ).map(row => (
                      <tr key={row.monthIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-semibold">{row.dateStr}</td>
                        <td className="py-3 px-4 font-mono">{formatCurrency(row.openingBalance)}</td>
                        <td className="py-3 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                          {formatCurrency(row.emi)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-500">
                          {formatCurrency(row.interest)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-500">
                          {formatCurrency(row.principal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-white font-bold">
                          {formatCurrency(row.closingBalance)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-pink-500 font-semibold">
                          {row.extraPaid > 0 ? `+${formatCurrency(row.extraPaid)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DIALOG MODAL: ADD LOAN */}
      {showAddLoanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/80 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">Add Original Loan details</h3>
              <button onClick={() => setShowAddLoanModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Loan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Home Loan Premium"
                    value={newLoan.name}
                    onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Lender Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank"
                    value={newLoan.lenderName}
                    onChange={(e) => setNewLoan({ ...newLoan, lenderName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Loan Type</label>
                  <select
                    value={newLoan.type}
                    onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value as LoanType })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none"
                  >
                    <option value="HOME_LOAN">Home Loan</option>
                    <option value="GOLD_LOAN">Gold Loan</option>
                    <option value="PERSONAL_LOAN">Personal Loan</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Original Loan Amount (${currency})</label>
                  <input
                    type="number"
                    required
                    value={newLoan.originalAmount}
                    onChange={(e) => setNewLoan({ ...newLoan, originalAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newLoan.interestRate}
                    onChange={(e) => setNewLoan({ ...newLoan, interestRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    value={newLoan.tenureMonths}
                    onChange={(e) => setNewLoan({ ...newLoan, tenureMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">EMI (${currency})</label>
                  <input
                    type="number"
                    required
                    value={newLoan.emi}
                    onChange={(e) => setNewLoan({ ...newLoan, emi: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLoan.startDate}
                    onChange={(e) => setNewLoan({ ...newLoan, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newLoan.priority}
                    onChange={(e) => setNewLoan({ ...newLoan, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              {/* Real-time Prepayment Advisor Preview */}
              {(() => {
                const amt = Number(newLoan.originalAmount || 0);
                const rate = Number(newLoan.interestRate || 0);
                const emi = Number(newLoan.emi || 0);
                if (amt > 0 && rate > 0 && emi > 0) {
                  const suggestedExtra = Math.round(emi * 0.1);
                  const benefit = calculatePrepaymentBenefit(amt, rate, emi, suggestedExtra);
                  if (benefit.interestSaved > 0 && benefit.monthsSaved > 0) {
                    return (
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          <span>💡 Smart Prepayment Tip ({newLoan.lenderName || 'Selected Bank'})</span>
                        </div>
                        <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                          Paying just <strong className="text-blue-600 dark:text-blue-400">+{formatCurrency(suggestedExtra)}/mo</strong> (10% extra) reduces your principal faster. This will save you <strong className="text-emerald-500">{formatCurrency(benefit.interestSaved)}</strong> in total interest and close your loan <strong className="text-emerald-500">{benefit.monthsSaved} months sooner</strong>!
                        </p>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer"
              >
                Create Loan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODAL: RECORD REPAYMENT */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/80 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">Record Loan Repayment</h3>
              <button onClick={() => setShowAddPaymentModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Loan</label>
                <select
                  required
                  value={newPayment.loanId}
                  onChange={(e) => {
                    const l = loans.find(l => l.id === e.target.value);
                    setNewPayment({
                      ...newPayment,
                      loanId: e.target.value,
                      paidAmount: l ? Number(l.emi) : 0
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none"
                >
                  <option value="">Select a loan...</option>
                  {loans.filter(l => l.status === 'ACTIVE').map(l => (
                    <option key={l.id} value={l.id}>{l.name} (${Number(l.currentOutstanding).toLocaleString()} Outstanding)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Paid Amount (${currency})</label>
                  <input
                    type="number"
                    required
                    value={newPayment.paidAmount || ''}
                    onChange={(e) => setNewPayment({ ...newPayment, paidAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Debited Account</label>
                  <select
                    value={newPayment.accountId}
                    onChange={(e) => setNewPayment({ ...newPayment, accountId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none"
                  >
                    <option value="">Select account...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={newPayment.paymentDate}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Ref Number / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN10238"
                    value={newPayment.referenceNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* ADVANCED OVERRIDE OPTIONS */}
              <div className="border-t border-slate-200/30 dark:border-slate-800/40 pt-3">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={newPayment.isManualOverride}
                    onChange={(e) => setNewPayment({ ...newPayment, isManualOverride: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
                  />
                  <span>Advanced Override Mode (Manual Statement Sync)</span>
                </label>
              </div>

              {newPayment.isManualOverride && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-[10px] text-amber-500 font-bold block">Input values exactly as matching Bank Statement:</span>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-0.5 text-[9px]">Interest Paid</label>
                      <input
                        type="number"
                        value={newPayment.interestPaid || ''}
                        onChange={(e) => setNewPayment({ ...newPayment, interestPaid: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5 text-[9px]">Principal Paid</label>
                      <input
                        type="number"
                        value={newPayment.principalPaid || ''}
                        onChange={(e) => setNewPayment({ ...newPayment, principalPaid: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5 text-[9px]">New Balance</label>
                      <input
                        type="number"
                        value={newPayment.remainingBalance || ''}
                        onChange={(e) => setNewPayment({ ...newPayment, remainingBalance: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-0.5 text-[9px]">Adjust Rate Override (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 8.2"
                        value={newPayment.interestRateOverride || ''}
                        onChange={(e) => setNewPayment({ ...newPayment, interestRateOverride: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5 text-[9px]">Late/Late Fee Paid</label>
                      <input
                        type="number"
                        placeholder="e.g. 250"
                        value={newPayment.lateFeeOverride || ''}
                        onChange={(e) => setNewPayment({ ...newPayment, lateFeeOverride: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Prepayment Advisor Preview inside Make Payment Modal */}
              {(() => {
                const targetLoan = loans.find(l => l.id === newPayment.loanId);
                if (targetLoan && targetLoan.status === 'ACTIVE') {
                  const amt = Number(targetLoan.currentOutstanding || 0);
                  const rate = Number(targetLoan.interestRate || 0);
                  const emi = Number(targetLoan.emi || 0);
                  if (amt > 0 && rate > 0 && emi > 0) {
                    const suggestedExtra = Math.round(emi * 0.15);
                    const benefit = calculatePrepaymentBenefit(amt, rate, emi, suggestedExtra);
                    if (benefit.interestSaved > 0 && benefit.monthsSaved > 0) {
                      return (
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            <span>💡 Prepayment Boost Suggestion</span>
                          </div>
                          <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                            Increase this payment by <strong className="text-blue-600 dark:text-blue-400">+{formatCurrency(suggestedExtra)}</strong>. Over time, this 15% boost on your {targetLoan.name} saves you <strong className="text-emerald-500">{formatCurrency(benefit.interestSaved)}</strong> in total interest and closes the loan <strong className="text-emerald-500">{benefit.monthsSaved} months sooner</strong>!
                          </p>
                        </div>
                      );
                    }
                  }
                }
                return null;
              })()}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer"
              >
                Apply Repayment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODAL: ADD EXPENSE */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/80 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">Record New Expense</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Food, Fuel, Rent"
                    value={newExpense.category || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Amount (${currency})</label>
                  <input
                    type="number"
                    required
                    value={newExpense.amount || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Payment Method</label>
                  <select
                    value={newExpense.paymentMethod}
                    onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Account</label>
                  <select
                    value={newExpense.accountId}
                    onChange={(e) => setNewExpense({ ...newExpense, accountId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none"
                  >
                    <option value="">Select account...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer"
              >
                Log Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODAL: ADD INCOME */}
      {showAddIncomeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/80 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">Record Income Credit</h3>
              <button onClick={() => setShowAddIncomeModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateIncome} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Salary, Bonus, Freelance"
                    value={newIncome.category || ''}
                    onChange={(e) => setNewIncome({ ...newIncome, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Amount (${currency})</label>
                  <input
                    type="number"
                    required
                    value={newIncome.amount || ''}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Destination Account</label>
                <select
                  value={newIncome.accountId}
                  onChange={(e) => setNewIncome({ ...newIncome, accountId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none"
                >
                  <option value="">Select account...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer"
              >
                Log Income
              </button>
            </form>
          </div>
        </div>
      )}


      {/* DIALOG MODAL: ADD INVESTMENT */}
      {showAddInvestmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/80 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">Log New Investment Asset</h3>
              <button onClick={() => setShowAddInvestmentModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateInvestment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Fund / Stock Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parag Parikh Flexi Cap"
                  value={newInvestment.name || ''}
                  onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Asset Type</label>
                  <select
                    value={newInvestment.type}
                    onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none"
                  >
                    <option value="MUTUAL_FUND">Mutual Fund</option>
                    <option value="STOCK">Stock Equity</option>
                    <option value="CRYPTO">Cryptocurrency</option>
                    <option value="PPF">Provident Fund (PPF)</option>
                    <option value="BOND">Treasury Bond</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Invested Principal</label>
                  <input
                    type="number"
                    required
                    value={newInvestment.investedValue || ''}
                    onChange={(e) => setNewInvestment({ ...newInvestment, investedValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Current Evaluation Value</label>
                <input
                  type="number"
                  required
                  value={newInvestment.currentValue || ''}
                  onChange={(e) => setNewInvestment({ ...newInvestment, currentValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer"
              >
                Log Investment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODAL: ADD ASSET */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/80 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">Log New Physical Asset</h3>
              <button onClick={() => setShowAddAssetModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real Estate Flat"
                  value={newAsset.name || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Asset Category</label>
                  <select
                    value={newAsset.type}
                    onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs outline-none"
                  >
                    <option value="HOUSE">Real Estate / House</option>
                    <option value="GOLD">Physical Gold</option>
                    <option value="CAR">Vehicle / Car</option>
                    <option value="ELECTRONICS">Electronics / Hardware</option>
                    <option value="OTHER">Other Valuable Asset</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Estimated Value</label>
                  <input
                    type="number"
                    required
                    value={newAsset.value || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer"
              >
                Log Physical Asset
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}