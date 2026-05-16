import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';

// JWT payload shape — what we encode into the token when signing
export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
}

// PassportStrategy(Strategy, 'jwt') registers this as the 'jwt' strategy.
// When AuthGuard('jwt') is used, Passport calls this strategy's validate() method.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    super({
      // Extract the token from the Authorization: Bearer <token> header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Don't accept expired tokens
      ignoreExpiration: false,
      // The secret used to verify the token signature
      secretOrKey: secret,
    });
  }

  // Called after Passport verifies the token signature and expiry.
  // The returned value is attached to request.user.
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    return user;
  }
}
