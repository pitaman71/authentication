// backend/src/auth.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { authConfig, AuthConfigType } from './auth.config';
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
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') }
      }),
        }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AppleStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
