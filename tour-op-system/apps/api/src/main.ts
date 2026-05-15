import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app    = await NestFactory.create(AppModule);
  const cfg    = app.get(ConfigService);
  const port   = cfg.get('app.port', 3001);
  const env    = cfg.get('app.nodeEnv', 'development');

  app.use(helmet());
  app.enableCors({
    origin: cfg.get('app.frontendUrl'),
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (env !== 'production') {
    const doc = new DocumentBuilder()
      .setTitle('Tour OP System API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc), {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 API running: http://localhost:${port}/api/v1`);
}

bootstrap();
