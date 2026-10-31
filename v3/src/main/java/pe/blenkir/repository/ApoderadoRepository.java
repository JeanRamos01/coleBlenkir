package pe.blenkir.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.blenkir.model.Apoderado;
import java.util.Optional;

public interface ApoderadoRepository extends JpaRepository<Apoderado, Long> {
    Optional<Apoderado> findByUsuarioId(Long usuarioId);
    void deleteByUsuarioId(Long usuarioId);
}
