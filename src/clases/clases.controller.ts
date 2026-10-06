import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Publico } from '../auth/decoradores/publico.decorator';
import { ClasesService } from './clases.service';

@Controller('clases')
export class ClasesController {
  constructor(private readonly servicio: ClasesService) {}

  @Publico() // el catalogo lo ve cualquiera, sin cuenta
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
