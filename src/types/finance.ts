export type LoanType =
  | 'HOME_LOAN'
  | 'GOLD_LOAN'
  | 'PERSONAL_LOAN'
  | 'VEHICLE_LOAN'
  | 'EDUCATION_LOAN'
  | 'BUSINESS_LOAN'
  | 'FRIEND_LOAN'
  | 'FAMILY_LOAN'
  | 'CREDIT_CARD'
  | 'OTHER';

export type InterestType = 'FIXED' | 'FLOATING';
export type LoanStatus = 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'RENEWAL_DUE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Loan {
  id: string;
  name: string;
  type: LoanType;
  lenderName: string;
  loanNumber?: string;
  originalAmount: number;
  currentOutstanding: number;
  interestRate: number;
  interestType: InterestType;
  tenureMonths: number;
  emi: number;
  startDate: string;
  endDate: string;
  processingFee: number;
  insurance: number;
  lateFee: number;
  prepaymentCharges: number;
  priority: Priority;
  status: LoanStatus;
  
  // Gold loan specific
  goldRenewalDate?: string;
  goldPenaltyRate?: number;
  goldAuctionWarning?: boolean;
  
  // Friend/Family loan specific
  borrowerName?: string;
  
  // Credit card specific
  creditLimit?: number;
  minDue?: number;
}

export interface Payment {
  id: string;
  loanId: string;
  paymentDate: string;
  paidAmount: number;
  referenceNumber?: string;
  notes?: string;
  accountId?: string;
  
  // System calculated fields
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  interestSaved?: number;
  monthsSaved?: number;
  
  // Advanced manual override flag
  isManualOverride?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'SAVINGS' | 'CURRENT' | 'CREDIT_CARD' | 'WALLET' | 'UPI';
  balance: number;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  subCategory?: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET' | 'CHEQUE';
  accountId?: string;
  notes?: string;
  recurring: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
}

export interface Investment {
  id: string;
  name: string;
  type: 'MUTUAL_FUND' | 'STOCK' | 'GOLD' | 'PPF' | 'EPF' | 'FD' | 'RD' | 'CRYPTO' | 'LAND' | 'HOUSE' | 'BOND' | 'OTHERS' | string;
  investedValue: number;
  currentValue: number;
  date?: string;
  isSIP?: boolean;
  sipAmount?: number;
  sipDate?: number; // Day of month (1-31)
  notes?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  type: 'EXPENSE' | 'INVESTMENT';
  classification?: string;
  targetDurationMonths?: number;
  targetDate?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'HOUSE' | 'LAND' | 'CAR' | 'BIKE' | 'GOLD' | 'JEWELLERY' | 'CASH' | 'BANK_BALANCE' | 'ELECTRONICS' | 'OTHERS';
  value: number;
}

export interface Income {
  id: string;
  date: string;
  category: 'Salary' | 'Bonus' | 'Rental' | 'Business' | 'Freelance' | 'Interest' | 'Other';
  amount: number;
  notes?: string;
  accountId?: string;
}

export interface Alert {
  id: string;
  type: 'EMI_DUE' | 'GOLD_RENEWAL' | 'CREDIT_CARD_LIMIT' | 'BUDGET_EXCEEDED' | 'LOW_EMERGENCY_FUND' | 'HIGH_DEBT_RATIO' | 'LARGE_INTEREST' | 'LOAN_CLOSED';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  date: string;
}
