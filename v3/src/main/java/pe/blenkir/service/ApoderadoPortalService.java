package pe.blenkir.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.blenkir.model.*;
import pe.blenkir.repository.*;

import java.time.LocalDate;
import java.util.*;

@Service
public class ApoderadoPortalService {
    public record NotaPortal(String curso, Integer bimestre, Double calificacion, LocalDate fecha) {}
    public record AsistenciaPortal(String curso, LocalDate fecha, String estado) {}
    public record AlertaPortal(String tipo, String mensaje, LocalDate fecha) {}
    public record EstudiantePortal(Long id, String nombres, String apellidos, String dni, String grado,
                                   String seccion, String estado, String parentesco,
                                   boolean puedeVerNotas, boolean puedeVerAsistencia, boolean puedeVerAlertas,
                                   Double promedio, long presentes, long tardanzas, long inasistencias,
                                   List<NotaPortal> notas, List<AsistenciaPortal> asistencias, List<AlertaPortal> alertas) {}
    public record PortalResponse(String apoderado, List<EstudiantePortal> estudiantes) {}

    private final ApoderadoRepository apoderados;
    private final ApoderadoEstudianteRepository vinculos;
    private final EstudianteRepository estudiantes;
    private final NotaRepository notas;
    private final AsistenciaRepository asistencias;
    private final CursoRepository cursos;

    public ApoderadoPortalService(ApoderadoRepository apoderados, ApoderadoEstudianteRepository vinculos,
                                  EstudianteRepository estudiantes, NotaRepository notas,
                                  AsistenciaRepository asistencias, CursoRepository cursos) {
        this.apoderados = apoderados; this.vinculos = vinculos; this.estudiantes = estudiantes;
        this.notas = notas; this.asistencias = asistencias; this.cursos = cursos;
    }

    @Transactional(readOnly = true)
    public PortalResponse consultar(Long usuarioId, String nombreApoderado) {
        Apoderado apoderado = apoderados.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new NoEncontradoException("La cuenta no tiene un perfil de apoderado configurado."));
        List<EstudiantePortal> resultado = new ArrayList<>();
        for (ApoderadoEstudiante vinculo : vinculos.findByApoderadoIdAndActivoTrueOrderById(apoderado.getId())) {
            Estudiante e = estudiantes.findById(vinculo.getEstudianteId())
                    .orElseThrow(() -> new NoEncontradoException("Uno de los estudiantes vinculados ya no existe."));
            List<NotaPortal> notasAlumno = vinculo.isPuedeVerNotas() ? notas.findByIdEstudiante(e.getId()).stream()
                    .sorted(Comparator.comparing(Nota::getFecha, Comparator.nullsLast(Comparator.<LocalDate>reverseOrder())))
                    .map(n -> new NotaPortal(nombreCurso(n.getIdCurso()), n.getBimestre(), n.getCalificacion(), n.getFecha())).toList() : List.of();
            List<AsistenciaPortal> asistAlumno = vinculo.isPuedeVerAsistencia() ? asistencias.findByIdEstudiante(e.getId()).stream()
                    .sorted(Comparator.comparing(Asistencia::getFecha, Comparator.nullsLast(Comparator.<LocalDate>reverseOrder())))
                    .map(a -> new AsistenciaPortal(nombreCurso(a.getIdCurso()), a.getFecha(), a.getEstado())).toList() : List.of();
            long presentes = asistAlumno.stream().filter(a -> "Presente".equals(a.estado())).count();
            long tardanzas = asistAlumno.stream().filter(a -> "Tardanza".equals(a.estado())).count();
            long inasistencias = asistAlumno.stream().filter(a -> "Inasistencia".equals(a.estado())).count();
            Double promedio = notasAlumno.isEmpty() ? null : Math.round(notasAlumno.stream().mapToDouble(NotaPortal::calificacion).average().orElse(0) * 10.0) / 10.0;
            List<AlertaPortal> alertas = new ArrayList<>();
            if (vinculo.isPuedeVerAlertas()) {
                if (vinculo.isPuedeVerNotas()) notasAlumno.stream().filter(n -> n.calificacion() != null && n.calificacion() < 11.0)
                        .forEach(n -> alertas.add(new AlertaPortal("ACADÉMICA", "Calificación desaprobatoria en " + n.curso() + " (" + n.calificacion() + ").", n.fecha())));
                if (vinculo.isPuedeVerAsistencia()) asistAlumno.stream().filter(a -> "Inasistencia".equals(a.estado()) || "Tardanza".equals(a.estado()))
                        .forEach(a -> alertas.add(new AlertaPortal("ASISTENCIA", a.estado() + " registrada en " + a.curso() + ".", a.fecha())));
                alertas.sort(Comparator.comparing(AlertaPortal::fecha, Comparator.nullsLast(Comparator.<LocalDate>reverseOrder())));
            }
            resultado.add(new EstudiantePortal(e.getId(), e.getNombres(), e.getApellidos(), e.getDni(), e.getGrado(), e.getSeccion(), e.getEstado(),
                    vinculo.getParentesco(), vinculo.isPuedeVerNotas(), vinculo.isPuedeVerAsistencia(), vinculo.isPuedeVerAlertas(),
                    promedio, presentes, tardanzas, inasistencias, notasAlumno, asistAlumno, alertas));
        }
        return new PortalResponse(nombreApoderado, resultado);
    }

    private String nombreCurso(Long idCurso) {
        return cursos.findById(idCurso).map(Curso::getNombre).orElse("Curso no disponible");
    }
}
