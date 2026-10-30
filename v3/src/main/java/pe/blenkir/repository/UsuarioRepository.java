package pe.blenkir.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.blenkir.model.Usuario;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsuarioIgnoreCase(String usuario);
    boolean existsByUsuarioIgnoreCase(String usuario);
    boolean existsByUsuarioIgnoreCaseAndIdNot(String usuario, Long id);
    Optional<Usuario> findByIdEstudiante(Long idEstudiante);
    Optional<Usuario> findByIdDocente(Long idDocente);
}
