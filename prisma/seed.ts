// Llena la base con datos de prueba. Se corre con: npx prisma db seed
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // arriba, con los demas imports

const prisma = new PrismaClient();

async function main() {
  // Se borra en orden: primero lo que depende de otras tablas.
  await prisma.inscripcion.deleteMany();
  await prisma.horario.deleteMany();
  await prisma.clase.deleteMany();
  await prisma.miembro.deleteMany();
  await prisma.usuario.deleteMany();

  // Ids explicitos: Karla = miembro 1 y Sofia = miembro 3 (las pruebas del documento).
  await prisma.miembro.createMany({
    data: [
      { id: 1, nombre: 'Karla', correo: 'karla@itson.mx' },
      { id: 2, nombre: 'Luis', correo: 'luis@itson.mx' },
      { id: 3, nombre: 'Sofia', correo: 'sofia@itson.mx' },
    ],
  });

  await prisma.clase.createMany({
    data: [
      { id: 1, nombre: 'Yoga', descripcion: 'Flexibilidad y respiracion' },
      { id: 2, nombre: 'Spinning', descripcion: 'Cardio en bicicleta fija' },
      { id: 3, nombre: 'Funcional', descripcion: 'Entrenamiento de cuerpo completo' },
    ],
  });

  await prisma.horario.createMany({
    data: [
      { id: 1, claseId: 1, dia: 'Lunes', hora: '07:00', cupo: 10 },
      { id: 2, claseId: 2, dia: 'Martes', hora: '18:00', cupo: 12 },
      // cupo 1 y ya ocupado por Luis: sirve para ver el 409 CupoLlenoError
      { id: 3, claseId: 3, dia: 'Miercoles', hora: '19:00', cupo: 1 },
    ],
  });

  await prisma.inscripcion.create({ data: { miembroId: 2, horarioId: 3 } });

  // las tres cuentas de prueba, ahora guardadas en MySQL.
  const passwordHash = await bcrypt.hash('gimnasio2026', 10);
  await prisma.usuario.createMany({
    data: [
      { correo: 'karla@itson.mx', passwordHash, rol: 'miembro', miembroId: 1 },
      { correo: 'ana@itson.mx', passwordHash, rol: 'entrenador' },
      { correo: 'admin@itson.mx', passwordHash, rol: 'admin' },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
