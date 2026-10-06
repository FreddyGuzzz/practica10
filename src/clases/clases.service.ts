import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClasesService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.clase.findMany({ orderBy: { id: 'asc' } });
  }

  async buscar(id: number) {
    const clase = await this.prisma.clase.findUnique({ where: { id } });
    if (!clase) throw new NotFoundException(`No existe la clase ${id}`);
    return clase;
  }
}
