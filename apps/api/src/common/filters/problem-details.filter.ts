import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'Ocurrió un error interno en el servidor.';
    let type = 'https://pricescope.internal/errors/internal-server-error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        title = obj.title || exception.name || 'Error en la petición';
        detail = Array.isArray(obj.message)
          ? obj.message.join('; ')
          : obj.detail || obj.message || exception.message;
        type = obj.type || `https://pricescope.internal/errors/http-${status}`;
      } else if (typeof res === 'string') {
        detail = res;
        title = exception.name;
        type = `https://pricescope.internal/errors/http-${status}`;
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
    }

    const problemDetails = {
      type,
      title,
      status,
      detail,
      instance: request.originalUrl || request.url,
      timestamp_utc: new Date().toISOString(),
    };

    response.status(status).json(problemDetails);
  }
}
