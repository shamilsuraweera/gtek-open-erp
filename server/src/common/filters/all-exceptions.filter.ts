import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface NormalizedError {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const normalized = this.normalize(exception);

    if (normalized.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${normalized.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(normalized.statusCode).json({
      statusCode: normalized.statusCode,
      message: normalized.message,
      error: normalized.error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        return { statusCode: status, message: body, error: exception.name };
      }

      const { message, error } = body as { message?: string | string[]; error?: string };
      return {
        statusCode: status,
        message: message ?? exception.message,
        error: error ?? exception.name,
      };
    }

    if (exception instanceof QueryFailedError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'The request could not be completed due to a database constraint.',
        error: 'Bad Request',
      };
    }

    // Unknown/unexpected errors: never leak internal details to the client.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
