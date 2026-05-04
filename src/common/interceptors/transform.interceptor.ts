import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// This interceptor wraps every successful response in the standard format:
// { success: true, message: "Success", data: <whatever the handler returned> }
//
// Without this, every controller method would need to manually return
// { success: true, message: "...", data: result } — repetitive and error-prone.
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: 'Success',
        data: data ?? null,
      })),
    );
  }
}
