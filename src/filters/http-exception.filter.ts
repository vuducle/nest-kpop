import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter that catches and formats all HTTP exceptions.
 *
 * Provides consistent error response structure with status code, timestamp,
 * request path, method, and error message for better API debugging.
 *
 * @example
 * ```typescript
 * // Applied globally in main.ts
 * app.useGlobalFilters(new HttpExceptionFilter());
 * ```
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * Catches HTTP exceptions and formats them into standardized error responses.
   *
   * @param exception - The exception that was thrown
   * @param host - Arguments host containing request/response context
   */
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    console.error('Exception caught by filter:', exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || 'Internal server error',
    };

    response.status(status).json(errorResponse);
  }
}
