import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Publico } from '../auth/decoradores/publico.decorator';
import { HorariosService } from './horarios.service';

// Lo mismo que clases: el catalogo de horarios es publico.
@Controller('horarios')
export class HorariosController {
  constructor(private readonly servicio: HorariosService) {}

  @Publico()
  @Get()
  listar() {
    return this.servicio.listar();
  }

  @Publico()
  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.buscar(id);
  }
}
