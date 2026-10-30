package pe.blenkir.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.blenkir.model.*;

public interface CursoRepository extends JpaRepository<Curso, Long> {
    boolean existsByIdDocente(Long idDocente);
}
