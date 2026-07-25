import { Controller, Get, Post, Delete, Body, Headers, BadRequestException } from '@nestjs/common';
import { FamilyService } from './family.service';

@Controller('api/family')
export class FamilyController {
  constructor(private familyService: FamilyService) {}

  private getRealUserId(userId: string): string {
    if (!userId) throw new BadRequestException('x-user-id header is required');
    if (userId.includes('.')) {
      try {
        const payload = JSON.parse(Buffer.from(userId.split('.')[1], 'base64').toString());
        return payload.id || userId;
      } catch {
        return userId;
      }
    }
    return userId;
  }

  /** GET /api/family/me — return the caller's family group or null */
  @Get('me')
  async getMyFamily(@Headers('x-user-id') userId: string) {
    const realId = this.getRealUserId(userId);
    return this.familyService.getMyFamily(realId);
  }

  /** POST /api/family/create — { name: string } */
  @Post('create')
  async createFamily(@Headers('x-user-id') userId: string, @Body() body: { name: string }) {
    const realId = this.getRealUserId(userId);
    return this.familyService.createFamily(realId, body.name);
  }

  /** POST /api/family/join — { inviteCode: string } */
  @Post('join')
  async joinFamily(@Headers('x-user-id') userId: string, @Body() body: { inviteCode: string }) {
    const realId = this.getRealUserId(userId);
    return this.familyService.joinFamily(realId, body.inviteCode);
  }

  /** DELETE /api/family/leave */
  @Delete('leave')
  async leaveFamily(@Headers('x-user-id') userId: string) {
    const realId = this.getRealUserId(userId);
    return this.familyService.leaveFamily(realId);
  }

  /** GET /api/family/data — merged financial data for all group members */
  @Get('data')
  async getFamilyData(@Headers('x-user-id') userId: string) {
    const realId = this.getRealUserId(userId);
    return this.familyService.getFamilyData(realId);
  }

  /** PUT /api/family/rename — { name: string } */
  @Post('rename')
  async renameFamily(@Headers('x-user-id') userId: string, @Body() body: { name: string }) {
    const realId = this.getRealUserId(userId);
    return this.familyService.renameFamily(realId, body.name);
  }
}
