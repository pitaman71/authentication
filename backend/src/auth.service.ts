// backend/src/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AUTH_CONFIG_KEY, AuthConfigType } from './auth.config';

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
  config: {
    refresh: { secret: string; expiresIn: string },
    access: { secret: string; expiresIn: string }
  }
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const config = this.configService.get<AuthConfigType>(AUTH_CONFIG_KEY);
    if (!config) {
      throw new Error(`${AUTH_CONFIG_KEY} configuration not found`);
    }
    
    this.config = {
      refresh: {
        secret: config.JWT_SECRET,
        expiresIn: config.REFRESH_EXPIRES_IN,
      },
      access: {
        secret: config.JWT_SECRET,
        expiresIn: config.JWT_EXPIRES_IN
      }
    }
  }

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
      const payload = this.jwtService.verify(refreshToken, this.config.refresh);
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
        ...this.config.access
      }),
      refreshToken: this.jwtService.sign(payload, { 
        ...this.config.refresh
      }),
    };
  }

  async logout(userId: string): Promise<void> {
    // Since we're using stateless JWTs, there's no server-side state to clear
    // The client is responsible for removing the tokens
    
    // However, you could implement additional security measures here:
    // 1. Add the user's tokens to a blacklist
    // 2. Update last logout timestamp
    // 3. Emit logout events
    // 4. Add audit logging
    
    return;
  }  
}