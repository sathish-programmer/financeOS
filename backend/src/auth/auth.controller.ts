import { Controller, Post, Delete, Body, Headers, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; passwordHash: string; name: string }) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; passwordHash: string }) {
    return this.authService.login(body);
  }

  @Post('profile')
  async updateProfile(
    @Headers('x-user-id') userId: string,
    @Body() body: { name?: string; email?: string; passwordHash?: string }
  ) {
    if (!userId) throw new BadRequestException('x-user-id header is required');
    const realId = this.getRealUserId(userId);
    return this.authService.updateProfile(realId, body);
  }

  @Delete('delete')
  async deleteAccount(@Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('x-user-id header is required');
    const realId = this.getRealUserId(userId);
    return this.authService.deleteAccount(realId);
  }

  private getRealUserId(userId: string): string {
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
}
