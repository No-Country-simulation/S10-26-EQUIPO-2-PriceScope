import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface HttpExceptionResponsePayload {
  title?: string;
  detail?: string;
  message?: string | string[];
  type?: string;
  statusCode?: number;
  error?: string;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

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
        const obj = res as HttpExceptionResponsePayload;
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
      // Registra el error interno con traza completa en el log del servidor
      this.logger.error(`Error no controlado [${request.method} ${request.url}]: ${exception.message}`, exception.stack);
      // Blindaje de seguridad: no exponer detalles de errores internos (500) al cliente
      detail = 'Ocurrió un error interno en el servidor al procesar la solicitud.';
    } else {
      this.logger.error(`Error desconocido [${request.method} ${request.url}]: ${String(exception)}`);
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
