// TAREA (Roles): igual que @Publico(), pero en vez de un true guarda la
// LISTA de roles permitidos. El RolesGuard la lee con el Reflector.
import { SetMetadata } from '@nestjs/common';
import { Rol } from '../dominio/usuario';

export const ROLES_KEY = 'roles'; // la llave del dato

// Uso: @Roles(Rol.entrenador, Rol.admin) encima de un metodo o controller.
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
