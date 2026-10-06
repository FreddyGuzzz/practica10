// NUEVO (Paso 1.2): traduce los errores de dominio a HTTP en UN solo
// lugar. Sustituye al try/catch que habia en el controller.
// Ojo con el nombre: no es el Filter de Java (ese corre primero).
// Este corre AL FINAL y solo si algo lanzo un error. En Spring es
// @ControllerAdvice.
import {
  ArgumentsHost, // da acceso a la peticion y a la respuesta
  Catch, // decorador: dice que errores atrapa este filtro
  ExceptionFilter, // la interfaz que obliga a tener el metodo catch()
  HttpStatus, // constantes con los codigos: NOT_FOUND = 404, etc.
  Logger, // el logger de Nest, para escribir en la consola
} from '@nestjs/common';
import { Response } from 'express';
import {
  CupoLlenoError,
  ErrorDeDominio,
  HorarioNoEncontradoError,
  InscripcionDuplicadaError,
  MiembroNoEncontradoError,
} from '../../inscripciones/dominio/errores';

// Atrapa ErrorDeDominio y TODAS sus hijas. Los demas errores (un 400 del
// ValidationPipe, un NotFoundException) siguen su camino normal.
@Catch(ErrorDeDominio)
export class DominioExceptionFilter implements ExceptionFilter {
  // Todo lo que escriba sale en la consola con la etiqueta [Dominio].
  private readonly logger = new Logger('Dominio');

  // Decide el codigo HTTP segun el tipo de error.
  private codigoPara(error: ErrorDeDominio): number {
    // Lo que no existe -> 404
    if (
      error instanceof HorarioNoEncontradoError ||
      error instanceof MiembroNoEncontradoError
    ) {
      return HttpStatus.NOT_FOUND;
    }
    // Las reglas del gimnasio -> 409 (la peticion esta bien, pero choca
    // con el estado actual)
    if (error instanceof CupoLlenoError || error instanceof InscripcionDuplicadaError) {
      return HttpStatus.CONFLICT;
    }
    // Un error de dominio que olvidamos mapear -> 500, para que se note.
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  // Nest llama a este metodo cuando alguien lanza un ErrorDeDominio.
  catch(error: ErrorDeDominio, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); // estamos en HTTP (no WebSockets)
    const res = ctx.getResponse<Response>(); // la respuesta de Express
    const req = ctx.getRequest<{ url: string; method: string }>(); // la peticion
    const estado = this.codigoPara(error); // 404, 409 o 500

    // En la consola: WARN [Dominio] POST /inscripciones -> 409 CupoLlenoError
    this.logger.warn(`${req.method} ${req.url} -> ${estado} ${error.constructor.name}`);

    // Todos los errores de dominio responden con la MISMA forma. Asi el
    // frontend los maneja en un solo lugar.
    res.status(estado).json({
      statusCode: estado,
      error: error.constructor.name, // el nombre de la clase: "CupoLlenoError"
      message: error.message, // el texto que se puso en el constructor
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
