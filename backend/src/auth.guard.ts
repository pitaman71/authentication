// backend/src/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    
    if (!token) {
      console.error(`Request failed, no token present ${request.url}`);
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Attach the user payload to the request object
      request['user'] = payload;
      return true;
    } catch(err) {
      console.error(`Request failed, JWT verification failed ${request.url} ${err}`);
      throw new UnauthorizedException();
    }
  }

  private extractToken(request: any): string | undefined {
    // First try to extract from Authorization header
    const [type, headerToken] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') {
      return headerToken;
    } else if (type) {
      console.error(`Request contains unexpected authorization type ${type}`);
    }

    // If no valid header token, try query parameter
    const queryToken = request.query.accessToken;
    if (queryToken) {
      return queryToken;
    }

    return undefined;
  }
}