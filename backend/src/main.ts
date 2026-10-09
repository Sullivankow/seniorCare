import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Point d'entrée de l'API.
 * - Préfixe global /api
 * - Validation automatique des DTO (class-validator)
 * - Documentation Swagger sur http://localhost:3000/docs
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors(); // Autorise l'app mobile (à restreindre en production)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non déclarés dans les DTO
      transform: true, // convertit les types (ex: "10" -> 10)
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SeniorCare API')
    .setDescription(
      "API de suivi des seniors : pointage quotidien « tout va bien », alertes d'urgence et temps réel (Socket.IO, namespace /realtime).",
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = Number(process.env.PORT) || 3000;
  // 0.0.0.0 : indispensable pour que le téléphone (Expo Go) puisse joindre l'API sur le réseau local
  await app.listen(port, '0.0.0.0');
  console.log(`API prête      : http://localhost:${port}/api`);
  console.log(`Swagger        : http://localhost:${port}/docs`);
}
bootstrap();
