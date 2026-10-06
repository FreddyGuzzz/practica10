// TAREA (Roles): el SEGUNDO guardia. El primero (JwtAuthGuard) responde
// "quien eres" (401 si no hay token). Este responde "puedes hacer esto"
// (403 si tu rol no esta en la lista).
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decoradores/roles.decorator';
import { PayloadJwt, Rol } from '../dominio/usuario';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    // Busca @Roles() en el metodo y luego en la clase.
    const permitidos = this.reflector.getAllAndOverride<Rol[] | undefined>(ROLES_KEY, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    // Ruta sin @Roles(): este guardia no opina, deja pasar.
    if (!permitidos || permitidos.length === 0) return true;

    // El usuario lo dejo el JwtAuthGuard (por eso va ANTES en main.ts).
    const { user } = contexto.switchToHttp().getRequest<{ user?: PayloadJwt }>();
    if (!user) throw new UnauthorizedException(); // no deberia pasar, pero por si acaso

    // Estas autenticado, pero tu rol no esta en la lista -> 403.
    if (!permitidos.includes(user.rol)) {
      throw new ForbiddenException('Tu rol no tiene permiso para esta accion');
    }
    return true;
  }
}
