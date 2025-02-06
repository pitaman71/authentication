// backend/src/auth.controller.ts
import { Controller, Get, Post, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

// backend/src/auth.controller.ts

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google/authorize')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport handles the redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const tokens = await this.authService.validateOAuthLogin(req.user, 'google');
    return this.handleOAuthCallback(res, tokens);
  }

  @Get('apple/authorize')
  @UseGuards(AuthGuard('apple'))
  appleAuth(@Res() res: Response) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Passport handles the redirect
  }

  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleAuthCallback(@Req() req: any, @Res() res: Response) {
    const tokens = await this.authService.validateOAuthLogin(req.user, 'apple');
    return this.handleOAuthCallback(res, tokens);
  }

  @Post('refresh')
  async refresh(@Req() req: { body: { refreshToken: string } }) {
    return this.authService.refreshToken(req.body.refreshToken);
  }

  private handleOAuthCallback(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const clientUrl = this.configService.get('CLIENT_URL');
    res.redirect(`${clientUrl}?code=${tokens.accessToken}`);
  }
}