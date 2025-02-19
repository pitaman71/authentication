// backend/src/auth.google.strategy.ts
// backend/src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AUTH_CONFIG_KEY, AuthConfigType } from './auth.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const config = configService.get<AuthConfigType>(AUTH_CONFIG_KEY);
    super({
      clientID: config?.GOOGLE_CLIENT_ID,
      clientSecret: config?.GOOGLE_CLIENT_SECRET,
      callbackURL: config?.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any) => void
  ) {
    try {
      done(null, {
        id: profile.id,
        email: profile.emails && profile.emails[0].value,
        name: profile.displayName
      });
    } catch(error) { done(error, false) }
  }
}