import { Controller, Get, Post, Delete, Body, Headers, Param, BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('api/finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  private checkUserId(userId: string) {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
  }

  private getRealUserId(userId: string): string {
    this.checkUserId(userId);
    if (userId.includes('.')) {
      try {
        const payload = JSON.parse(Buffer.from(userId.split('.')[1], 'base64').toString());
        return payload.id || userId;
      } catch (e) {
        return userId;
      }
    }
    return userId;
  }

  @Get('accounts')
  async getAccounts(@Headers('x-user-id') userId: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.getAccounts(realId);
  }

  @Post('accounts')
  async createAccount(@Headers('x-user-id') userId: string, @Body() body: any) {
    const realId = this.getRealUserId(userId);
    return this.financeService.createAccount(realId, body);
  }

  @Delete('accounts/:id')
  async deleteAccount(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.deleteAccount(realId, id);
  }

  @Get('loans')
  async getLoans(@Headers('x-user-id') userId: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.getLoans(realId);
  }

  @Post('loans')
  async createLoan(@Headers('x-user-id') userId: string, @Body() body: any) {
    const realId = this.getRealUserId(userId);
    return this.financeService.createLoan(realId, body);
  }

  @Delete('loans/:id')
  async deleteLoan(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.deleteLoan(realId, id);
  }

  @Get('payments')
  async getPayments(@Headers('x-user-id') userId: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.getPayments(realId);
  }

  @Post('payments')
  async createPayment(@Headers('x-user-id') userId: string, @Body() body: any) {
    const realId = this.getRealUserId(userId);
    return this.financeService.createPayment(realId, body);
  }

  @Get('expenses')
  async getExpenses(@Headers('x-user-id') userId: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.getExpenses(realId);
  }

  @Post('expenses')
  async createExpense(@Headers('x-user-id') userId: string, @Body() body: any) {
    const realId = this.getRealUserId(userId);
    return this.financeService.createExpense(realId, body);
  }

  @Get('budgets')
  async getBudgets(@Headers('x-user-id') userId: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.getBudgets(realId);
  }

  @Post('budgets')
  async createBudget(@Headers('x-user-id') userId: string, @Body() body: any) {
    const realId = this.getRealUserId(userId);
    return this.financeService.createBudget(realId, body);
  }

  @Get('assets')
  async getAssets(@Headers('x-user-id') userId: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.getAssets(realId);
  }

  @Post('assets')
  async createAsset(@Headers('x-user-id') userId: string, @Body() body: any) {
    const realId = this.getRealUserId(userId);
    return this.financeService.createAsset(realId, body);
  }

  @Get('investments')
  async getInvestments(@Headers('x-user-id') userId: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.getInvestments(realId);
  }

  @Post('investments')
  async createInvestment(@Headers('x-user-id') userId: string, @Body() body: any) {
    const realId = this.getRealUserId(userId);
    return this.financeService.createInvestment(realId, body);
  }

  @Delete('expenses/:id')
  async deleteExpense(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.deleteExpense(realId, id);
  }

  @Delete('assets/:id')
  async deleteAsset(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.deleteAsset(realId, id);
  }

  @Delete('investments/:id')
  async deleteInvestment(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    const realId = this.getRealUserId(userId);
    return this.financeService.deleteInvestment(realId, id);
  }
}
