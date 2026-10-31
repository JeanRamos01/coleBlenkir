# Colegio Blenkir · Web + Spring Boot + PostgreSQL + Consola

## Extensión Semana 9 / Semana 10: ORM, JPA y validaciones

- **ORM Hibernate + Spring Data JPA:** las entidades `Curso`, `Asignacion`, `Nota` y `Asistencia` ahora expresan relaciones `@ManyToOne(fetch = LAZY)` hacia docentes, estudiantes y cursos. Se mantienen los campos `idCurso`, `idEstudiante` e `idDocente` para que la API web y la consola sigan funcionando sin cambios. Las relaciones son de solo lectura (`insertable=false, updatable=false`) y se omiten del JSON con `@JsonIgnore`.
- **PostgreSQL (modo original):** continúa usando `schema.sql` con claves foráneas y restricciones; no borra ni migra los datos existentes. La configuración y las credenciales siguen siendo las originales.
- **Base de datos de práctica H2:** `mvn spring-boot:run -Dspring-boot.run.profiles=practica`. Hibernate crea/actualiza el esquema en `./seguimiento_academico.mv.db`; se deshabilita `schema.sql` solo en este perfil porque contiene SQL específico de PostgreSQL. Ideal para demostrar JPA sin instalar PostgreSQL.
- **Validaciones CRUD:** Bean Validation (`@NotBlank`, `@NotNull`, `@Size`, `@Pattern`, `@Min`, `@Max`, etc.) en entidades y `@Valid` en las operaciones de creación/edición completas. Los errores HTTP 400 mantienen el formato `{"error":"campo: mensaje"}`. Se conservan las verificaciones de negocio existentes (duplicados, matrículas, docentes activos, rangos y referencias).
- **Banner de Spring:** `src/main/resources/banner.txt` muestra `Sistema de Seguimiento Academico` durante el arranque.

Para visualizar consultas SQL en PostgreSQL, activa `JPA_SHOW_SQL=true`.

La web que ya tenías ahora guarda todo en **PostgreSQL** (ya no hay arreglos ni `localStorage`)
y además puedes administrar los datos desde una **consola con `Scanner`** (IntelliJ IDEA o VS Code).
Todo lo que hagas en la consola aparece solo en la web (se actualiza cada ~3 segundos).

```
 Navegador (HTML/JS) ──REST /api──►┐
                                   ├─► Servicios (mismas reglas) ─► PostgreSQL
 Consola (Scanner, mismo proceso) ─┘
```

## 1. Requisitos

- **JDK 17 o superior**
- **Maven** (IntelliJ y VS Code lo traen integrado; no hace falta instalarlo aparte si usas el IDE)
- **PostgreSQL 14+** (o Docker)

## 2. Crear la base de datos

**Opción A – PostgreSQL instalado:**

```bash
psql -U postgres -f database/01_crear_bd.sql
```

**Opción B – Docker (sin instalar nada):**

```bash
docker compose up -d
```

Las **tablas se crean solas** al arrancar la aplicación (`src/main/resources/schema.sql`, es seguro
ejecutarlo muchas veces: no borra datos). Los datos de demostración también se cargan solos si la BD está vacía: 5 docentes, 8 cursos y 12 estudiantes (8 activos y 4 inactivos), además de matrículas, notas, asistencias y cuentas de acceso. Si ya existen estudiantes o docentes, el sembrado académico no vuelve a insertar el conjunto demo para evitar duplicados; las cuentas faltantes sí se completan.

Si tu PostgreSQL usa otro usuario/clave/puerto, cámbialo en `src/main/resources/application.properties`
o con variables de entorno: `DB_URL`, `DB_USER`, `DB_PASSWORD`.
Por defecto: `jdbc:postgresql://localhost:5432/blenkir` · usuario `postgres` · clave `postgres`.

## 3. Ejecutar

### IntelliJ IDEA
1. `File → Open…` y elige `pom.xml` → *Open as Project*.
2. Abre `BlenkirApplication.java` y pulsa ▶ **Run**.
3. En la pestaña **Run** aparecerá el menú. Escribe el número de la opción en esa misma ventana y Enter.

### Visual Studio Code
1. Instala *Extension Pack for Java* y *Spring Boot Extension Pack*.
2. Abre la carpeta del proyecto y ejecuta con **Run and Debug → "Blenkir (web + consola)"**
   (ya viene configurado en `.vscode/launch.json` con `"console": "integratedTerminal"`).
3. Escribe en la pestaña **Terminal**.

> ⚠️ En VS Code la *Debug Console* **no acepta teclado**. Por eso el `launch.json` usa la terminal integrada.
> También puedes simplemente ejecutar `mvn spring-boot:run` en la terminal.

### Abrir la web
- `http://localhost:8080` → página de inicio del colegio → botón **Ingresar**
- `http://localhost:8080/index.html` → directo al login del sistema

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | Administrador |
| `docente.1` | `Blenkir@1` | Docente demo |
| `alumno.71234567` | `Blenkir@71234567` | Alumna activa (Ana Quispe) |
| `alumno.73456781` | `Blenkir@73456781` | Alumno inactivo (José Ramírez) — acceso denegado |
| `alumno.76723451` | `Blenkir@76723451` | Alumna inactiva (Camila Flores) — acceso denegado |
| `alumno.79056734` | `Blenkir@79056734` | Alumno inactivo (Pedro Salazar) — acceso denegado |
| `alumno.70278956` | `Blenkir@70278956` | Alumno inactivo (Mateo Paredes) — acceso denegado |

### Prueba de acceso de usuario inactivo

Usa `alumno.73456781` con contraseña `Blenkir@73456781`. Aunque la contraseña sea correcta, el backend responde HTTP 403 y muestra el mensaje: **“Acceso denegado: tu cuenta está inactiva”**. La validación consulta el estado real del estudiante en PostgreSQL. Al cambiar su estado a `activo` desde el panel administrativo, podrá iniciar sesión con esas mismas credenciales.

Al ingresar con cualquier cuenta activa, el panel muestra un mensaje de bienvenida personalizado con el nombre y el rol.

## 4. Menú de la consola

```
=== MENÚ PRINCIPAL ===
 1) Estudiantes        listar · buscar · registrar · modificar · activar/desactivar · eliminar
 2) Docentes           listar · registrar · modificar · activar/desactivar · eliminar
 3) Cursos             listar · registrar · modificar · eliminar
 4) Matrículas         ver por curso · ver todas · matricular · retirar
 5) Calificaciones     listar · por curso · registrar · modificar · eliminar
 6) Asistencia         listar · registrar · modificar estado · eliminar
 7) Usuarios           cuentas de acceso a la web: listar · crear · modificar · eliminar
 8) Reportes           resumen general · ranking de promedios · asistencia por estudiante
 0) Cerrar la consola (el servidor web sigue activo)
```

Prueba: abre la web con `admin`, ve a *Estudiantes*; en la consola registra uno nuevo
(`1` → `3`). En unos segundos aparece en la tabla de la web, y viceversa.

## 5. Qué reemplazó a qué

| Antes (`app.js`) | Ahora (PostgreSQL) |
|---|---|
| `state.estudiantes` | tabla `estudiantes` |
| `state.docentes` | tabla `docentes` |
| `state.cursos` | tabla `cursos` |
| `state.asignaciones` | tabla `asignaciones` (matrícula) |
| `state.notas` | tabla `notas` |
| `state.asistencias` | tabla `asistencias` |
| `USUARIOS_DEMO` | tabla `usuarios` (contraseñas con **BCrypt**) |
| `localStorage` | `GET /api/estado` + sincronización automática |

Las relaciones están como claves foráneas: al borrar un estudiante se borran sus notas, asistencias y
matrículas; al borrar un curso, igual; y **no** se puede borrar un docente que tenga cursos.

## 6. Reglas que ahora aplica el servidor (web y consola por igual)

- DNI único (6–15 dígitos) y email de docente único.
- Solo se registran **notas y asistencia a estudiantes matriculados** en ese curso.
- Una sola asistencia por estudiante, curso y fecha (para corregirla, modifica el registro).
- Calificación 0–20, bimestre 1–4, créditos 1–10.
- No se puede eliminar (ni cambiar de tipo) al único administrador.

## 7. API REST (por si la quieres probar con Postman)

| Recurso | Endpoints |
|---|---|
| Estado completo | `GET /api/estado` |
| Login | `POST /api/login` `{usuario, password}` |
| Estudiantes | `GET/POST /api/estudiantes` · `GET/PUT/DELETE /api/estudiantes/{id}` · `PATCH /api/estudiantes/{id}/estado` |
| Docentes | igual que estudiantes, en `/api/docentes` |
| Cursos | `GET/POST /api/cursos` · `GET/PUT/DELETE /api/cursos/{id}` |
| Matrículas | `GET/POST /api/asignaciones` · `DELETE /api/asignaciones?idCurso=1&idEstudiante=2` |
| Notas | `GET/POST /api/notas` · `GET/PUT/DELETE /api/notas/{id}` |
| Asistencias | `GET/POST /api/asistencias` · `GET/PUT/DELETE /api/asistencias/{id}` |

Los errores se devuelven como `{"error": "mensaje"}` y la web los muestra en una alerta.

## 8. Problemas frecuentes

- **`Connection refused` / `password authentication failed` al arrancar** → PostgreSQL apagado, o usuario/clave
  distintos. Ajusta `application.properties` o las variables `DB_*`.
- **`database "blenkir" does not exist`** → falta el paso 2.
- **`Port 8080 was already in use`** → cambia el puerto: variable `PORT=8081`.
- **Tildes o ñ se ven raras en la consola (Windows)** → agrega a las *VM options*:
  `-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8` (en IntelliJ: *Run → Edit Configurations → Modify options → Add VM options*).
- **No quiero la consola (por ejemplo en un servidor)** → `CONSOLA=false` o `blenkir.consola.activa=false`.
- Si cierras la consola con `0`, el servidor sigue vivo. Para detener todo usa el botón **Stop** / `Ctrl+C`.

## 9. Importante sobre seguridad

El login valida contra la base de datos, pero **la API no exige autenticación**: el control de roles de la web
es solo visual (igual que en la versión original). Está bien para un proyecto académico o red local; para
publicarlo en internet habría que agregar Spring Security con sesión o JWT.

## 10. Estructura

```
blenkir/
├── pom.xml
├── docker-compose.yml
├── database/01_crear_bd.sql
├── .vscode/launch.json
└── src/main
    ├── java/pe/blenkir
    │   ├── BlenkirApplication.java
    │   ├── model/        entidades JPA (una por tabla)
    │   ├── repository/   Spring Data JPA
    │   ├── service/      reglas de negocio (compartidas por web y consola) + datos demo
    │   ├── web/          controladores REST y manejo de errores
    │   ├── cli/          consola con Scanner (un archivo por módulo)
    │   └── config/
    └── resources
        ├── application.properties
        ├── schema.sql    ← el script de PostgreSQL
        └── static/       ← tu web (index.html, pagInicio.html, app.js, css, img)
```


## Portal privado de apoderados

El sistema incorpora el rol `APODERADO` con acceso mediante usuario y contraseña propios (BCrypt en `usuarios.password_hash`). Cada cuenta tiene un perfil uno a uno en `apoderados` (`usuario_id` único) y puede estar vinculada a uno o varios estudiantes mediante `apoderado_estudiante`. La tabla puente registra parentesco, estado del vínculo y permisos independientes para calificaciones, asistencia y alertas.

El portal se consulta en `GET /api/apoderado/portal`. El servidor obtiene el usuario desde la sesión y no recibe un DNI ni un ID de estudiante indicado por el navegador. El resultado incluye solo los estudiantes vinculados activos y los datos autorizados por cada permiso. El rol `APODERADO` no puede consultar `/api/estado` ni los endpoints generales de estudiantes, notas, asistencia, cursos, docentes o matrículas.

El esquema `src/main/resources/schema.sql` crea las tablas nuevas y amplía de forma idempotente la restricción de roles para instalaciones PostgreSQL existentes. En perfil `practica`, Hibernate actualiza las entidades automáticamente (`ddl-auto=update`).

**Cuenta de prueba del portal:** `apoderado.demo` / `Blenkir@2026` (vinculada a Ana Quispe Torres, DNI 71234567). La cuenta demo se genera junto con los datos de demostración.

Para dar de alta un apoderado desde el panel de administración, entra a **Usuarios**, selecciona el rol **Apoderado**, asigna uno o varios estudiantes, define el parentesco y marca los permisos que tendrá sobre sus reportes.
