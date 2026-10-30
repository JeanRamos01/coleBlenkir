package pe.blenkir.service;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.blenkir.model.Nota;
import pe.blenkir.repository.CursoRepository;
import pe.blenkir.repository.EstudianteRepository;
import pe.blenkir.repository.NotaRepository;

import java.time.LocalDate;
import java.util.List;

@Service
public class NotaService {

    private final NotaRepository repo;
    private final CursoRepository cursos;
    private final EstudianteRepository estudiantes;
    private final MatriculaService matriculas;

    public NotaService(NotaRepository repo, CursoRepository cursos, EstudianteRepository estudiantes, MatriculaService matriculas) {
        this.repo = repo;
        this.cursos = cursos;
        this.estudiantes = estudiantes;
        this.matriculas = matriculas;
    }

    @Transactional(readOnly = true)
    public List<Nota> listar() { return repo.findAll(Sort.by("id")); }

    @Transactional(readOnly = true)
    public Nota obtener(Long id) {
        return repo.findById(id).orElseThrow(() -> new NoEncontradoException("No existe la nota con ID " + id + "."));
    }

    @Transactional
    public Nota crear(Nota d) {
        if (d.getIdCurso() == null || d.getIdEstudiante() == null) throw new ReglaNegocioException("Curso y estudiante son obligatorios.");
        if (!cursos.existsById(d.getIdCurso())) throw new NoEncontradoException("No existe el curso con ID " + d.getIdCurso() + ".");
        if (!estudiantes.existsById(d.getIdEstudiante())) throw new NoEncontradoException("No existe el estudiante con ID " + d.getIdEstudiante() + ".");
        if (!matriculas.estaMatriculado(d.getIdCurso(), d.getIdEstudiante())) {
            throw new ReglaNegocioException("El estudiante no está matriculado en ese curso.");
        }
        Nota n = new Nota();
        n.setIdCurso(d.getIdCurso());
        n.setIdEstudiante(d.getIdEstudiante());
        n.setBimestre(Validar.entre(d.getBimestre(), 1, 4, "bimestre"));
        n.setCalificacion(calificacion(d.getCalificacion()));
        n.setFecha(LocalDate.now());
        return repo.save(n);
    }

    /** Solo se puede cambiar bimestre y calificación. */
    @Transactional
    public Nota actualizar(Long id, Nota d) {
        Nota n = obtener(id);
        n.setBimestre(Validar.entre(d.getBimestre(), 1, 4, "bimestre"));
        n.setCalificacion(calificacion(d.getCalificacion()));
        return repo.save(n);
    }

    @Transactional
    public void eliminar(Long id) { repo.delete(obtener(id)); }

    private double calificacion(Double valor) {
        if (valor == null || valor < 0 || valor > 20) {
            throw new ReglaNegocioException("La calificación debe estar entre 0 y 20.");
        }
        return Math.round(valor * 10.0) / 10.0;
    }
}
