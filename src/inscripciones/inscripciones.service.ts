// Reglas del gimnasio. Lanza errores de DOMINIO; el filtro los traduce a HTTP.
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Inscripcion } from './dominio/inscripcion';
import {
  CupoLlenoError,
  HorarioNoEncontradoError,
  InscripcionDuplicadaError,
  MiembroNoEncontradoError,
} from './dominio/errores';
import { CrearInscripcionDto } from './dto/inscripcion.dto';

@Injectable()
export class InscripcionesService {
  constructor(private readonly prisma: PrismaService) {}

  listar(): Promise<Inscripcion[]> {
    return this.prisma.inscripcion.findMany({ orderBy: { id: 'asc' } });
  }

  async buscar(id: number): Promise<Inscripcion> {
    const fila = await this.prisma.inscripcion.findUnique({ where: { id } });
    if (!fila) throw new NotFoundException(`No existe la inscripcion ${id}`);
    return fila;
  }

  async crear(dto: CrearInscripcionDto): Promise<Inscripcion> {
    // 1. El miembro debe existir (404 si no).
    const miembro = await this.prisma.miembro.findUnique({ where: { id: dto.miembroId } });
    if (!miembro) throw new MiembroNoEncontradoError(dto.miembroId);

    // 2. El horario debe existir; de paso se cuentan sus inscritos.
    const horario = await this.prisma.horario.findUnique({
      where: { id: dto.horarioId },
      include: { _count: { select: { inscripciones: true } } },
    });
    if (!horario) throw new HorarioNoEncontradoError(dto.horarioId);

    // 3. No inscribirse dos veces al mismo horario (409).
    const repetida = await this.prisma.inscripcion.findUnique({
      where: { miembroId_horarioId: { miembroId: dto.miembroId, horarioId: dto.horarioId } },
    });
    if (repetida) throw new InscripcionDuplicadaError(dto.miembroId, dto.horarioId);

    // 4. Debe haber cupo (409).
    if (horario._count.inscripciones >= horario.cupo) {
      throw new CupoLlenoError(dto.horarioId);
    }

    return this.prisma.inscripcion.create({
      data: { miembroId: dto.miembroId, horarioId: dto.horarioId },
    });
  }

  // Cancelar = borrar la inscripcion (libera el cupo).
  async cancelar(id: number): Promise<Inscripcion> {
    await this.buscar(id); // 404 si no existe
    return this.prisma.inscripcion.delete({ where: { id } });
  }
}
