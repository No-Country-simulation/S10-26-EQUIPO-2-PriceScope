import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para comunicación con el frontend (localhost:3000)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configura el prefijo global de la API
  app.setGlobalPrefix('api/v1');

  // Filtro global RFC 7807 (Problem Details)
  app.useGlobalFilters(new ProblemDetailsFilter());

  // Habilita la validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Usa el puerto de la variable de entorno o 3001 por defecto (según el README)
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Aplicación corriendo en el puerto: ${port}`);
}
void bootstrap();