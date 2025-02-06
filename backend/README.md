# Authentication Service Backend

NestJS backend implementation for Google and Apple OAuth authentication.

## Installation

```bash
npm install @nestjs/passport @nestjs/jwt @nestjs/config
npm install passport passport-google-oauth20 passport-apple
npm install joi
```

## Setting Up Developer Accounts

### Apple Developer Console Setup
1. Sign in to developer.apple.com
2. Register App ID:
   - Go to Certificates, IDs & Profiles > Identifiers
   - Click [+] > App IDs > App
   - Enter description and Bundle ID (e.g., com.yourcompany.app)
   - Enable "Sign In with Apple"
   - Save

3. Create Services ID:
   - Return to Identifiers
   - Click [+] > Services IDs
   - Enter identifier (e.g., com.yourcompany.app.service)
   - Enable "Sign In with Apple"
   - Configure domains and return URLs
   - Save

4. Generate Private Key:
   - Go to Keys section
   - Click [+]
   - Name your key
   - Enable "Sign In with Apple"
   - Register and download .p8 file
   - Note the Key ID

### Google Cloud Console Setup
1. Go to console.cloud.google.com
2. Create new project or select existing one
3. Enable OAuth API:
   - Go to APIs & Services > OAuth consent screen
   - Choose User Type (External/Internal)
   - Fill required app information
   - Add scopes for 'email' and 'profile'
   - Add test users if in testing mode

4. Create OAuth Credentials:
   - Go to APIs & Services > Credentials
   - Click Create Credentials > OAuth client ID
   - Choose Web application
   - Add authorized redirect URIs (e.g., http://localhost:3000/auth/google/callback)
   - Save and note Client ID and Client Secret

## JWT Secrets

You should rotate JWT secrets every:
- Access token secrets: 3-6 months
- Refresh token secrets: Monthly

Key considerations:
- Longer periods increase risk if compromised
- Need grace period during rotation for valid existing tokens
- Must invalidate all tokens when rotating for security incidents

For rotation, implement versioned keys and gradual migration to minimize user impact.

Use OpenSSL to generate a secure random 64-byte base64 string:

```bash
openssl rand -base64 64 | tr -d '\n'
```

This creates cryptographically secure values suitable for JWT secrets.

## Environment Variables

Create a `.env` file in the root directory of your project. Below is a detailed explanation of each required environment variable:

### JWT Configuration
- `JWT_SECRET`: A secure string used to sign and verify JSON Web Tokens. Use a strong, randomly generated value at least 32 characters long.
- `JWT_EXPIRES_IN`: Duration until the access token expires (e.g., '1h', '30m'). Default: 1 hour
- `REFRESH_EXPIRES_IN`: Duration until the refresh token expires (e.g., '7d', '30d'). Default: 7 days

### Google OAuth Configuration
- `GOOGLE_CLIENT_ID`: OAuth 2.0 client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 client secret from Google Cloud Console
- `GOOGLE_CALLBACK_URL`: URL where Google will redirect after authentication
  - Format: `http://your-domain/auth/google/callback`
  - For local development: `http://localhost:3000/auth/google/callback`

### Apple Sign In Configuration
- `APPLE_CLIENT_ID`: Your App ID/Services ID from Apple Developer portal
- `APPLE_TEAM_ID`: Your 10-character Team ID from Apple Developer account
- `APPLE_KEY_ID`: The 10-character Key ID for your Sign in with Apple private key
- `APPLE_PRIVATE_KEY_LOCATION`: File path to your `.p8` private key file
  - Example: `./config/AuthKey_XXXXXXXXXX.p8`
- `APPLE_CALLBACK_URL`: URL where Apple will redirect after authentication
  - Format: `http://your-domain/auth/apple/callback`
  - For local development: `http://localhost:3000/auth/apple/callback`


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
import { AuthModule, authConfigSchema } from '@pitaman71/auth-nestjs';

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