import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Custom param decorator: extracts request.user (set by JwtAuthGuard/strategy).
// Usage: @CurrentUser() user: User — instead of @Req() req and req.user
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
