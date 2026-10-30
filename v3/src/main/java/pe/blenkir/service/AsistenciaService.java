package pe.blenkir.service;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.blenkir.model.Asistencia;
import pe.blenkir.repository.AsistenciaRepository;
import pe.blenkir.repository.CursoRepository;
import pe.blenkir.repository.EstudianteRepository;

import java.util.List;

@Service
public class AsistenciaService {

    public static final List<String> ESTADOS = List.of("Presente", "Tardanza", "Inasistencia");

    private final AsistenciaRepository repo;
    private final CursoRepository cursos;
    private final EstudianteRepository estudiantes;
    private final MatriculaService matriculas;

    public AsistenciaService(AsistenciaRepository repo, CursoRepository cursos, EstudianteRepository estudiantes, MatriculaService matriculas) {
        this.repo = repo;
        this.cursos = cursos;
        this.estudiantes = estudiantes;
        this.matriculas = matriculas;
    }

    @Transactional(readOnly = true)
    public List<Asistencia> listar() { return repo.findAll(Sort.by("id")); }

    @Transactional(readOnly = true)
    public Asistencia obtener(Long id) {
        return repo.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el registro de asistencia con ID " + id + "."));
    }

    @Transactional
    public Asistencia crear(Asistencia d) {
        if (d.getIdCurso() == null || d.getIdEstudiante() == null) throw new ReglaNegocioException("Curso y estudiante son obligatorios.");
        if (d.getFecha() == null) throw new ReglaNegocioException("La fecha es obligatoria.");
        if (!cursos.existsById(d.getIdCurso())) throw new NoEncontradoException("No existe el curso con ID " + d.getIdCurso() + ".");
        if (!estudiantes.existsById(d.getIdEstudiante())) throw new NoEncontradoException("No existe el estudiante con ID " + d.getIdEstudiante() + ".");
        if (!matriculas.estaMatriculado(d.getIdCurso(), d.getIdEstudiante())) {
            throw new ReglaNegocioException("El estudiante no está matriculado en ese curso.");
        }
        if (repo.existsByIdCursoAndIdEstudianteAndFecha(d.getIdCurso(), d.getIdEstudiante(), d.getFecha())) {
            throw new ReglaNegocioException("Ya hay asistencia registrada para ese estudiante, curso y fecha. Modifica el registro existente.");
        }
        Asistencia a = new Asistencia();
        a.setIdCurso(d.getIdCurso());
        a.setIdEstudiante(d.getIdEstudiante());
        a.setFecha(d.getFecha());
        a.setEstado(Validar.uno(d.getEstado(), ESTADOS, "estado"));
        return repo.save(a);
    }

    /** Solo se puede cambiar el estado (Presente / Tardanza / Inasistencia). */
    @Transactional
    public Asistencia actualizar(Long id, Asistencia d) {
        Asistencia a = obtener(id);
        a.setEstado(Validar.uno(d.getEstado(), ESTADOS, "estado"));
        return repo.save(a);
    }

    @Transactional
    public void eliminar(Long id) { repo.delete(obtener(id)); }
}
