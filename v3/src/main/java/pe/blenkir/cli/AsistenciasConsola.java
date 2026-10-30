package pe.blenkir.cli;

import org.springframework.stereotype.Component;
import pe.blenkir.model.Asistencia;
import pe.blenkir.service.AsistenciaService;
import pe.blenkir.service.MatriculaService;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.Map;

@Component
public class AsistenciasConsola extends ModuloConsola {

    private final AsistenciaService service;
    private final MatriculaService matriculas;
    private final CursosConsola cursos;
    private final Nombres nombres;

    public AsistenciasConsola(Entrada in, AsistenciaService service, MatriculaService matriculas,
                              CursosConsola cursos, Nombres nombres) {
        super(in);
        this.service = service;
        this.matriculas = matriculas;
        this.cursos = cursos;
        this.nombres = nombres;
    }

    @Override
    public void abrir() {
        while (true) {
            titulo("ASISTENCIA");
            System.out.println(" 1) Listar\n 2) Registrar asistencia\n 3) Modificar estado\n 4) Eliminar registro\n 0) Volver");
            int op = in.entero("Opción", 0, 4);
            if (op == 0) return;
            ejecutar(() -> {
                switch (op) {
                    case 1 -> listar();
                    case 2 -> registrar();
                    case 3 -> modificar();
                    case 4 -> eliminar();
                }
            });
        }
    }

    private void listar() {
        Map<Long, String> est = nombres.estudiantes();
        Map<Long, String> cur = nombres.cursos();
        Tabla.imprimir(new String[]{"ID", "Estudiante", "Curso", "Fecha", "Estado"},
                service.listar().stream()
                        .sorted(Comparator.comparing(Asistencia::getFecha).reversed().thenComparing(Asistencia::getId))
                        .map(a -> new String[]{String.valueOf(a.getId()), est.getOrDefault(a.getIdEstudiante(), "—"),
                                cur.getOrDefault(a.getIdCurso(), "—"), String.valueOf(a.getFecha()), a.getEstado()}).toList());
    }

    private void registrar() {
        cursos.listar();
        long idCurso = in.id("ID del curso");
        System.out.println("Estudiantes matriculados en el curso:");
        Tabla.imprimir(new String[]{"ID", "Estudiante"},
                matriculas.estudiantesDeCurso(idCurso).stream()
                        .map(e -> new String[]{String.valueOf(e.getId()), e.getNombres() + " " + e.getApellidos()}).toList());
        Asistencia a = new Asistencia();
        a.setIdCurso(idCurso);
        a.setIdEstudiante(in.id("ID del estudiante"));
        a.setFecha(in.fecha("Fecha", LocalDate.now()));
        a.setEstado(in.elegir("Estado", AsistenciaService.ESTADOS));
        ok("Asistencia registrada con ID " + service.crear(a).getId() + ".");
    }

    private void modificar() {
        listar();
        Asistencia actual = service.obtener(in.id("ID del registro a modificar"));
        Asistencia a = new Asistencia();
        a.setEstado(in.elegir("Nuevo estado", AsistenciaService.ESTADOS, actual.getEstado()));
        service.actualizar(actual.getId(), a);
        ok("Asistencia actualizada.");
    }

    private void eliminar() {
        listar();
        long id = in.id("ID del registro a eliminar");
        if (!in.confirmar("¿Eliminar el registro " + id + "?")) return;
        service.eliminar(id);
        ok("Registro eliminado.");
    }
}
