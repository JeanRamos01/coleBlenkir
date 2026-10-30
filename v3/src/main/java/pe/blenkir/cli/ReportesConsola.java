package pe.blenkir.cli;

import org.springframework.stereotype.Component;
import pe.blenkir.service.*;

import java.util.List;

@Component
public class ReportesConsola extends ModuloConsola {

    private final ReporteService reportes;
    private final EstudianteService estudiantes;
    private final DocenteService docentes;
    private final CursoService cursos;
    private final NotaService notas;
    private final AsistenciaService asistencias;

    public ReportesConsola(Entrada in, ReporteService reportes, EstudianteService estudiantes, DocenteService docentes,
                           CursoService cursos, NotaService notas, AsistenciaService asistencias) {
        super(in);
        this.reportes = reportes;
        this.estudiantes = estudiantes;
        this.docentes = docentes;
        this.cursos = cursos;
        this.notas = notas;
        this.asistencias = asistencias;
    }

    @Override
    public void abrir() {
        while (true) {
            titulo("REPORTES");
            System.out.println(" 1) Resumen general\n 2) Ranking de rendimiento (promedios)\n 3) Asistencia por estudiante\n 0) Volver");
            int op = in.entero("Opción", 0, 3);
            if (op == 0) return;
            ejecutar(() -> {
                switch (op) {
                    case 1 -> resumen();
                    case 2 -> ranking();
                    case 3 -> asistencia();
                }
            });
        }
    }

    private void resumen() {
        long activos = estudiantes.listar().stream().filter(e -> "activo".equals(e.getEstado())).count();
        Tabla.imprimir(new String[]{"Concepto", "Cantidad"}, List.of(
                new String[]{"Estudiantes activos", String.valueOf(activos)},
                new String[]{"Docentes", String.valueOf(docentes.listar().size())},
                new String[]{"Cursos", String.valueOf(cursos.listar().size())},
                new String[]{"Notas registradas", String.valueOf(notas.listar().size())},
                new String[]{"Asistencias registradas", String.valueOf(asistencias.listar().size())}));
    }

    private void ranking() {
        int[] puesto = {0};
        Tabla.imprimir(new String[]{"#", "Estudiante", "Promedio", "Notas"},
                reportes.ranking().stream().map(r -> new String[]{String.valueOf(++puesto[0]),
                        r.estudiante().getNombres() + " " + r.estudiante().getApellidos(),
                        String.format("%.1f", r.promedio()), String.valueOf(r.cantidadNotas())}).toList());
    }

    private void asistencia() {
        Tabla.imprimir(new String[]{"Estudiante", "Presente", "Tardanza", "Inasistencia", "% Asistencia"},
                reportes.asistenciaPorEstudiante().stream().map(r -> new String[]{
                        r.estudiante().getNombres() + " " + r.estudiante().getApellidos(),
                        String.valueOf(r.presente()), String.valueOf(r.tardanza()), String.valueOf(r.inasistencia()),
                        r.porcentaje() + "%"}).toList());
    }
}
