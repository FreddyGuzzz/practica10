import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HorariosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.horario.findMany({ orderBy: { id: 'asc' } });
  }

  async buscar(id: number) {
    const horario = await this.prisma.horario.findUnique({ where: { id } });
    if (!horario) throw new NotFoundException(`No existe el horario ${id}`);
    return horario;
  }
}
