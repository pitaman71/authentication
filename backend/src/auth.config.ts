// backend/src/auth.config.ts
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { Module, Injectable, OnModuleInit } from '@nestjs/common';
import { registerAs, ConfigService, ConfigType } from '@nestjs/config';
import { z } from 'zod';
import _ from 'lodash';

export const AUTH_CONFIG_KEY = 'auth';

export const authConfigSchema = z.object({
  CLIENT_URL: z.string().url().default('https://localhost:3000'),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1h'),
  REFRESH_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string().url(),
  APPLE_CLIENT_ID: z.string(),
  APPLE_TEAM_ID: z.string(),
  APPLE_KEY_ID: z.string(),
  APPLE_PRIVATE_KEY_LOCATION: z.string().optional(),
  APPLE_PRIVATE_KEY_BASE64: z.string().optional(),
  APPLE_CALLBACK_URL: z.string().url(),
}).refine(
  (data) => {
    const hasLocation = !!data.APPLE_PRIVATE_KEY_LOCATION;
    const hasBase64 = !!data.APPLE_PRIVATE_KEY_BASE64;
    return (hasLocation || hasBase64) && !(hasLocation && hasBase64);
  },
  {
    message: "Either APPLE_PRIVATE_KEY_LOCATION or APPLE_PRIVATE_KEY_BASE64 must be set, but not both"
  }
);

// Extract the TypeScript type from the schema
export type AuthConfig = z.infer<typeof authConfigSchema>;

export const authConfig = registerAs(AUTH_CONFIG_KEY, (): AuthConfig => {
  console.log('Auth config starting to load...');
  const appConfig = _.merge(
    process.env.APP_CONFIG ? JSON.parse(process.env.APP_CONFIG) : {}, 
    process.env
  );
  console.log('Auth config merged:', {
    hasAppConfig: !!process.env.APP_CONFIG,
    envKeys: Object.keys(process.env).filter(k => k.startsWith('JWT_') || k.startsWith('GOOGLE_') || k.startsWith('APPLE_')),
    mergedKeys: Object.keys(appConfig).filter(k => k.startsWith('JWT_') || k.startsWith('GOOGLE_') || k.startsWith('APPLE_'))
  });
  
  // Zod's parse will throw if validation fails
  return authConfigSchema.parse(appConfig);
});

export type AuthConfigType = ConfigType<typeof authConfig>;

@Injectable()
export class AuthConfigValidator implements OnModuleInit {
  constructor(private configService: ConfigService) {}
  
  onModuleInit() {
    const appConfig = _.merge(
      process.env.APP_CONFIG ? JSON.parse(process.env.APP_CONFIG) : {}, 
      process.env
    );

    try {
      // Zod's parse will throw if validation fails
      authConfigSchema.parse(appConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Auth config validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }
}