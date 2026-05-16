import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

// Session-based auth guard for admin panel.
// Checks session.adminUser exists with role='admin'.
// Throws UnauthorizedException which the HttpExceptionFilter catches
// and redirects to /admin/login for admin routes.
@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const session = (request as any).session;

    if (session?.adminUser && session.adminUser.role === 'admin') {
      return true;
    }

    throw new UnauthorizedException('Admin login required');
  }
}
