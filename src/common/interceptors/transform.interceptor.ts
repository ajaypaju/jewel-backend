import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Wraps every successful JSON API response in { success, message, data }.
// Admin routes that use @Render() return HTML — those are skipped.
// Detection: if the request path starts with /admin, don't wrap.
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const path: string = request.url || '';

    // Skip wrapping for admin routes (EJS renders HTML, not JSON)
    if (path.startsWith('/admin')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: 'Success',
        data: data ?? null,
      })),
    );
  }
}
