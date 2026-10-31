package pe.blenkir.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.blenkir.model.*;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    boolean existsByDni(String dni);
    java.util.Optional<Estudiante> findByDni(String dni);
    boolean existsByDniAndIdNot(String dni, Long id);
}
