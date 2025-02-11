// backend/src/auth.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { authConfig, AuthConfigType, AUTH_CONFIG_KEY, AuthConfigValidator } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AppleStrategy } from './auth.apple.strategy';
import { GoogleStrategy } from './auth.google.strategy';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const config = configService.get<AuthConfigType>(AUTH_CONFIG_KEY);
        if(config === undefined) console.error('auth.module is not configured');
        else console.log(`In auth.module.ts, available keys are ${Object.keys(config)}`)
        return {
          secret: config?.JWT_SECRET,
          signOptions: { expiresIn: config?.JWT_EXPIRES_IN }
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthConfigValidator,
    AuthService, 
    AppleStrategy, 
    GoogleStrategy
  ],
  exports: [AuthService, JwtModule],
})

export class AuthModule {}