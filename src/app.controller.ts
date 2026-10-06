import { Controller, Get } from '@nestjs/common';
import { Publico } from './auth/decoradores/publico.decorator';

// @Publico() sobre la CLASE: todas sus rutas quedan abiertas.
@Publico()
@Controller()
export class AppController {
  @Get()
  raiz() {
    return { nombre: 'API del Gimnasio', docs: '/docs' };
  }
}
