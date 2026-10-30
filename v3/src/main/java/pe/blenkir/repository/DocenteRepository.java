package pe.blenkir.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.blenkir.model.*;

public interface DocenteRepository extends JpaRepository<Docente, Long> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
}
