import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  /** Get the family group this user belongs to (with members + their user details) */
  async getMyFamily(userId: string) {
    const membership = await this.prisma.familyMember.findFirst({
      where: { userId },
      include: {
        familyGroup: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });
    return membership?.familyGroup ?? null;
  }

  /** Create a new family group; caller becomes OWNER */
  async createFamily(userId: string, name: string) {
    // User must not already be in a family
    const existing = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (existing) {
      throw new BadRequestException('You are already in a family group. Leave it first.');
    }

    let inviteCode = generateInviteCode();
    // Ensure uniqueness
    while (await this.prisma.familyGroup.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    const group = await this.prisma.familyGroup.create({
      data: {
        name,
        inviteCode,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    return group;
  }

  /** Join a family group by invite code */
  async joinFamily(userId: string, inviteCode: string) {
    const existing = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (existing) {
      throw new BadRequestException('You are already in a family group. Leave it first.');
    }

    const group = await this.prisma.familyGroup.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });
    if (!group) {
      throw new NotFoundException('Invalid invite code. No family group found.');
    }

    await this.prisma.familyMember.create({
      data: { userId, familyGroupId: group.id, role: 'MEMBER' },
    });

    return this.getMyFamily(userId);
  }

  /** Leave the current family group */
  async leaveFamily(userId: string) {
    const membership = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (!membership) {
      throw new NotFoundException('You are not in a family group.');
    }

    await this.prisma.familyMember.delete({ where: { id: membership.id } });

    // If this was the last member, delete the group too
    const remaining = await this.prisma.familyMember.count({
      where: { familyGroupId: membership.familyGroupId },
    });
    if (remaining === 0) {
      await this.prisma.familyGroup.delete({ where: { id: membership.familyGroupId } });
    }

    return { success: true };
  }

  /** Return merged financial data for all members in the group */
  async getFamilyData(userId: string) {
    const group = await this.getMyFamily(userId);
    if (!group) throw new NotFoundException('You are not in a family group.');

    // Build a quick userId→name lookup from members
    const memberMap: Record<string, string> = {};
    for (const m of group.members as any[]) {
      memberMap[m.userId] = m.user?.name || 'Member';
    }
    const memberIds = Object.keys(memberMap);

    // Fetch all data without risky nested includes
    const [expenses, loans, investments, assets, budgets, accounts] = await Promise.all([
      this.prisma.expense.findMany({
        where: { userId: { in: memberIds } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.loan.findMany({
        where: { userId: { in: memberIds } },
      }),
      this.prisma.investment.findMany({
        where: { userId: { in: memberIds } },
      }),
      this.prisma.asset.findMany({
        where: { userId: { in: memberIds } },
      }),
      this.prisma.budget.findMany({
        where: { userId: { in: memberIds } },
      }),
      this.prisma.account.findMany({
        where: { userId: { in: memberIds } },
      }),
    ]);

    // Enrich each record with member name manually
    const enrich = (items: any[]) =>
      items.map((item) => ({
        ...item,
        user: { id: item.userId, name: memberMap[item.userId] || 'Member' },
      }));

    return {
      expenses: enrich(expenses),
      loans: enrich(loans),
      investments: enrich(investments),
      assets: enrich(assets),
      budgets: enrich(budgets),
      accounts: enrich(accounts),
    };
  }
}
