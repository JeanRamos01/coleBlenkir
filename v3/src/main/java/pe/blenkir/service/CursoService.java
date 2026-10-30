package pe.blenkir.service;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.blenkir.model.Curso;
import pe.blenkir.model.Docente;
import pe.blenkir.repository.CursoRepository;
import pe.blenkir.repository.DocenteRepository;

import java.util.List;

@Service
public class CursoService {

    private final CursoRepository repo;
    private final DocenteRepository docentes;

    public CursoService(CursoRepository repo, DocenteRepository docentes) {
        this.repo = repo;
        this.docentes = docentes;
    }

    @Transactional(readOnly = true)
    public List<Curso> listar() { return repo.findAll(Sort.by("id")); }

    @Transactional(readOnly = true)
    public Curso obtener(Long id) {
        return repo.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el curso con ID " + id + "."));
    }

    @Transactional
    public Curso crear(Curso d) {
        Curso c = new Curso();
        aplicar(c, d);
        return repo.save(c);
    }

    @Transactional
    public Curso actualizar(Long id, Curso d) {
        Curso c = obtener(id);
        aplicar(c, d);
        return repo.save(c);
    }

    /** Borra también matrículas, notas y asistencias del curso (ON DELETE CASCADE). */
    @Transactional
    public void eliminar(Long id) { repo.delete(obtener(id)); }

    private void aplicar(Curso destino, Curso d) {
        destino.setNombre(Validar.texto(d.getNombre(), "nombre"));
        destino.setCreditos(Validar.entre(d.getCreditos(), 1, 10, "créditos"));
        if (d.getIdDocente() == null) throw new ReglaNegocioException("Debes elegir un docente.");
        Docente doc = docentes.findById(d.getIdDocente())
                .orElseThrow(() -> new NoEncontradoException("No existe el docente con ID " + d.getIdDocente() + "."));
        if (!"activo".equals(doc.getEstado())) throw new ReglaNegocioException("El docente está inactivo.");
        destino.setIdDocente(doc.getId());
    }
}
