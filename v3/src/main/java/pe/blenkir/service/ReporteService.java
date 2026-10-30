package pe.blenkir.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.blenkir.model.Asistencia;
import pe.blenkir.model.Estudiante;
import pe.blenkir.model.Nota;
import pe.blenkir.repository.AsistenciaRepository;
import pe.blenkir.repository.EstudianteRepository;
import pe.blenkir.repository.NotaRepository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Reportes para la consola (la web los calcula en el navegador con los mismos datos). */
@Service
public class ReporteService {

    public record Rendimiento(Estudiante estudiante, double promedio, int cantidadNotas) {}
    public record ResumenAsistencia(Estudiante estudiante, long presente, long tardanza, long inasistencia, long porcentaje) {}

    private final EstudianteRepository estudiantes;
    private final NotaRepository notas;
    private final AsistenciaRepository asistencias;

    public ReporteService(EstudianteRepository estudiantes, NotaRepository notas, AsistenciaRepository asistencias) {
        this.estudiantes = estudiantes;
        this.notas = notas;
        this.asistencias = asistencias;
    }

    @Transactional(readOnly = true)
    public List<Rendimiento> ranking() {
        Map<Long, List<Nota>> porEstudiante = notas.findAll().stream().collect(Collectors.groupingBy(Nota::getIdEstudiante));
        return estudiantes.findAll().stream()
                .filter(e -> porEstudiante.containsKey(e.getId()))
                .map(e -> {
                    List<Nota> ns = porEstudiante.get(e.getId());
                    double prom = ns.stream().mapToDouble(Nota::getCalificacion).average().orElse(0);
                    return new Rendimiento(e, prom, ns.size());
                })
                .sorted(Comparator.comparingDouble(Rendimiento::promedio).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResumenAsistencia> asistenciaPorEstudiante() {
        Map<Long, List<Asistencia>> porEstudiante = asistencias.findAll().stream().collect(Collectors.groupingBy(Asistencia::getIdEstudiante));
        return estudiantes.findAll().stream()
                .filter(e -> porEstudiante.containsKey(e.getId()))
                .map(e -> {
                    List<Asistencia> rs = porEstudiante.get(e.getId());
                    long p = rs.stream().filter(a -> "Presente".equals(a.getEstado())).count();
                    long t = rs.stream().filter(a -> "Tardanza".equals(a.getEstado())).count();
                    long i = rs.stream().filter(a -> "Inasistencia".equals(a.getEstado())).count();
                    return new ResumenAsistencia(e, p, t, i, Math.round((p + t) * 100.0 / rs.size()));
                })
                .toList();
    }
}
