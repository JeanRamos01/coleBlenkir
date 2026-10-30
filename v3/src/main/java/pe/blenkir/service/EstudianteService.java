package pe.blenkir.service;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.blenkir.model.Estudiante;
import pe.blenkir.repository.EstudianteRepository;

import java.util.List;

@Service
public class EstudianteService {

    public static final List<String> GRADOS = List.of(
            "1ro Secundaria", "2do Secundaria", "3ro Secundaria", "4to Secundaria", "5to Secundaria");
    public static final List<String> SECCIONES = List.of("A", "B", "C");

    private final EstudianteRepository repo;
    private final UsuarioService usuarios;

    public EstudianteService(EstudianteRepository repo, UsuarioService usuarios) { this.repo = repo; this.usuarios = usuarios; }

    @Transactional(readOnly = true)
    public List<Estudiante> listar() { return repo.findAll(Sort.by("id")); }

    @Transactional(readOnly = true)
    public Estudiante obtener(Long id) {
        return repo.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el estudiante con ID " + id + "."));
    }

    @Transactional
    public Estudiante crear(Estudiante d) {
        Estudiante e = new Estudiante();
        aplicar(e, d, null);
        e.setEstado("activo");
        Estudiante guardado = repo.save(e);
        usuarios.crearCuentaEstudiante(guardado.getId(), guardado.getNombres(), guardado.getApellidos(), guardado.getDni());
        return guardado;
    }

    @Transactional
    public Estudiante actualizar(Long id, Estudiante d) {
        Estudiante e = obtener(id);
        aplicar(e, d, id);
        Estudiante guardado = repo.save(e);
        usuarios.sincronizarEstudiante(guardado.getId(), guardado.getNombres()+" "+guardado.getApellidos(), guardado.getDni());
        return guardado;
    }

    @Transactional
    public Estudiante alternarEstado(Long id) {
        Estudiante e = obtener(id);
        e.setEstado("activo".equals(e.getEstado()) ? "inactivo" : "activo");
        return repo.save(e);
    }

    /** Borra también sus matrículas, notas, asistencias y usuario (ON DELETE CASCADE en la BD). */
    @Transactional
    public void eliminar(Long id) { usuarios.eliminarCuentaEstudiante(id); repo.delete(obtener(id)); }

    private void aplicar(Estudiante destino, Estudiante d, Long idActual) {
        String dni = Validar.dni(d.getDni());
        boolean duplicado = idActual == null ? repo.existsByDni(dni) : repo.existsByDniAndIdNot(dni, idActual);
        if (duplicado) throw new ReglaNegocioException("Ya existe un estudiante con el DNI " + dni + ".");
        destino.setNombres(Validar.texto(d.getNombres(), "nombres"));
        destino.setApellidos(Validar.texto(d.getApellidos(), "apellidos"));
        destino.setDni(dni);
        destino.setGrado(Validar.uno(d.getGrado(), GRADOS, "grado"));
        destino.setSeccion(Validar.uno(d.getSeccion(), SECCIONES, "sección"));
    }
}
