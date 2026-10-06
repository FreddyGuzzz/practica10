import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module'; // NUEVO: registro, login y la estrategia JWT
import { ClasesModule } from './clases/clases.module';
import { HorariosModule } from './horarios/horarios.module';
import { InscripcionesModule } from './inscripciones/inscripciones.module';
import { PeticionIdMiddleware } from './comun/middleware/peticion-id.middleware';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ClasesModule,
    HorariosModule,
    InscripcionesModule,
  ],
  controllers: [AppController],
})
// Un middleware NO va en providers: se registra implementando
// NestModule y su metodo configure().
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PeticionIdMiddleware) // que middleware
      .forRoutes('*'); // en que rutas: '*' = todas
  }
}
