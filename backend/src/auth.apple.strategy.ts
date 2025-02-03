// backend/src/auth.apple.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor() {
    super({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION,
      callbackURL: process.env.APPLE_CALLBACK_URL,
      scope: ['email', 'name'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name
    };
  }
}
