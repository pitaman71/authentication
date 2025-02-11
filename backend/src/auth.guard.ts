// backend/src/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      console.error(`Request failed, no token present ${request.url}`)
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Attach the user payload to the request object
      request['user'] = payload;
      return true;
    } catch(err) {
      console.error(`Request failed, JWT verification failed ${request.url} ${err}`)
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if(type !== 'Bearer') {
      console.error(`Request will fail with unexpected authorization type ${type}`)
    }
    return type === 'Bearer' ? token : undefined;
  }
}

