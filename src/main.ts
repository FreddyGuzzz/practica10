// Carga el .env ANTES que cualquier otra cosa: Nest no lo hace solo, y
// auth.module.ts lee process.env.JWT_SECRET al importarse.
import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DominioExceptionFilter } from './comun/filtros/dominio.filter';
import { LoggingInterceptor } from './comun/interceptores/logging.interceptor';
import { SobreInterceptor } from './comun/interceptores/sobre.interceptor';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Practica 9: valida los DTO. whitelist quita campos que no estan en el DTO.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Parte 1, paso 1: traduce los errores de dominio a HTTP en un solo lugar.
  app.useGlobalFilters(new DominioExceptionFilter());

  // Parte 1, pasos 3 y 4: primero mide el tiempo, despues envuelve en { data, meta }.
  app.useGlobalInterceptors(new LoggingInterceptor(), new SobreInterceptor());

  // Parte 2, paso 4 + Tarea: TODAS las rutas piden token (salvo @Publico())
  // y despues se revisa el rol (solo donde haya @Roles()). El orden importa:
  // el de JWT va primero porque es el que deja req.user para el de roles.
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  // Parte 1, paso 5: le dice al NAVEGADOR que origenes pueden leer las respuestas.
  app.enableCors({
    origin: ['http://localhost:5173'], // el puerto de Vite (React, Unidad III)
    exposedHeaders: ['Location', 'X-Request-Id'], // encabezados que el front puede leer
  });

  // Parte 2, paso 6: documentacion OpenAPI en /docs
  const config = new DocumentBuilder()
    .setTitle('API del Gimnasio') // titulo que sale arriba de /docs
    .setVersion('1.0')
    .addBearerAuth() // agrega el boton Authorize
    .addSecurityRequirements('bearer') // pone el candado en todas las rutas
    .build();
  const documento = SwaggerModule.createDocument(app, config); // recorre controllers y DTO
  SwaggerModule.setup('docs', app, documento); // lo publica en /docs

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
