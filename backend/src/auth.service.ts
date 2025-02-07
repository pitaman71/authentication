// backend/src/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { PassportStrategy } from '@nestjs/passport';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateOAuthLogin(profile: UserProfile, provider: string): Promise<Tokens> {
    const payload = {
      sub: profile.id,  // Using 'sub' is JWT standard for subject identifier
      email: profile.email,
      name: profile.name,
      provider
    };
    
    return this.generateTokens(payload);
  }

  async refreshToken(refreshToken: string): Promise<Tokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET')
      });
      delete payload.exp; // Remove expiration from payload
      delete payload.iat; // Remove issued at from payload
      return this.generateTokens(payload);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(payload: any): Tokens {
    return {
      accessToken: this.jwtService.sign(payload, { 
        expiresIn: '1h',
        secret: this.configService.get('JWT_ACCESS_SECRET')
      }),
      refreshToken: this.jwtService.sign(payload, { 
        expiresIn: '7d',
        secret: this.configService.get('JWT_REFRESH_SECRET')
      }),
    };
  }
}