import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { FinanceModule } from './finance/finance.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [AuthModule, FinanceModule],
  providers: [PrismaService],
})
export class AppModule {}
