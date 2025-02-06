// backend/src/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class GoogleAuthStrategy extends PassportStrategy(GoogleStrategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName
    };
  }
}

@Injectable()
export class AppleAuthStrategy extends PassportStrategy(AppleStrategy, 'apple') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('APPLE_CLIENT_ID'),
      teamID: configService.get('APPLE_TEAM_ID'),
      keyID: configService.get('APPLE_KEY_ID'),
      privateKeyLocation: configService.get('APPLE_PRIVATE_KEY_LOCATION'),
      callbackURL: configService.get('APPLE_CALLBACK_URL'),
      scope: ['email', 'name'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name
    };
  }
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateOAuthLogin(profile: any, provider: string) {
    const payload = {
      id: profile.id,
      email: provider === 'google' ? profile.emails[0].value : profile.email,
      name: provider === 'google' ? profile.displayName : profile.name,
      provider
    };
    
    return this.generateTokens(payload);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      return this.generateTokens(payload);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(payload: any) {
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '1h' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}