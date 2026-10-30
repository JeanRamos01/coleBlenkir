package pe.blenkir.cli;

import org.springframework.stereotype.Component;
import pe.blenkir.model.Nota;
import pe.blenkir.service.MatriculaService;
import pe.blenkir.service.NotaService;

import java.util.Comparator;
import java.util.Map;

@Component
public class NotasConsola extends ModuloConsola {

    private final NotaService service;
    private final MatriculaService matriculas;
    private final CursosConsola cursos;
    private final Nombres nombres;

    public NotasConsola(Entrada in, NotaService service, MatriculaService matriculas, CursosConsola cursos, Nombres nombres) {
        super(in);
        this.service = service;
        this.matriculas = matriculas;
        this.cursos = cursos;
        this.nombres = nombres;
    }

    @Override
    public void abrir() {
        while (true) {
            titulo("CALIFICACIONES");
            System.out.println(" 1) Listar todas\n 2) Listar por curso\n 3) Registrar nota\n 4) Modificar nota\n 5) Eliminar nota\n 0) Volver");
            int op = in.entero("Opción", 0, 5);
            if (op == 0) return;
            ejecutar(() -> {
                switch (op) {
                    case 1 -> listar(null);
                    case 2 -> { cursos.listar(); listar(in.id("ID del curso")); }
                    case 3 -> registrar();
                    case 4 -> modificar();
                    case 5 -> eliminar();
                }
            });
        }
    }

    private void listar(Long idCurso) {
        Map<Long, String> est = nombres.estudiantes();
        Map<Long, String> cur = nombres.cursos();
        Tabla.imprimir(new String[]{"ID", "Estudiante", "Curso", "Bim", "Nota", "Fecha"},
                service.listar().stream()
                        .filter(n -> idCurso == null || n.getIdCurso().equals(idCurso))
                        .sorted(Comparator.comparing(Nota::getId))
                        .map(n -> new String[]{String.valueOf(n.getId()), est.getOrDefault(n.getIdEstudiante(), "—"),
                                cur.getOrDefault(n.getIdCurso(), "—"), String.valueOf(n.getBimestre()),
                                String.format("%.1f", n.getCalificacion()), String.valueOf(n.getFecha())}).toList());
    }

    private void registrar() {
        cursos.listar();
        long idCurso = in.id("ID del curso");
        System.out.println("Estudiantes matriculados en el curso:");
        Tabla.imprimir(new String[]{"ID", "Estudiante"},
                matriculas.estudiantesDeCurso(idCurso).stream()
                        .map(e -> new String[]{String.valueOf(e.getId()), e.getNombres() + " " + e.getApellidos()}).toList());
        Nota n = new Nota();
        n.setIdCurso(idCurso);
        n.setIdEstudiante(in.id("ID del estudiante"));
        n.setBimestre(in.entero("Bimestre (1-4)", 1, 4));
        n.setCalificacion(in.decimal("Calificación (0-20)", 0, 20, null));
        ok("Nota registrada con ID " + service.crear(n).getId() + ".");
    }

    private void modificar() {
        listar(null);
        Nota actual = service.obtener(in.id("ID de la nota a modificar"));
        System.out.println("(Enter conserva el valor actual)");
        Nota n = new Nota();
        n.setBimestre(in.entero("Bimestre (1-4)", 1, 4, actual.getBimestre()));
        n.setCalificacion(in.decimal("Calificación (0-20)", 0, 20, actual.getCalificacion()));
        service.actualizar(actual.getId(), n);
        ok("Nota actualizada.");
    }

    private void eliminar() {
        listar(null);
        long id = in.id("ID de la nota a eliminar");
        if (!in.confirmar("¿Eliminar la nota " + id + "?")) return;
        service.eliminar(id);
        ok("Nota eliminada.");
    }
}
