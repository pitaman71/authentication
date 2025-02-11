// backend/src/auth.controller.ts
import { Controller, Get, Post, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AUTH_CONFIG_KEY, AuthConfigType } from './auth.config';

// backend/src/auth.controller.ts

@Controller('auth')
export class AuthController {
  clientUrl: string;
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const config = configService.get<AuthConfigType>(AUTH_CONFIG_KEY);
    this.clientUrl = config?.CLIENT_URL!;
  }

  @Get('google/authorize')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport handles the redirect
    console.log(`GOOGLE AUTHORIZE`);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    console.log(`GOOGLE AUTH CALLBACK`);
    const tokens = await this.authService.validateOAuthLogin(req.user, 'google');
    return this.handleOAuthCallback(res, tokens);
  }

  @Get('apple/authorize')
  @UseGuards(AuthGuard('apple'))
  appleAuth(@Res() res: Response) {
    console.log(`APPLE AUTHORIZE`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Passport handles the redirect
  }

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleAuthCallback(@Req() req: any, @Res() res: Response) {
    console.log(`APPLE AUTH CALLBACK`);
    const tokens = await this.authService.validateOAuthLogin(req.user, 'apple');
    return this.handleOAuthCallback(res, tokens);
  }

  @Post('refresh')
  async refresh(@Req() req: { body: { refreshToken: string } }) {
    return this.authService.refreshToken(req.body.refreshToken);
  }

  private handleOAuthCallback(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const queryParams = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }).toString();
    
    res.redirect(`${this.clientUrl}?${queryParams}`);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))  // Ensure the request has a valid JWT
  async logout(@Req() req: any) {
    const userId = req.user.id;  // Get user ID from the JWT payload
    await this.authService.logout(userId);
    return { message: 'Successfully logged out' };
  }
}