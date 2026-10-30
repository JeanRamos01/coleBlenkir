package pe.blenkir.service;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.blenkir.model.Asignacion;
import pe.blenkir.model.Estudiante;
import pe.blenkir.repository.AsignacionRepository;
import pe.blenkir.repository.CursoRepository;
import pe.blenkir.repository.EstudianteRepository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Matrícula de estudiantes en cursos (tabla asignaciones). */
@Service
public class MatriculaService {

    private final AsignacionRepository repo;
    private final CursoRepository cursos;
    private final EstudianteRepository estudiantes;

    public MatriculaService(AsignacionRepository repo, CursoRepository cursos, EstudianteRepository estudiantes) {
        this.repo = repo;
        this.cursos = cursos;
        this.estudiantes = estudiantes;
    }

    @Transactional(readOnly = true)
    public List<Asignacion> listar() { return repo.findAll(Sort.by("id")); }

    /** Estudiantes ACTIVOS matriculados en un curso. */
    @Transactional(readOnly = true)
    public List<Estudiante> estudiantesDeCurso(Long idCurso) {
        Set<Long> ids = repo.findByIdCurso(idCurso).stream().map(Asignacion::getIdEstudiante).collect(Collectors.toSet());
        return estudiantes.findAll(Sort.by("id")).stream()
                .filter(e -> ids.contains(e.getId()) && "activo".equals(e.getEstado()))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean estaMatriculado(Long idCurso, Long idEstudiante) {
        return repo.existsByIdCursoAndIdEstudiante(idCurso, idEstudiante);
    }

    @Transactional
    public Asignacion matricular(Long idCurso, Long idEstudiante) {
        if (idCurso == null || idEstudiante == null) throw new ReglaNegocioException("Curso y estudiante son obligatorios.");
        if (!cursos.existsById(idCurso)) throw new NoEncontradoException("No existe el curso con ID " + idCurso + ".");
        Estudiante e = estudiantes.findById(idEstudiante)
                .orElseThrow(() -> new NoEncontradoException("No existe el estudiante con ID " + idEstudiante + "."));
        if (!"activo".equals(e.getEstado())) throw new ReglaNegocioException("El estudiante está inactivo.");
        if (repo.existsByIdCursoAndIdEstudiante(idCurso, idEstudiante)) {
            throw new ReglaNegocioException("El estudiante ya está matriculado en ese curso.");
        }
        Asignacion a = new Asignacion();
        a.setIdCurso(idCurso);
        a.setIdEstudiante(idEstudiante);
        return repo.save(a);
    }

    @Transactional
    public void retirar(Long idCurso, Long idEstudiante) {
        Asignacion a = repo.findByIdCursoAndIdEstudiante(idCurso, idEstudiante)
                .orElseThrow(() -> new NoEncontradoException("El estudiante no está matriculado en ese curso."));
        repo.delete(a);
    }
}
