import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('LockIn Backend API')
    .setDescription('Study Commitment and Invitation Management API')
    .setVersion('1.0.0')
    .addTag('Commitments', 'Create, list, retrieve and update study commitments.')
    .addTag('Invitations', 'Invite friends and accept or decline pending invitations.')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: '/api/docs-json',
    swaggerOptions: { tryItOutEnabled: true, persistAuthorization: false },
  });

  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }
  await app.listen(port, '0.0.0.0');
  Logger.log(`Swagger: ${await app.getUrl()}/api/docs`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
