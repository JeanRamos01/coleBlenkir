package pe.blenkir.service;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.blenkir.model.Docente;
import pe.blenkir.repository.CursoRepository;
import pe.blenkir.repository.DocenteRepository;

import java.util.List;

@Service
public class DocenteService {

    private final DocenteRepository repo;
    private final CursoRepository cursos;
    private final UsuarioService usuarios;

    public DocenteService(DocenteRepository repo, CursoRepository cursos, UsuarioService usuarios) {
        this.repo = repo; this.cursos = cursos; this.usuarios = usuarios;
    }

    @Transactional(readOnly = true)
    public List<Docente> listar() { return repo.findAll(Sort.by("id")); }

    @Transactional(readOnly = true)
    public Docente obtener(Long id) {
        return repo.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el docente con ID " + id + "."));
    }

    @Transactional
    public Docente crear(Docente d) {
        Docente x = new Docente();
        aplicar(x, d, null);
        x.setEstado("activo");
        Docente guardado = repo.save(x);
        usuarios.crearCuentaDocente(guardado.getId(), guardado.getNombres());
        return guardado;
    }

    @Transactional
    public Docente actualizar(Long id, Docente d) {
        Docente x = obtener(id);
        aplicar(x, d, id);
        Docente guardado = repo.save(x);
        usuarios.sincronizarDocente(guardado.getId(), guardado.getNombres());
        return guardado;
    }

    @Transactional
    public Docente alternarEstado(Long id) {
        Docente x = obtener(id);
        x.setEstado("activo".equals(x.getEstado()) ? "inactivo" : "activo");
        return repo.save(x);
    }

    @Transactional
    public void eliminar(Long id) {
        Docente x = obtener(id);
        if (cursos.existsByIdDocente(id)) {
            throw new ReglaNegocioException("Este docente tiene cursos asignados. Reasigna esos cursos antes de eliminarlo.");
        }
        usuarios.eliminarCuentaDocente(id);
        repo.delete(x);
    }

    private void aplicar(Docente destino, Docente d, Long idActual) {
        String email = Validar.email(d.getEmail());
        boolean duplicado = idActual == null ? repo.existsByEmailIgnoreCase(email) : repo.existsByEmailIgnoreCaseAndIdNot(email, idActual);
        if (duplicado) throw new ReglaNegocioException("Ya existe un docente con el email " + email + ".");
        destino.setNombres(Validar.texto(d.getNombres(), "nombres"));
        destino.setEspecialidad(Validar.texto(d.getEspecialidad(), "especialidad"));
        destino.setEmail(email);
    }
}
