package pe.blenkir.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.blenkir.model.*;
import pe.blenkir.repository.*;

import java.time.LocalDate;

/**
 * Siembra los mismos datos de demostración que tenía el front (solo si la BD está vacía).
 * Usuarios demo: admin/admin123; las cuentas de docente y alumno se generan con sus IDs/DNI.
 */
@Component
@Order(1)
public class DatosDemoService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosDemoService.class);

    private final DocenteRepository docentes;
    private final EstudianteRepository estudiantes;
    private final CursoRepository cursos;
    private final AsignacionRepository asignaciones;
    private final NotaRepository notas;
    private final AsistenciaRepository asistencias;
    private final UsuarioRepository usuarios;
    private final ApoderadoRepository apoderados;
    private final ApoderadoEstudianteRepository vinculosApoderado;
    private final PasswordEncoder encoder;

    public DatosDemoService(DocenteRepository docentes, EstudianteRepository estudiantes, CursoRepository cursos,
                            AsignacionRepository asignaciones, NotaRepository notas, AsistenciaRepository asistencias,
                            UsuarioRepository usuarios, ApoderadoRepository apoderados,
                            ApoderadoEstudianteRepository vinculosApoderado, PasswordEncoder encoder) {
        this.docentes = docentes;
        this.estudiantes = estudiantes;
        this.cursos = cursos;
        this.asignaciones = asignaciones;
        this.notas = notas;
        this.asistencias = asistencias;
        this.usuarios = usuarios;
        this.apoderados = apoderados;
        this.vinculosApoderado = vinculosApoderado;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Los datos demo se insertan una sola vez, cuando las tablas académicas están vacías.
        if (docentes.count() == 0 && estudiantes.count() == 0) {
            Docente d1 = docente("Carlos Ruiz", "Matemática", "carlos.ruiz@blenkirahora.edu");
            Docente d2 = docente("Ana Torres", "Comunicación", "ana.torres@blenkirahora.edu");
            Docente d3 = docente("María Fernández", "Ciencia y Tecnología", "maria.fernandez@blenkirahora.edu");
            Docente d4 = docente("Jorge Mendoza", "Ciencias Sociales", "jorge.mendoza@blenkirahora.edu");
            Docente d5 = docente("Lucía Paredes", "Inglés", "lucia.paredes@blenkirahora.edu");

            Curso c1 = curso("Matemática", d1, 4);
            Curso c2 = curso("Comunicación", d2, 3);
            Curso c3 = curso("Ciencia y Tecnología", d3, 4);
            Curso c4 = curso("Ciencias Sociales", d4, 3);
            Curso c5 = curso("Inglés", d5, 3);
            Curso c6 = curso("Álgebra", d1, 3);
            Curso c7 = curso("Literatura", d2, 2);
            Curso c8 = curso("Física", d3, 4);

            Estudiante[] alumnos = {
                estudiante("Ana", "Quispe Torres", "71234567", "5to Secundaria", "A"),
                estudiante("Luis", "Fernández Vera", "70654321", "5to Secundaria", "B"),
                estudiante("María", "García López", "71823456", "4to Secundaria", "A"),
                estudiante("José", "Ramírez Soto", "73456781", "3ro Secundaria", "C"),
                estudiante("Valeria", "Huamán Rojas", "74561238", "2do Secundaria", "B"),
                estudiante("Diego", "Castillo Pérez", "75612349", "1ro Secundaria", "A"),
                estudiante("Camila", "Flores Díaz", "76723451", "5to Secundaria", "C"),
                estudiante("Andrés", "Vargas León", "77834562", "4to Secundaria", "B"),
                estudiante("Daniela", "Rojas Medina", "78945623", "3ro Secundaria", "A"),
                estudiante("Pedro", "Salazar Núñez", "79056734", "2do Secundaria", "C"),
                estudiante("Sofía", "Mendoza Arias", "70167845", "1ro Secundaria", "B"),
                estudiante("Mateo", "Paredes Silva", "70278956", "4to Secundaria", "A")
            };
            // Cuatro alumnos inactivos para probar el bloqueo de acceso.
            for (int i : new int[]{3, 6, 9, 11}) alumnos[i].setEstado("inactivo");
            estudiantes.saveAll(java.util.Arrays.asList(alumnos));

            Curso[] cursosDemo = {c1,c2,c3,c4,c5,c6,c7,c8};
            for (int i = 0; i < alumnos.length; i++) {
                Estudiante e = alumnos[i];
                Curso principal = cursosDemo[i % cursosDemo.length];
                matricula(principal, e);
                if (i % 2 == 0) matricula(cursosDemo[(i + 1) % cursosDemo.length], e);
                nota(principal, e, 1, new double[]{16,14,9,18,12,17,8,15,19,11,13,10}[i]);
                asistencia(principal, e, i % 4 == 0 ? "Tardanza" : "Presente");
            }
            // Cuentas de acceso para todos los docentes y estudiantes, incluso inactivos.
            for (Docente d : new Docente[]{d1,d2,d3,d4,d5}) {
                usuario("docente." + d.getId(), "Blenkir@" + d.getId(), "Docente", d.getNombres(), null, d.getId());
            }
            for (Estudiante e : alumnos) {
                usuario("alumno." + e.getDni(), "Blenkir@" + e.getDni(), "Alumno",
                        e.getNombres() + " " + e.getApellidos(), e.getId(), null);
            }
            log.info("Datos de demostración ampliados: 5 docentes, 8 cursos y 12 estudiantes (incluye inactivos).");
        }

        // Cuenta de demostración del portal de apoderados (vinculada mediante la tabla puente).
        Usuario cuentaApoderado = usuarios.findByUsuarioIgnoreCase("apoderado.demo").orElse(null);
        if (cuentaApoderado == null) {
            cuentaApoderado = crearUsuario("apoderado.demo", "Blenkir@2026", "APODERADO",
                    "Apoderado de Ana Quispe", null, null);
        } else if (!"APODERADO".equals(cuentaApoderado.getTipo())) {
            // Reserva la cuenta demo con el rol correcto sin modificar su contraseña existente.
            cuentaApoderado.setTipo("APODERADO");
            cuentaApoderado.setIdEstudiante(null);
            cuentaApoderado.setIdDocente(null);
            cuentaApoderado = usuarios.save(cuentaApoderado);
        }
        Apoderado perfil = apoderados.findByUsuarioId(cuentaApoderado.getId()).orElse(null);
        if (perfil == null) {
            perfil = new Apoderado();
            perfil.setUsuarioId(cuentaApoderado.getId());
            perfil = apoderados.save(perfil);
        }
        if (vinculosApoderado.findByApoderadoIdOrderById(perfil.getId()).isEmpty()) {
            Estudiante ana = estudiantes.findByDni("71234567").orElse(null);
            if (ana != null) {
                ApoderadoEstudiante v = new ApoderadoEstudiante(); v.setApoderadoId(perfil.getId()); v.setEstudianteId(ana.getId());
                v.setParentesco("Madre / Padre"); v.setPuedeVerNotas(true); v.setPuedeVerAsistencia(true); v.setPuedeVerAlertas(true);
                vinculosApoderado.save(v);
            }
        }

        // Siempre debe existir al menos un administrador para poder entrar a la web.
        boolean hayAdmin = usuarios.findAll().stream().anyMatch(u -> "Administrador".equals(u.getTipo()));
        if (!hayAdmin) {
            usuario("admin", "admin123", "Administrador", "Admin General", null, null);
            log.info("Usuario administrador por defecto creado (admin / admin123).");
        }
        // Completa cuentas faltantes en instalaciones que ya tenían datos.
        docentes.findAll().forEach(d -> usuarios.findByIdDocente(d.getId()).orElseGet(() -> usuarioCuentaDocente(d)));
        estudiantes.findAll().forEach(e -> usuarios.findByIdEstudiante(e.getId()).orElseGet(() -> usuarioCuentaEstudiante(e)));
    }

    private Usuario usuarioCuentaDocente(Docente d) { return crearUsuario("docente."+d.getId(), "Blenkir@"+d.getId(), "Docente", d.getNombres(), null, d.getId()); }
    private Usuario usuarioCuentaEstudiante(Estudiante e) { return crearUsuario("alumno."+e.getDni(), "Blenkir@"+e.getDni(), "Alumno", e.getNombres()+" "+e.getApellidos(), e.getId(), null); }

    private Docente docente(String n, String esp, String email) {
        Docente d = new Docente();
        d.setNombres(n); d.setEspecialidad(esp); d.setEmail(email); d.setEstado("activo");
        return docentes.save(d);
    }

    private Curso curso(String nombre, Docente d, int cr) {
        Curso c = new Curso();
        c.setNombre(nombre); c.setIdDocente(d.getId()); c.setCreditos(cr);
        return cursos.save(c);
    }

    private Estudiante estudiante(String n, String a, String dni, String grado, String sec) {
        Estudiante e = new Estudiante();
        e.setNombres(n); e.setApellidos(a); e.setDni(dni); e.setGrado(grado); e.setSeccion(sec); e.setEstado("activo");
        return estudiantes.save(e);
    }

    private void matricula(Curso c, Estudiante e) {
        Asignacion a = new Asignacion();
        a.setIdCurso(c.getId()); a.setIdEstudiante(e.getId());
        asignaciones.save(a);
    }

    private void nota(Curso c, Estudiante e, int bim, double cal) {
        Nota n = new Nota();
        n.setIdCurso(c.getId()); n.setIdEstudiante(e.getId()); n.setBimestre(bim); n.setCalificacion(cal); n.setFecha(LocalDate.now());
        notas.save(n);
    }

    private void asistencia(Curso c, Estudiante e, String estado) {
        Asistencia a = new Asistencia();
        a.setIdCurso(c.getId()); a.setIdEstudiante(e.getId()); a.setFecha(LocalDate.now()); a.setEstado(estado);
        asistencias.save(a);
    }

    private void usuario(String login, String pass, String tipo, String nombre, Long idEstudiante, Long idDocente) { crearUsuario(login,pass,tipo,nombre,idEstudiante,idDocente); }

    private Usuario crearUsuario(String login, String pass, String tipo, String nombre, Long idEstudiante, Long idDocente) {
        Usuario u = new Usuario();
        u.setUsuario(login); u.setPasswordHash(encoder.encode(pass)); u.setTipo(tipo); u.setNombre(nombre); u.setIdEstudiante(idEstudiante); u.setIdDocente(idDocente);
        return usuarios.save(u);
    }
}
