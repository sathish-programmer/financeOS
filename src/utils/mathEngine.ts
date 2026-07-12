import type { Loan, Payment, Expense, Income, Budget, Asset, Alert } from '../types/finance';

/**
 * Calculates standard amortization line-by-line starting from a loan's initial parameters
 * or current state and tracing through payments.
 */
export interface AmortizationRow {
  monthIndex: number;
  dateStr: string;
  openingBalance: number;
  emi: number;
  interest: number;
  principal: number;
  closingBalance: number;
  extraPaid: number;
}

export function generateAmortizationSchedule(loan: Loan, payments: Payment[], simulatedPrepayment: number = 0): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  let outstanding = Number(loan.originalAmount);
  const monthlyRate = (Number(loan.interestRate) / 100) / 12;
  const tenure = Number(loan.tenureMonths);
  const scheduledEmi = Number(loan.emi);
  
  // Sort payments by date ascending
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );

  let currentDate = new Date(loan.startDate);
  
  // Track how many months we simulate
  for (let month = 1; month <= tenure * 2 && outstanding > 0.01; month++) {
    const opening = outstanding;
    const interest = opening * monthlyRate;
    
    // Find if a payment was registered in this calendar month/year
    const paymentInMonth = sortedPayments.find(p => {
      const pDate = new Date(p.paymentDate);
      return pDate.getMonth() === currentDate.getMonth() && pDate.getFullYear() === currentDate.getFullYear();
    });

    let extraPaid = simulatedPrepayment;
    let paidAmount = scheduledEmi + extraPaid;
    
    if (paymentInMonth) {
      if (paymentInMonth.isManualOverride) {
        // Respect manual overrides completely
        const pInterest = Number(paymentInMonth.interestPaid);
        const pPrincipal = Number(paymentInMonth.principalPaid);
        outstanding = Number(paymentInMonth.remainingBalance);
        
        schedule.push({
          monthIndex: month,
          dateStr: currentDate.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
          openingBalance: opening,
          emi: Number(paymentInMonth.paidAmount),
          interest: pInterest,
          principal: pPrincipal,
          closingBalance: outstanding,
          extraPaid: Math.max(0, Number(paymentInMonth.paidAmount) - scheduledEmi),
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
        continue;
      } else {
        paidAmount = Number(paymentInMonth.paidAmount) + simulatedPrepayment;
        extraPaid = Math.max(0, Number(paymentInMonth.paidAmount) - scheduledEmi) + simulatedPrepayment;
      }
    }

    // Limit paid amount to closing requirements
    const neededToClose = opening + interest;
    if (paidAmount > neededToClose) {
      paidAmount = neededToClose;
    }

    let principal = paidAmount - interest;
    if (principal < 0) principal = 0;
    let closing = opening - principal;
    if (closing < 0) closing = 0;
    
    schedule.push({
      monthIndex: month,
      dateStr: currentDate.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
      openingBalance: opening,
      emi: paidAmount,
      interest: interest,
      principal: principal,
      closingBalance: closing,
      extraPaid,
    });
    
    outstanding = closing;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return schedule;
}

/**
 * Splits a single incoming payment automatically based on loan status, parameters
 */
export function calculatePaymentSplit(
  loan: Loan,
  paidAmount: number,
  paymentDateStr: string,
  payments: Payment[]
): {
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  interestSaved: number;
  monthsSaved: number;
} {
  const currentOutstanding = Number(loan.currentOutstanding);
  const monthlyRate = (Number(loan.interestRate) / 100) / 12;
  const interestPaid = currentOutstanding * monthlyRate;
  
  let principalPaid = paidAmount - interestPaid;
  if (principalPaid < 0) {
    principalPaid = 0;
  }
  
  let remainingBalance = currentOutstanding - principalPaid;
  if (remainingBalance < 0) {
    remainingBalance = 0;
  }

  // Prepayment calculations if user paid extra
  let interestSaved = 0;
  let monthsSaved = 0;
  
  const normalEmi = Number(loan.emi);
  if (paidAmount > normalEmi && remainingBalance > 0) {
    // Recalculate remaining months for normal EMI vs new remaining balance
    // N = - log(1 - (B * r)/EMI) / log(1 + r)
    const B = remainingBalance;
    const r = monthlyRate;
    const EMI = normalEmi;
    
    if (EMI > B * r) {
      const originalTenureRemaining = Number(loan.tenureMonths) - payments.length;
      const newTenureRemaining = Math.ceil(-Math.log(1 - (B * r) / EMI) / Math.log(1 + r));
      monthsSaved = Math.max(0, originalTenureRemaining - newTenureRemaining);
      
      // Rough estimate of interest saved: (original remaining payments * EMI - B) - (new remaining payments * EMI - B)
      const originalFutureCost = originalTenureRemaining * EMI;
      const newFutureCost = newTenureRemaining * EMI;
      interestSaved = Math.max(0, originalFutureCost - newFutureCost - (paidAmount - normalEmi));
    }
  }

  return {
    principalPaid: Number(principalPaid.toFixed(2)),
    interestPaid: Number(interestPaid.toFixed(2)),
    remainingBalance: Number(remainingBalance.toFixed(2)),
    interestSaved: Number(interestSaved.toFixed(2)),
    monthsSaved,
  };
}

/**
 * Suggests best repayment sequence using Avalanche, Snowball, or Hybrid modes
 */
export function generatePayoffRecommendations(
  loans: Loan[],
  extraPaymentAmount: number = 10000,
  assets: any[] = [],
  investments: any[] = []
): {
  strategy: string;
  recommendedLoan: Loan | null;
  reason: string;
  allPriorities: { loanId: string; rank: number; reason: string }[];
} {
  const activeLoans = loans.filter(l => l.status === 'ACTIVE' && l.currentOutstanding > 0);
  if (activeLoans.length === 0) {
    return { 
      strategy: 'N/A', 
      recommendedLoan: null, 
      reason: '🎉 Financial Freedom! You have zero active debts. All assets are growing compounding returns cleanly.', 
      allPriorities: [] 
    };
  }

  // Debt Avalanche: Sort by interest rate DESC
  const avalanche = [...activeLoans].sort((a, b) => Number(b.interestRate) - Number(a.interestRate));
  
  // Debt Snowball: Sort by balance ASC
  const snowball = [...activeLoans].sort((a, b) => Number(a.currentOutstanding) - Number(b.currentOutstanding));

  // Hybrid: Urgent (High Priority or Gold/Friend Loans) first, then Avalanche
  const getWeight = (l: Loan) => {
    let weight = 0;
    if (l.priority === 'HIGH') weight += 50;
    if (l.type === 'GOLD_LOAN' || l.type === 'FRIEND_LOAN' || l.type === 'FAMILY_LOAN') weight += 30;
    weight += Number(l.interestRate);
    return weight;
  };
  const hybrid = [...activeLoans].sort((a, b) => getWeight(b) - getWeight(a));

  const bestAvalanche = avalanche[0];
  const bestSnowball = snowball[0];

  // Calculate potential savings for highest interest rate loan if they paid extra
  const rate = Number(bestAvalanche.interestRate);
  const monthlyRate = (rate / 100) / 12;
  const estimatedSavings = Math.round(extraPaymentAmount * monthlyRate * bestAvalanche.tenureMonths);

  // BUILD REAL-TIME INTEL TIPS
  let realTimeTip = '';

  // 1. Check Receivables / Lent Money Overdue
  const receivables = loans.filter(l => 
    (l.type === 'FRIEND_LOAN' || l.type === 'FAMILY_LOAN') && 
    l.status === 'ACTIVE' && 
    l.currentOutstanding > 0
  );
  const highInterestDebt = activeLoans.find(l => Number(l.interestRate) >= 12 && l.type !== 'FRIEND_LOAN' && l.type !== 'FAMILY_LOAN');

  if (receivables.length > 0 && highInterestDebt) {
    const totalRec = receivables.reduce((sum, r) => sum + Number(r.currentOutstanding), 0);
    realTimeTip += ` 💡 **Receivables Action**: You have ₹${totalRec.toLocaleString()} lent to friends/family. Collecting this cash would allow you to pay down your high-interest ${highInterestDebt.name} (${highInterestDebt.interestRate}% interest), saving you high compounding finance charges!`;
  }

  // 2. Check Liquid Assets (Gold, Stocks) vs High Interest Debt (Credit Cards, Personal Loans)
  const ccDebt = activeLoans.find(l => l.type === 'CREDIT_CARD' && l.currentOutstanding > 5000);
  const goldAsset = assets.find(a => (a.name || '').toLowerCase().includes('gold') || (a.type || '').toLowerCase().includes('gold'));
  
  if (ccDebt && goldAsset && Number(goldAsset.value) > 10000) {
    realTimeTip += ` 💡 **Asset Tip**: Your credit card "${ccDebt.name}" has high-interest debt (${ccDebt.interestRate}%). Consider selling/liquidating some of your Gold asset (Value: ₹${Number(goldAsset.value).toLocaleString()}) to pay off the card balance. Clearing CC interest saves you more cash than gold appreciation!`;
  }

  // 3. Low Yield Investments (FD/PPF) vs High Interest Loan
  const fdInvestment = investments.find(i => (i.type || '').includes('FD') || (i.name || '').toLowerCase().includes('fixed deposit'));
  const activeHighDebt = activeLoans.find(l => Number(l.interestRate) > 9);
  
  if (fdInvestment && activeHighDebt && Number(fdInvestment.currentValue) > 10000) {
    realTimeTip += ` 💡 **Investment Swap**: Your Fixed Deposit (₹${Number(fdInvestment.currentValue).toLocaleString()}) earns ~6% return, but your ${activeHighDebt.name} costs you ${activeHighDebt.interestRate}% interest. Liquidating the FD to close this debt yields an immediate net saving!`;
  }

  const baseReason = `Avalanche strategy recommends paying off the ${bestAvalanche.name} (${bestAvalanche.lenderName}) first because it has the highest interest rate of ${bestAvalanche.interestRate}%. Payoff Snowball suggests closing ${bestSnowball.name} next since it has the smallest remaining balance. If you pay an extra ₹${extraPaymentAmount.toLocaleString()} towards ${bestAvalanche.name} this month, you will save approximately ₹${estimatedSavings.toLocaleString()} in interest.`;

  return {
    strategy: 'Avalanche / Snowball / Hybrid Analysis',
    recommendedLoan: bestAvalanche,
    reason: baseReason + (realTimeTip ? `\n\n**Real-time AI Asset Tips:**\n${realTimeTip}` : ''),
    allPriorities: hybrid.map((l, index) => ({
      loanId: l.id,
      rank: index + 1,
      reason: `Hybrid priority score: ${getWeight(l).toFixed(1)} (Rate: ${l.interestRate}%, Priority: ${l.priority})`,
    })),
  };
}

/**
 * Calculates budget alerts, credit card limits, and net worth checks.
 */
export function generateSystemAlerts(
  loans: Loan[],
  expenses: Expense[],
  budgets: Budget[],
  assets: Asset[],
  incomes: Income[],
  emergencyFund: number
): Alert[] {
  const alerts: Alert[] = [];
  const nowStr = new Date().toISOString().split('T')[0];

  // 1. Credit Card Utilization > 30%
  loans.filter(l => l.type === 'CREDIT_CARD' && l.status === 'ACTIVE').forEach(cc => {
    const outstanding = Number(cc.currentOutstanding);
    const limit = Number(cc.creditLimit || 0);
    if (limit > 0) {
      const util = (outstanding / limit) * 100;
      if (util > 30) {
        alerts.push({
          id: `cc-util-${cc.id}`,
          type: 'CREDIT_CARD_LIMIT',
          title: 'High Credit Card Utilization',
          message: `Your credit card "${cc.name}" utilization is at ${util.toFixed(1)}% (Limit: $${limit}, Outstanding: $${outstanding}), exceeding the recommended 30% limit.`,
          severity: util > 75 ? 'critical' : 'warning',
          date: nowStr,
        });
      }
    }
  });

  // 2. Budget exceeded checks
  const monthlyExpensesByCategory = expenses.reduce((acc, exp) => {
    // Simple current month filter
    const expDate = new Date(exp.date);
    const curDate = new Date();
    if (expDate.getMonth() === curDate.getMonth() && expDate.getFullYear() === curDate.getFullYear()) {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
    }
    return acc;
  }, {} as Record<string, number>);

  budgets.forEach(b => {
    const spent = monthlyExpensesByCategory[b.category] || 0;
    const limit = Number(b.limitAmount);
    if (spent > limit) {
      alerts.push({
        id: `budget-exceeded-${b.id}`,
        type: 'BUDGET_EXCEEDED',
        title: 'Budget Limit Exceeded',
        message: `You spent $${spent.toFixed(2)} on "${b.category}", exceeding your budget of $${limit.toFixed(2)} by $${(spent - limit).toFixed(2)}.`,
        severity: 'critical',
        date: nowStr,
      });
    } else if (spent > limit * 0.85) {
      alerts.push({
        id: `budget-warning-${b.id}`,
        type: 'BUDGET_EXCEEDED',
        title: 'Approaching Budget Limit',
        message: `You spent $${spent.toFixed(2)} on "${b.category}" which is ${((spent / limit) * 100).toFixed(0)}% of your $${limit.toFixed(2)} budget.`,
        severity: 'warning',
        date: nowStr,
      });
    }
  });

  // 3. Low Emergency Fund: If emergency fund < 3 * monthly expenses
  const totalMonthlyExpenses = Object.values(monthlyExpensesByCategory).reduce((sum, v) => sum + v, 0);
  if (emergencyFund < totalMonthlyExpenses * 3 && totalMonthlyExpenses > 0) {
    alerts.push({
      id: 'emergency-fund-low',
      type: 'LOW_EMERGENCY_FUND',
      title: 'Low Emergency Fund',
      message: `Your emergency savings of $${emergencyFund.toFixed(0)} are lower than 3 months of expenses ($${(totalMonthlyExpenses * 3).toFixed(0)}). We recommend saving more cash.`,
      severity: 'warning',
      date: nowStr,
    });
  }

  // 4. Gold Loan warning: If current date is within 30 days of Gold Loan renewal date
  loans.filter(l => l.type === 'GOLD_LOAN' && l.status === 'ACTIVE' && l.goldRenewalDate).forEach(gl => {
    const renewal = new Date(gl.goldRenewalDate!);
    const diffTime = renewal.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30 && diffDays >= 0) {
      alerts.push({
        id: `gold-renewal-${gl.id}`,
        type: 'GOLD_RENEWAL',
        title: 'Gold Loan Renewal Approaching',
        message: `Gold loan "${gl.name}" at ${gl.lenderName} is due for renewal on ${gl.goldRenewalDate} (${diffDays} days remaining).`,
        severity: diffDays <= 7 ? 'critical' : 'warning',
        date: nowStr,
      });
    }
  });

  // 5. Debt to Income Ratio > 40%
  const totalIncome = incomes.reduce((sum, inc) => {
    const incDate = new Date(inc.date);
    const curDate = new Date();
    if (incDate.getMonth() === curDate.getMonth() && incDate.getFullYear() === curDate.getFullYear()) {
      return sum + Number(inc.amount);
    }
    return sum;
  }, 0);

  const totalOutstandingDebts = loans.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + Number(l.currentOutstanding), 0);
  const totalMonthlyEmis = loans.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + Number(l.emi), 0);

  if (totalIncome > 0) {
    const dtiRatio = (totalMonthlyEmis / totalIncome) * 100;
    if (dtiRatio > 40) {
      alerts.push({
        id: 'dti-high',
        type: 'HIGH_DEBT_RATIO',
        title: 'High Debt-to-Income Ratio',
        message: `Your Debt-to-Income (DTI) ratio is ${dtiRatio.toFixed(1)}% (Monthly EMIs: $${totalMonthlyEmis.toFixed(0)}, Monthly Income: $${totalIncome.toFixed(0)}). A safe ratio is below 35%.`,
        severity: dtiRatio > 50 ? 'critical' : 'warning',
        date: nowStr,
      });
    }
  }

  // 6. Lent Money (Friend/Family Loans) Overdue Alert
  loans.filter(l => (l.type === 'FRIEND_LOAN' || l.type === 'FAMILY_LOAN') && l.status === 'ACTIVE').forEach(lent => {
    const returnDate = new Date(lent.endDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    returnDate.setHours(0,0,0,0);
    if (today >= returnDate) {
      const daysOverdue = Math.floor((today.getTime() - returnDate.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push({
        id: `lent-overdue-${lent.id}`,
        type: 'EMI_DUE',
        title: 'Receivable Balance Alert',
        message: `Your friend/family member "${lent.borrowerName || lent.name}" was expected to return ${Number(lent.currentOutstanding).toLocaleString()} on ${lent.endDate.toString().split('T')[0]}. This is now ${daysOverdue} days overdue!`,
        severity: 'critical',
        date: nowStr,
      });
    }
  });

  return alerts;
}

/**
 * Calculates interest and months saved if user prepays a fixed extra amount monthly
 */
export function calculatePrepaymentBenefit(
  originalAmount: number,
  interestRate: number,
  emi: number,
  extraAmount: number
): { monthsSaved: number; interestSaved: number; newTenure: number; totalInterestBase: number; totalInterestSimulated: number } {
  if (originalAmount <= 0 || interestRate <= 0 || emi <= 0 || extraAmount <= 0) {
    return { monthsSaved: 0, interestSaved: 0, newTenure: 0, totalInterestBase: 0, totalInterestSimulated: 0 };
  }

  const monthlyRate = (interestRate / 100) / 12;

  // 1. Simulate base timeline
  let balanceBase = originalAmount;
  let totalInterestBase = 0;
  let monthsBase = 0;
  while (balanceBase > 0.01 && monthsBase < 600) {
    const interest = balanceBase * monthlyRate;
    const principal = Math.min(balanceBase + interest, emi) - interest;
    balanceBase = Math.max(0, balanceBase + interest - emi);
    totalInterestBase += interest;
    monthsBase++;
    if (principal <= 0) break; // Avoid infinite loop if emi < interest
  }

  // 2. Simulate prepayment timeline
  let balanceSim = originalAmount;
  let totalInterestSimulated = 0;
  let monthsSim = 0;
  const totalMonthlyPayment = emi + extraAmount;
  while (balanceSim > 0.01 && monthsSim < 600) {
    const interest = balanceSim * monthlyRate;
    const principal = Math.min(balanceSim + interest, totalMonthlyPayment) - interest;
    balanceSim = Math.max(0, balanceSim + interest - totalMonthlyPayment);
    totalInterestSimulated += interest;
    monthsSim++;
    if (principal <= 0) break;
  }

  return {
    monthsSaved: Math.max(0, monthsBase - monthsSim),
    interestSaved: Math.max(0, totalInterestBase - totalInterestSimulated),
    newTenure: monthsSim,
    totalInterestBase,
    totalInterestSimulated
  };
}
