import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// El cliente de Prisma convertido en un provider de Nest.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect(); // abre la conexion a MySQL al arrancar
  }
  async onModuleDestroy() {
    await this.$disconnect(); // la cierra al apagar
  }
}
