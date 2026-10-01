import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';
import { DecimalInterceptor } from './common/interceptors/decimal.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não declarados nos DTOs
      forbidNonWhitelisted: true, // e rejeita a requisição se vierem
      transform: true, // converte o payload para as classes DTO
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalInterceptors(new DecimalInterceptor());

  const origens = config.get<string[]>('CORS_ORIGINS') ?? [];
  app.enableCors({ origin: origens.length > 0 ? origens : true });
  app.enableShutdownHooks();

  const porta = config.get<number>('PORT') ?? 3000;
  await app.listen(porta);
  Logger.log(`API disponível em http://localhost:${porta}/api`, 'Bootstrap');
}
await bootstrap();
