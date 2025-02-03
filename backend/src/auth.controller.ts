// backend/src/auth.controller.ts
import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: { user: any }) {
    return this.authService.validateOAuthLogin(req.user, 'google');
  }

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  async appleAuth() {}

  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleAuthCallback(@Req() req: { user: any }) {
    return this.authService.validateOAuthLogin(req.user, 'apple');
  }

  @Post('refresh')
  async refresh(@Req() req: { body: { refresh_token: string } }) {
    return this.authService.refreshToken(req.body.refresh_token);
  }
}

