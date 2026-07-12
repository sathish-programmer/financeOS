import { Controller, Post, Body } from '@nestjs/common';
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
}
