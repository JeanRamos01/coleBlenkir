package pe.blenkir.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.blenkir.model.*;
import java.util.List;
import java.util.Optional;

public interface AsignacionRepository extends JpaRepository<Asignacion, Long> {
    boolean existsByIdCursoAndIdEstudiante(Long idCurso, Long idEstudiante);
    Optional<Asignacion> findByIdCursoAndIdEstudiante(Long idCurso, Long idEstudiante);
    List<Asignacion> findByIdCurso(Long idCurso);
}
