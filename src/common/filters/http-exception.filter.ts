import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import * as express from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<express.Response>();
    const request = ctx.getRequest<express.Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const isAdminRoute = request.url.startsWith('/admin');

    if (isAdminRoute) {
      // 401 on admin routes = redirect to login
      if (status === 401) {
        response.redirect('/admin/login');
        return;
      }

      // Other errors on admin routes: redirect back with flash message
      let message: string;
      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const msg = (exceptionResponse as Record<string, unknown>).message;
        message = Array.isArray(msg) ? msg.join('; ') : String(msg);
      } else {
        message = exception.message;
      }

      const session = (request as any).session;
      if (session) {
        session.flash = { type: 'error', message };
      }

      const referer = request.headers.referer || '/admin';
      response.redirect(referer);
      return;
    }

    // API routes: JSON error response
    let message: string;
    if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      const msg = (exceptionResponse as Record<string, unknown>).message;
      message = Array.isArray(msg) ? msg.join('; ') : String(msg);
    } else {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
    });
  }
}
