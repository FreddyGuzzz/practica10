# API del Gimnasio (gimnasio-api)

Practica 10 - Blindar la API, JWT y OpenAPI. Topico de Aplicaciones Web (ITSON).
Backend en NestJS + Prisma + MySQL, con filtro de errores, middleware, interceptores, CORS, autenticacion JWT, roles y documentacion OpenAPI.

## Como correrlo

```bash
npm install
cp .env.ejemplo .env          # y ajustar DATABASE_URL y JWT_SECRET (min. 32 caracteres)
npx prisma migrate dev --name usuarios
npx prisma db seed            # datos de prueba + las tres cuentas
npm run start:dev             # http://localhost:3000   (docs en /docs)
npm run evidencias            # con el servidor corriendo: genera evidencias/*.txt con las respuestas reales
```

Cuentas de prueba (contrasena `gimnasio2026`): `karla@itson.mx` (miembro 1), `ana@itson.mx` (entrenador), `admin@itson.mx` (admin).

## Estructura relevante

```
src/
  main.ts                         pipes, filtro, interceptores, guards, CORS y Swagger
  app.module.ts                   modulos + PeticionIdMiddleware
  comun/filtros/dominio.filter.ts           errores de dominio -> HTTP (404/409/500)
  comun/middleware/peticion-id.middleware.ts  X-Request-Id
  comun/interceptores/logging.interceptor.ts  tiempos en consola
  comun/interceptores/sobre.interceptor.ts    respuestas { data, meta }
  auth/                           usuario, repositorios, DTO, decoradores, guards, JWT
  inscripciones/                  reglas del gimnasio, cancelar solo entrenador/admin
prisma/schema.prisma, prisma/seed.ts, prisma/migrations/   (init y usuarios)
scripts/generar-evidencias.sh     genera las evidencias de texto contra el servidor
evidencias/                       evidencias de las dos partes y dibujo del flujo JWT
```

## Rutas

| Ruta | Acceso |
|---|---|
| `GET /`, `GET /clases`, `GET /clases/:id`, `GET /horarios`, `GET /horarios/:id` | publicas |
| `POST /auth/registro`, `POST /auth/login` | publicas |
| `GET /auth/yo`, `GET /inscripciones`, `GET /inscripciones/:id` | con token |
| `POST /inscripciones` | con token; un miembro solo a si mismo |
| `DELETE /inscripciones/:id` | solo entrenador y admin (tarea de roles) |

## Respuestas a las preguntas

### Parte 1

**1. ¿Por que el filtro atrapa la clase base y no cada error por separado?**
Porque `@Catch(ErrorDeDominio)` atrapa esa clase y todas sus hijas (`instanceof`). Un solo filtro cubre los cuatro errores actuales y cualquier error nuevo que extienda la base, sin tocar el decorador. Si hubiera un filtro por error habria que escribir y registrar uno nuevo cada vez, con el riesgo de olvidarse de uno. Ademas la respuesta tiene la misma forma para todos, y un error de dominio sin mapear cae en 500 para que se note.

**2a. Al comentar `next()`: ¿que pasa?**
La peticion se queda colgada: el cliente espera sin recibir respuesta hasta que se agota el tiempo (timeout). No sale ningun error en la consola, porque nadie fallo: el middleware simplemente nunca le paso la peticion al siguiente de la fila.

**2b. ¿Por que este middleware no podria decidir si un usuario tiene permiso para una ruta?**
Porque corre antes de que Nest resuelva a que controller y a que metodo va la peticion, asi que no tiene acceso al `ExecutionContext` ni a los metadatos (`@Publico()`, `@Roles()`). Para decidir permisos hay que saber a que metodo se va a entrar; eso solo lo sabe un Guard, que corre despues del enrutamiento y puede leer esos metadatos con el `Reflector`.

**3. ¿Por que la peticion que responde 409 no aparece en ese registro?**
Porque el `tap()` solo se ejecuta cuando el controller responde bien. Si el Service lanza `CupoLlenoError`, el flujo del observable termina en error y salta directo al filtro de excepciones, sin pasar por el `tap`. Esa peticion si queda registrada, pero por el filtro, con la etiqueta `[Dominio]` y nivel WARN.

**4. ¿Por que el sobre rompe a cualquier cliente que ya usara la API?**
Porque cambia la forma de la respuesta: antes el cliente recibia `[...]` y ahora recibe `{ "data": [...], "meta": {...} }`. Un cliente que hacia `res[0]` ahora necesita `res.data[0]`; sin actualizarse recibe `undefined` o falla. Por eso se decide ahora, antes de que el frontend de la Unidad III empiece a consumirla.

**5. CORS: si el servidor respondio en los dos casos, ¿quien bloquea y a quien protege?**
Bloquea el navegador, no el servidor. El servidor responde con 200 a cualquier origen, pero solo manda `Access-Control-Allow-Origin` para `http://localhost:5173`. Para `localhost:4000` no manda ese encabezado y el navegador impide que el JavaScript de esa pagina lea la respuesta. Protege al usuario (y a sus sesiones/datos) de que una pagina ajena haga peticiones con su navegador y lea la respuesta. No protege al servidor: `curl` o Postman no son navegadores y no aplican CORS.

### Parte 2

**1. ¿Por que el campo se llama `passwordHash` y no `password`?**
Para que sea imposible guardar la contrasena en claro por descuido: con ese nombre cualquiera que lo asigne ve que debe ser un hash. Ademas se guarda el hash de bcrypt, nunca el texto, de modo que si se filtra la base no se filtran las contrasenas.

**2. ¿Por que los dos errores del inicio de sesion dicen exactamente lo mismo?**
Para no revelar que correos existen. Si "correo no existe" y "contrasena incorrecta" dieran mensajes distintos, un atacante podria probar correos uno por uno y averiguar cuales tienen cuenta. Con el mismo mensaje (`Credenciales invalidas`, 401) no se filtra esa informacion.

**3a. jwt.io: ¿que se puede leer sin conocer el secreto?**
Todo el header y el payload (`sub`, `correo`, `rol`, `miembroId`, `iat`, `exp`): estan en base64, no cifrados. Lo unico que no se puede reproducir sin el secreto es la firma.

**3b. Si el contenido se puede leer, ¿que es lo que protege la firma?**
La integridad, no la confidencialidad. La firma (HMAC con `JWT_SECRET`) garantiza que el contenido no fue modificado y que lo emitio el servidor. Si alguien cambia `rol` a `admin`, la firma ya no coincide y el token se rechaza con 401. Por eso nada secreto va en el payload.

**4. ¿Por que es mas seguro proteger todo y abrir a mano, que al reves?**
Porque el error por omision queda a favor de la seguridad. Si alguien olvida `@Publico()`, la ruta responde 401 y se nota de inmediato. Si fuera al reves y se olvida proteger una ruta, queda abierta sin que nadie lo vea. Es el principio de "denegar por defecto".

**5. ¿Cual es la diferencia entre un 401 y un 403?**
401 Unauthorized: no se sabe quien eres (no hay token, esta vencido o es invalido). 403 Forbidden: se sabe quien eres, pero tu no tienes permiso para esa accion (por ejemplo, un miembro inscribiendo a otro o cancelando una inscripcion).

**7. ¿Cuantas lineas del `AuthService` tuvieron que cambiar para pasar de memoria a MySQL? ¿Por que?**
Cero. El `AuthService` depende de la interfaz `UsuarioRepository` inyectada con el token `USUARIO_REPOSITORY`, no de una clase concreta. Solo cambio una linea en `auth.module.ts` (`useClass: UsuarioPrismaRepository`). Es inversion de dependencias.

**8. ¿Por que es importante tomar al usuario de los claims del token y no de la URL o del cuerpo?**
La URL y el cuerpo los controla el cliente: cualquiera puede escribir lo que quiera. Los claims del token vienen firmados por el servidor y no se pueden modificar sin invalidar la firma.
Ejemplo concreto: si la API confiara en `GET /miembros/3/inscripciones`, Karla (miembro 1) podria cambiar el 3 y ver las inscripciones de Sofia. Si confiara en el `miembroId` del cuerpo de `POST /inscripciones` sin compararlo con el token, Karla mandaria `{"miembroId": 3, ...}` e inscribiria a Sofia sin permiso.
El claim que se usa es `miembroId` (junto con `rol`; `sub` identifica al usuario). El Guard lo deja en `req.user` despues de verificar la firma, y el controller lo compara con el del cuerpo: si no coincide, 403. El cliente no puede falsificarlo porque para cambiarlo tendria que firmar un token nuevo, y eso requiere `JWT_SECRET`, que solo conoce el servidor.

### Tarea (roles)

`DELETE /inscripciones/:id` lleva `@Roles(Rol.entrenador, Rol.admin)`. El `RolesGuard` lee esa lista con el `Reflector` y compara con el `rol` del token. Se registra global despues del `JwtAuthGuard`, porque este es quien deja `req.user`. Resultado: sin token 401, miembro 403, entrenador 200.

## Documentacion OpenAPI

Con el servidor corriendo: http://localhost:3000/docs. Iniciar sesion con `POST /auth/login`, copiar `access_token` y pegarlo en **Authorize**.

## Evidencias

Las respuestas HTTP se generan con `npm run evidencias` (archivos `evidencias/parte1-*.txt` y `parte2-*.txt`, cada uno con el comando, la hora y la respuesta). El resto son capturas:

| Parte | Evidencia | Donde |
|---|---|---|
| 1 | 409 con la nueva forma | `parte1-409-cupo-lleno.txt` |
| 1 | Respuesta con `X-Request-Id` | `parte1-x-request-id.txt` |
| 1 | Consola con los tiempos (`[HTTP] GET /clases - 2ms`) | captura de la terminal |
| 1 | Respuesta con el sobre | `parte1-sobre.txt` |
| 1 | Dos pruebas de CORS | `parte1-cors-origen-5173.txt` y `parte1-cors-origen-4000.txt` |
| 2 | 401 sin token | `parte2-401-sin-token.txt` |
| 2 | Inicio de sesion y datos del token | `parte2-login.txt`, `parte2-datos-del-token.txt` |
| 2 | Inscripcion propia (201) y ajena (403) | `parte2-inscripcion-propia-201.txt`, `parte2-403-inscripcion-ajena.txt` |
| 2 | Roles: 401 / 403 / 200 en la misma ruta | `parte2-roles-cancelar.txt` |
| 2 | Documentacion en `/docs` con el candado | captura |
| 2 | Migracion de usuarios | `prisma/migrations/20261005000000_usuarios/migration.sql` |
| 2 | Inicio de sesion despues de reiniciar | captura (cuenta en `parte2-correo-registrado.txt`) |
| 2 | Dibujo del flujo JWT | `evidencias/flujo-jwt.png` |
