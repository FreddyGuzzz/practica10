import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { Roles } from '../auth/decoradores/roles.decorator';
import { Rol, type PayloadJwt } from '../auth/dominio/usuario';
import { CrearInscripcionDto, aInscripcionDto } from './dto/inscripcion.dto';
import { InscripcionesService } from './inscripciones.service';

@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly servicio: InscripcionesService) {}

  // Protegida (sin @Publico): sin token responde 401.
  @Get()
  async listar() {
    return (await this.servicio.listar()).map(aInscripcionDto);
  }

  @Get(':id')
  async buscar(@Param('id', ParseIntPipe) id: number) {
    return aInscripcionDto(await this.servicio.buscar(id));
  }

  // Se borro el try/catch con los cuatro instanceof y los imports de los
  // errores. Si el Service lanza CupoLlenoError, el error sale de aqui y
  // el filtro lo convierte en 409.
  @Post()
  @HttpCode(201)
  async crear(
    @Body() dto: CrearInscripcionDto,
    @UsuarioActual() usuario: PayloadJwt, // NUEVO: quien viene en el token
    @Res({ passthrough: true }) res: Response,
  ) {
    // Quien eres lo dice el TOKEN, no el cuerpo.
    // Un miembro solo puede inscribirse a si mismo...
    if (usuario.rol === Rol.miembro && usuario.miembroId !== dto.miembroId) {
      // ...si intenta inscribir a otro: 403 (se quien eres y no puedes).
      throw new ForbiddenException('Solo puedes inscribirte a ti mismo');
    }
    // El entrenador y el admin si pueden inscribir a cualquiera.
    const inscripcion = await this.servicio.crear(dto); // si falla, lanza y sale
    res.setHeader('Location', `/inscripciones/${inscripcion.id}`); // 201 + donde quedo
    return aInscripcionDto(inscripcion); // nunca la entidad, el DTO
  }

  // TAREA (Roles): solo entrenador y admin cancelan.
  // Sin token -> 401 (JwtAuthGuard), miembro -> 403 (RolesGuard), entrenador -> 200.
  @Delete(':id')
  @Roles(Rol.entrenador, Rol.admin)
  @HttpCode(200)
  async cancelar(@Param('id', ParseIntPipe) id: number) {
    return aInscripcionDto(await this.servicio.cancelar(id));
  }
}
