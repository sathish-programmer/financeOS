import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: { email: string; passwordHash: string; name: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
      },
    });

    const token = this.jwtService.sign({ id: user.id, email: user.email, name: user.name });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async login(data: { email: string; passwordHash: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(data.passwordHash, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email, name: user.name });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  /** Update user profile (name, email, password) */
  async updateProfile(userId: string, data: { name?: string; email?: string; passwordHash?: string }) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    
    if (data.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Email already in use by another account');
      }
      updateData.email = data.email;
    }

    if (data.passwordHash) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(data.passwordHash, salt);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const token = this.jwtService.sign({ id: updatedUser.id, email: updatedUser.email, name: updatedUser.name });
    return { token, user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name } };
  }

  /** Delete user account and all associated financial records completely */
  async deleteAccount(userId: string) {
    // Delete memberships first
    await this.prisma.familyMember.deleteMany({ where: { userId } });
    
    // Delete financial sub-records
    await Promise.all([
      this.prisma.asset.deleteMany({ where: { userId } }),
      this.prisma.loan.deleteMany({ where: { userId } }),
      this.prisma.investment.deleteMany({ where: { userId } }),
      this.prisma.budget.deleteMany({ where: { userId } }),
      this.prisma.expense.deleteMany({ where: { userId } }),
      this.prisma.account.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
    ]);

    // Finally delete the user account profile
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }
}
