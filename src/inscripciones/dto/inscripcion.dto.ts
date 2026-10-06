// DTO de entrada (CrearInscripcionDto, validado) y de salida (InscripcionDto).
// Sin @ApiProperty: el plugin de Swagger (nest-cli.json) lee los .dto.ts y los documenta solo.
import { IsInt, IsPositive } from 'class-validator';
import { Inscripcion } from '../dominio/inscripcion';

export class CrearInscripcionDto {
  @IsInt({ message: 'miembroId debe ser un entero' })
  @IsPositive({ message: 'miembroId debe ser positivo' })
  miembroId: number;

  @IsInt({ message: 'horarioId debe ser un entero' })
  @IsPositive({ message: 'horarioId debe ser positivo' })
  horarioId: number;
}

// Lo que sale hacia el cliente. Fechas como texto ISO.
export class InscripcionDto {
  id: number;
  miembroId: number;
  horarioId: number;
  creadaEn: string;
}

// Convierte la entidad en DTO: nunca se expone la entidad directamente.
export function aInscripcionDto(i: Inscripcion): InscripcionDto {
  return {
    id: i.id,
    miembroId: i.miembroId,
    horarioId: i.horarioId,
    creadaEn: i.creadaEn.toISOString(),
  };
}
