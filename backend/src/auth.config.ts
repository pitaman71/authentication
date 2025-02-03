// backend/src/auth.config.ts
import { registerAs, ConfigType } from '@nestjs/config';
import * as Joi from 'joi';

export const AUTH_CONFIG_KEY = 'auth';

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshExpiresIn: string;
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  apple: {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKeyLocation: string;
    callbackUrl: string;
  };
}

export const authConfigSchema = Joi.object({
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
  APPLE_CLIENT_ID: Joi.string().required(),
  APPLE_TEAM_ID: Joi.string().required(),
  APPLE_KEY_ID: Joi.string().required(),
  APPLE_PRIVATE_KEY_LOCATION: Joi.string().required(),
  APPLE_CALLBACK_URL: Joi.string().uri().required(),
});

export const authConfig = registerAs(AUTH_CONFIG_KEY, (): AuthConfig => ({
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || '7d',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL!,
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID!,
    teamId: process.env.APPLE_TEAM_ID!,
    keyId: process.env.APPLE_KEY_ID!,
    privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION!,
    callbackUrl: process.env.APPLE_CALLBACK_URL!,
  },
}));

export type AuthConfigType = ConfigType<typeof authConfig>;