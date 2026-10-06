#!/usr/bin/env bash
# Genera las evidencias de TEXTO de la practica 10 contra TU servidor real.
# Antes: base sembrada (npx prisma db seed) y servidor corriendo (npm run start:dev).
# Uso:   bash scripts/generar-evidencias.sh        (o:  npm run evidencias)
# Cada archivo queda en evidencias/ con el comando, la hora y la respuesta real.
# Las capturas de la consola del servidor, jwt.io, /docs y el reinicio las tomas tu.

B=${B:-http://localhost:3000}
OUT=evidencias
J='Content-Type: application/json'
mkdir -p "$OUT"

json() { node -pe "JSON.parse(require('fs').readFileSync(0))$1"; }
token() {
  curl -s -X POST "$B/auth/login" -H "$J" \
    -d "{\"correo\":\"$1\",\"password\":\"gimnasio2026\"}" | json .data.access_token
}
# ejecutar <archivo> <descripcion> <comando...>: guarda comando + respuesta real
ejecutar() {
  local f="$OUT/$1"; local d="$2"; shift 2
  { echo "# $d"; echo "# $(date '+%Y-%m-%d %H:%M:%S')"; echo "\$ $*"; echo; "$@"; echo; echo; } >> "$f"
}

if ! curl -s -o /dev/null "$B/"; then
  echo "No responde $B. Levanta el servidor primero (npm run start:dev)."; exit 1
fi

# empezar de cero: borra solo los .txt que genera este script
rm -f "$OUT"/parte1-*.txt "$OUT"/parte2-*.txt

KARLA=$(token karla@itson.mx); ANA=$(token ana@itson.mx)
if [ -z "$KARLA" ] || [ "$KARLA" = "undefined" ]; then
  echo "No se pudo iniciar sesion. Revisa el seed (usuarios) y JWT_SECRET."; exit 1
fi

echo "== Parte 1 =="
ejecutar parte1-409-cupo-lleno.txt "409 con la nueva forma (el horario 3 viene lleno en el seed)" \
  curl -s -i -X POST "$B/inscripciones" -H "Authorization: Bearer $KARLA" -H "$J" -d '{"miembroId":1,"horarioId":3}'
ejecutar parte1-x-request-id.txt "Respuesta con X-Request-Id generado" curl -s -i "$B/clases"
ejecutar parte1-x-request-id.txt "Respuesta que respeta el X-Request-Id del cliente" \
  curl -s -i "$B/clases" -H "X-Request-Id: mi-id-123"
ejecutar parte1-sobre.txt "Respuesta con el sobre { data, meta }" curl -s -i "$B/clases"
ejecutar parte1-cors-origen-5173.txt "CORS: origen permitido (debe traer Access-Control-Allow-Origin)" \
  curl -s -i "$B/clases" -H "Origin: http://localhost:5173"
ejecutar parte1-cors-origen-4000.txt "CORS: origen NO permitido (no debe traer Access-Control-Allow-Origin)" \
  curl -s -i "$B/clases" -H "Origin: http://localhost:4000"

echo "== Parte 2 =="
ejecutar parte2-401-sin-token.txt "401: ruta protegida sin token" curl -s -i "$B/inscripciones"
ejecutar parte2-login.txt "Inicio de sesion de Karla" \
  curl -s -i -X POST "$B/auth/login" -H "$J" -d '{"correo":"karla@itson.mx","password":"gimnasio2026"}'
ejecutar parte2-datos-del-token.txt "Datos que venian dentro del token (/auth/yo)" \
  curl -s -i "$B/auth/yo" -H "Authorization: Bearer $KARLA"
ejecutar parte2-inscripcion-propia-201.txt "Karla se inscribe a si misma (201 + Location)" \
  curl -s -i -X POST "$B/inscripciones" -H "Authorization: Bearer $KARLA" -H "$J" -d '{"miembroId":1,"horarioId":1}'
ejecutar parte2-403-inscripcion-ajena.txt "Karla intenta inscribir a Sofia, miembro 3 (403)" \
  curl -s -i -X POST "$B/inscripciones" -H "Authorization: Bearer $KARLA" -H "$J" -d '{"miembroId":3,"horarioId":1}'

# Tarea de roles: cancelar la inscripcion de Karla (la ruta es la MISMA en las tres pruebas)
ID=$(curl -s "$B/inscripciones" -H "Authorization: Bearer $ANA" | json '.data.find(i=>i.miembroId===1&&i.horarioId===1).id')
if [ -n "$ID" ] && [ "$ID" != "undefined" ]; then
  ejecutar parte2-roles-cancelar.txt "DELETE sin token (401)" curl -s -i -X DELETE "$B/inscripciones/$ID"
  ejecutar parte2-roles-cancelar.txt "DELETE con miembro Karla (403)" \
    curl -s -i -X DELETE "$B/inscripciones/$ID" -H "Authorization: Bearer $KARLA"
  ejecutar parte2-roles-cancelar.txt "DELETE con entrenador Ana (200)" \
    curl -s -i -X DELETE "$B/inscripciones/$ID" -H "Authorization: Bearer $ANA"
else
  echo "No encontre la inscripcion de Karla para la prueba de roles (corre db seed y vuelve a intentar)."
fi

CORREO="prueba$(date +%s)@itson.mx"
ejecutar parte2-registro-nuevo.txt "Registro de una cuenta nueva ($CORREO). Reinicia el servidor y haz login con ella" \
  curl -s -i -X POST "$B/auth/registro" -H "$J" -d "{\"correo\":\"$CORREO\",\"password\":\"gimnasio2026\"}"
echo "$CORREO" > "$OUT/parte2-correo-registrado.txt"

echo "Listo. Archivos generados en $OUT/:"; ls "$OUT"
