// Errores del dominio del gimnasio.

// NUEVO: la clase base de todos los errores del gimnasio.
// abstract: nadie lanza un "ErrorDeDominio" a secas, solo sus hijas.
export abstract class ErrorDeDominio extends Error {}

// Antes decia "extends Error". Lo mismo en los otros tres errores.
export class HorarioNoEncontradoError extends ErrorDeDominio {
  constructor(horarioId: number) {
    super(`No existe el horario ${horarioId}`);
  }
}

export class MiembroNoEncontradoError extends ErrorDeDominio {
  constructor(miembroId: number) {
    super(`No existe el miembro ${miembroId}`);
  }
}

export class CupoLlenoError extends ErrorDeDominio {
  constructor(horarioId: number) {
    super(`El horario ${horarioId} ya no tiene cupo`);
  }
}

export class InscripcionDuplicadaError extends ErrorDeDominio {
  constructor(miembroId: number, horarioId: number) {
    super(`El miembro ${miembroId} ya esta inscrito en el horario ${horarioId}`);
  }
}
