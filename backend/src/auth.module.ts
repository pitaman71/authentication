// backend/src/auth.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { authConfig, AuthConfigType } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './auth.google.strategy';
import { AppleStrategy } from './auth.apple.strategy';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: async (config: AuthConfigType) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresIn }
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, AppleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
