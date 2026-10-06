// La entidad de dominio: lo que el Service devuelve (nunca va tal cual al cliente).
export interface Inscripcion {
  id: number;
  miembroId: number;
  horarioId: number;
  creadaEn: Date;
}
