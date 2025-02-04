# Authentication Service Backend

NestJS backend implementation for Google and Apple OAuth authentication.

## Installation

```bash
npm install @nestjs/passport @nestjs/jwt @nestjs/config
npm install passport passport-google-oauth20 passport-apple
npm install joi
```

## Environment Variables

Create a `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Apple Sign In
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY_LOCATION=path/to/private/key
APPLE_CALLBACK_URL=http://localhost:3000/auth/apple/callback
```

## Module Structure

```
src/
├── auth.config.ts          # Configuration and validation
├── auth.module.ts          # Module definition and dependencies
├── auth.controller.ts      # HTTP endpoints
├── auth.service.ts         # Token generation and validation
├── auth.google.strategy.ts # Google OAuth implementation
└── auth.apple.strategy.ts  # Apple OAuth implementation
```

## Integration

Add AuthModule to your app.module.ts:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { authConfigSchema } from './auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: authConfigSchema,
    }),
    AuthModule,
  ],
})
export class AppModule {}
```

## API Endpoints

### Google OAuth

```
GET /auth/google
- Initiates Google OAuth flow
- No body required
- Redirects to Google

GET /auth/google/callback
- Handles Google OAuth callback
- Returns tokens on success
```

### Apple Sign In

```
GET /auth/apple
- Initiates Apple Sign In flow
- No body required
- Redirects to Apple

GET /auth/apple/callback
- Handles Apple Sign In callback
- Returns tokens on success
```

### Token Refresh

```
POST /auth/refresh
- Refreshes access token
- Body: { "refresh_token": "token" }
- Returns new access and refresh tokens
```

## Response Format

Successful authentication returns:

```json
{
  "access_token": "jwt-token",
  "refresh_token": "jwt-refresh-token"
}
```

## Token Payload Structure

```typescript
{
  id: string;      // User's ID from OAuth provider
  email: string;   // User's email
  provider: string; // "google" or "apple"
}
```

## OAuth Configuration

### Google OAuth Setup

1. Go to Google Cloud Console
2. Create a project
3. Enable OAuth 2.0
4. Create credentials
5. Configure OAuth consent screen
6. Add authorized redirect URIs
7. Copy Client ID and Secret to .env

### Apple Sign In Setup

1. Go to Apple Developer Console
2. Register your app
3. Configure Sign in with Apple
4. Generate private key
5. Note down:
   - Client ID
   - Team ID
   - Key ID
   - Private key location

## Security Considerations

1. JWT tokens expire:
   - Access tokens: 1 hour by default
   - Refresh tokens: 7 days
2. Environment variables are validated using Joi
3. Unauthorized requests throw UnauthorizedException
4. Passport strategies configured with appropriate scopes
5. No sensitive data stored, only JWTs

## Example Usage

### Protected Routes

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('protected')
export class ProtectedController {
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getProtectedResource() {
    return { message: 'This is protected' };
  }
}
```

### Access Current User

```typescript
import { Controller, Get, Req } from '@nestjs/common';

@Controller('user')
export class UserController {
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req) {
    // req.user contains the decoded JWT payload
    return req.user;
  }
}
```

## Testing

To run tests:

```bash
npm test
```

You'll need to mock:
1. JwtService for token generation
2. OAuth providers for strategy testing
3. ConfigService for environment variables

Test example:

```typescript
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should validate OAuth login', async () => {
    const profile = {
      id: '123',
      email: 'test@example.com',
    };

    await service.validateOAuthLogin(profile, 'google');
    expect(jwtService.sign).toHaveBeenCalled();
  });
});
```

## Known Limitations

1. No token revocation mechanism
2. Refresh token expiration is hardcoded
3. Limited error handling
4. No rate limiting
5. No user persistence

## Future Improvements

1. Implement token blacklisting
2. Add rate limiting
3. Enhance error handling
4. Add user database
5. Add email verification
6. Add session management
7. Add audit logging

## Troubleshooting

1. Token verification fails
   - Check JWT_SECRET matches between generation and verification
   - Verify token hasn't expired
   - Check token format

2. OAuth flow fails
   - Verify callback URLs match exactly
   - Check client IDs and secrets
   - Verify OAuth consent screen configuration

3. Apple Sign In issues
   - Verify private key is readable
   - Check team ID and key ID
   - Verify Apple developer account status

## Support

For issues and feature requests, please file an issue on the repository.