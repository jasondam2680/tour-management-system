import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' ? (res as any).message : res as string;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status  = HttpStatus.CONFLICT;
        message = `Duplicate: ${(exception.meta?.target as string[])?.join(', ')}`;
      } else if (exception.code === 'P2025') {
        status  = HttpStatus.NOT_FOUND;
        message = 'Record not found';
      } else {
        status  = HttpStatus.BAD_REQUEST;
        message = 'Database error';
      }
    }

    this.logger.error(`${request.method} ${request.url} ${status} — ${message}`);

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
