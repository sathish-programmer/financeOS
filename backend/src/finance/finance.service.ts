import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // User details
  async getUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // Accounts
  async getAccounts(userId: string) {
    return this.prisma.account.findMany({ where: { userId } });
  }

  async createAccount(userId: string, data: any) {
    const { id, ...cleanData } = data;
    return this.prisma.account.create({
      data: { ...cleanData, userId, balance: Number(cleanData.balance) },
    });
  }

  async deleteAccount(userId: string, id: string) {
    return this.prisma.account.delete({
      where: { id, userId },
    });
  }

  // Loans
  async getLoans(userId: string) {
    return this.prisma.loan.findMany({ where: { userId } });
  }

  async createLoan(userId: string, data: any) {
    const { id, ...cleanData } = data;
    return this.prisma.loan.create({
      data: {
        ...cleanData,
        userId,
        originalAmount: Number(cleanData.originalAmount),
        currentOutstanding: Number(cleanData.originalAmount),
        interestRate: Number(cleanData.interestRate),
        tenureMonths: Number(cleanData.tenureMonths),
        emi: Number(cleanData.emi),
        startDate: new Date(cleanData.startDate),
        endDate: new Date(cleanData.endDate),
        processingFee: Number(cleanData.processingFee || 0),
        insurance: Number(cleanData.insurance || 0),
        lateFee: Number(cleanData.lateFee || 0),
        prepaymentCharges: Number(cleanData.prepaymentCharges || 0),
        creditLimit: cleanData.creditLimit ? Number(cleanData.creditLimit) : undefined,
        minDue: cleanData.minDue ? Number(cleanData.minDue) : undefined,
        goldRenewalDate: cleanData.goldRenewalDate ? new Date(cleanData.goldRenewalDate) : undefined,
        goldPenaltyRate: cleanData.goldPenaltyRate ? Number(cleanData.goldPenaltyRate) : undefined,
      },
    });
  }

  async deleteLoan(userId: string, loanId: string) {
    return this.prisma.loan.delete({
      where: { id: loanId, userId },
    });
  }

  // Payments
  async getPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        loan: { userId }
      },
      include: {
        loan: true
      }
    });
  }

  async createPayment(userId: string, data: any) {
    // Process outstanding adjustment
    const loan = await this.prisma.loan.findFirst({
      where: { id: data.loanId, userId },
    });
    if (!loan) throw new Error('Loan not found');

    const payment = await this.prisma.payment.create({
      data: {
        loanId: data.loanId,
        accountId: data.accountId || undefined,
        paymentDate: new Date(data.paymentDate),
        paidAmount: Number(data.paidAmount),
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        principalPaid: Number(data.principalPaid),
        interestPaid: Number(data.interestPaid),
        remainingBalance: Number(data.remainingBalance),
        interestSaved: Number(data.interestSaved || 0),
        monthsSaved: Number(data.monthsSaved || 0),
        isManualOverride: data.isManualOverride || false,
      },
    });

    // Update loan currentOutstanding
    await this.prisma.loan.update({
      where: { id: data.loanId },
      data: {
        currentOutstanding: Number(data.remainingBalance),
        status: Number(data.remainingBalance) <= 0.05 ? 'CLOSED' : loan.status,
      },
    });

    // Update Account balance
    if (data.accountId) {
      await this.prisma.account.update({
        where: { id: data.accountId },
        data: {
          balance: { decrement: Number(data.paidAmount) },
        },
      });
    }

    return payment;
  }

  // Expenses
  async getExpenses(userId: string) {
    return this.prisma.expense.findMany({ where: { userId } });
  }

  async createExpense(userId: string, data: any) {
    const { id, recurring, ...cleanData } = data;
    const expense = await this.prisma.expense.create({
      data: {
        ...cleanData,
        userId,
        amount: Number(cleanData.amount),
        date: new Date(cleanData.date),
        isRecurring: recurring && recurring !== 'NONE',
        recurringType: recurring || 'NONE',
      },
    });

    if (cleanData.accountId) {
      await this.prisma.account.update({
        where: { id: cleanData.accountId },
        data: {
          balance: { decrement: Number(cleanData.amount) },
        },
      });
    }

    return expense;
  }

  // Incomes
  async getIncomes(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    }); // For simplicity or write helper
  }

  async getIncomesList(userId: string) {
    // We can simulate or store as assets/accounts
    return [];
  }

  // Budgets
  async getBudgets(userId: string) {
    return this.prisma.budget.findMany({ where: { userId } });
  }

  async createBudget(userId: string, data: any) {
    const { id, ...cleanData } = data;
    return this.prisma.budget.create({
      data: {
        ...cleanData,
        userId,
        limitAmount: Number(cleanData.limitAmount),
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
      },
    });
  }

  // Investments
  async getInvestments(userId: string) {
    return this.prisma.investment.findMany({ where: { userId } });
  }

  async createInvestment(userId: string, data: any) {
    const { id, ...cleanData } = data;
    return this.prisma.investment.create({
      data: {
        ...cleanData,
        userId,
        investedValue: Number(cleanData.investedValue),
        currentValue: Number(cleanData.currentValue),
        gainLoss: Number(cleanData.currentValue) - Number(cleanData.investedValue),
      },
    });
  }

  // Assets
  async getAssets(userId: string) {
    return this.prisma.asset.findMany({ where: { userId } });
  }

  async createAsset(userId: string, data: any) {
    const { id, ...cleanData } = data;
    return this.prisma.asset.create({
      data: {
        ...cleanData,
        userId,
        value: Number(cleanData.value),
      },
    });
  }
}
