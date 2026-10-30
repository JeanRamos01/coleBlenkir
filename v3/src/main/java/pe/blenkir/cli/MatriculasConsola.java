package pe.blenkir.cli;

import org.springframework.stereotype.Component;
import pe.blenkir.model.Estudiante;
import pe.blenkir.service.EstudianteService;
import pe.blenkir.service.MatriculaService;

import java.util.Map;

/** Asignación de estudiantes a cursos (matrícula). */
@Component
public class MatriculasConsola extends ModuloConsola {

    private final MatriculaService service;
    private final EstudianteService estudiantes;
    private final CursosConsola cursos;
    private final EstudiantesConsola estudiantesConsola;
    private final Nombres nombres;

    public MatriculasConsola(Entrada in, MatriculaService service, EstudianteService estudiantes,
                             CursosConsola cursos, EstudiantesConsola estudiantesConsola, Nombres nombres) {
        super(in);
        this.service = service;
        this.estudiantes = estudiantes;
        this.cursos = cursos;
        this.estudiantesConsola = estudiantesConsola;
        this.nombres = nombres;
    }

    @Override
    public void abrir() {
        while (true) {
            titulo("MATRÍCULAS (estudiantes por curso)");
            System.out.println(" 1) Ver matriculados de un curso\n 2) Ver todas las matrículas\n"
                    + " 3) Matricular estudiante en un curso\n 4) Retirar estudiante de un curso\n 0) Volver");
            int op = in.entero("Opción", 0, 4);
            if (op == 0) return;
            ejecutar(() -> {
                switch (op) {
                    case 1 -> porCurso();
                    case 2 -> todas();
                    case 3 -> matricular();
                    case 4 -> retirar();
                }
            });
        }
    }

    private void porCurso() {
        cursos.listar();
        long idCurso = in.id("ID del curso");
        Tabla.imprimir(new String[]{"ID", "Estudiante", "Grado", "Sec"},
                service.estudiantesDeCurso(idCurso).stream().map(e -> new String[]{String.valueOf(e.getId()),
                        e.getNombres() + " " + e.getApellidos(), e.getGrado(), e.getSeccion()}).toList());
    }

    private void todas() {
        Map<Long, String> est = nombres.estudiantes();
        Map<Long, String> cur = nombres.cursos();
        Tabla.imprimir(new String[]{"ID", "Curso", "Estudiante"},
                service.listar().stream().map(a -> new String[]{String.valueOf(a.getId()),
                        cur.getOrDefault(a.getIdCurso(), "—"), est.getOrDefault(a.getIdEstudiante(), "—")}).toList());
    }

    private void matricular() {
        cursos.listar();
        long idCurso = in.id("ID del curso");
        System.out.println("Estudiantes activos:");
        Tabla.imprimir(new String[]{"ID", "Estudiante", "Grado", "Sec"},
                estudiantes.listar().stream().filter(e -> "activo".equals(e.getEstado()))
                        .map(e -> new String[]{String.valueOf(e.getId()), e.getNombres() + " " + e.getApellidos(),
                                e.getGrado(), e.getSeccion()}).toList());
        long idEstudiante = in.id("ID del estudiante a matricular");
        service.matricular(idCurso, idEstudiante);
        ok("Estudiante matriculado en el curso.");
    }

    private void retirar() {
        cursos.listar();
        long idCurso = in.id("ID del curso");
        Tabla.imprimir(new String[]{"ID", "Estudiante"},
                service.estudiantesDeCurso(idCurso).stream().map((Estudiante e) -> new String[]{String.valueOf(e.getId()),
                        e.getNombres() + " " + e.getApellidos()}).toList());
        long idEstudiante = in.id("ID del estudiante a retirar");
        if (!in.confirmar("¿Retirar al estudiante de este curso?")) return;
        service.retirar(idCurso, idEstudiante);
        ok("Estudiante retirado del curso.");
    }
}
