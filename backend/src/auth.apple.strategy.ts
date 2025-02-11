// backend/src/auth.apple.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import { AUTH_CONFIG_KEY, AuthConfigType } from './auth.config';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private configService: ConfigService) {
    const config = configService.getOrThrow<AuthConfigType>(AUTH_CONFIG_KEY);
    const privateKeyString = !config.APPLE_PRIVATE_KEY_BASE64 
    ? undefined 
    : Buffer.from(config.APPLE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');

    const actual = {
      clientID: config.APPLE_CLIENT_ID,
      teamID: config.APPLE_TEAM_ID,
      keyID: config.APPLE_KEY_ID,
      privateKeyLocation: config.APPLE_PRIVATE_KEY_LOCATION,
      privateKeyString,
      callbackURL: config.APPLE_CALLBACK_URL,
      scope: ['email', 'name'],
    };
    console.log('Initializing AppleStrategy with config:', actual);
            
    super(actual);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: any,
    done: (err: any, user: any) => void
  ) {
    try {
      done(null, {
        id: profile.id,
        email: profile.email,
        name: profile.name?.firstName && profile.name?.lastName 
          ? `${profile.name.firstName} ${profile.name.lastName}`
          : undefined
      });
    } catch(error) { done(error, false) }
  }
}