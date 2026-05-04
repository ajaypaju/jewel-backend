import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

// @Catch(HttpException) tells NestJS: "When any HttpException is thrown,
// run this filter instead of the default error handler."
//
// This formats all errors as: { success: false, message: "...", data: null }
// matching the same shape as successful responses.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // NestJS validation errors return an object with a `message` array.
    // e.g. { message: ["name must be longer than 2 characters"], error: "Bad Request" }
    // We join them into a single string for a cleaner response.
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
