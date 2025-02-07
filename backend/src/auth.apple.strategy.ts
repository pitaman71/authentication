// backend/src/auth.apple.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
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

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: any
  ) {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name?.firstName && profile.name?.lastName 
        ? `${profile.name.firstName} ${profile.name.lastName}`
        : undefined
    };
  }
}