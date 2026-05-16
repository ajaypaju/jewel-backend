import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// AuthGuard('jwt') tells Passport to use the 'jwt' strategy (JwtStrategy)
// to validate the request. If the token is missing or invalid, it throws 401.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
