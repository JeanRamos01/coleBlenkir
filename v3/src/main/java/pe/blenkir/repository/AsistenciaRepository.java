package pe.blenkir.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.blenkir.model.*;
import java.time.LocalDate;
import java.util.List;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {
    boolean existsByIdCursoAndIdEstudianteAndFecha(Long idCurso, Long idEstudiante, LocalDate fecha);
    List<Asistencia> findByIdEstudiante(Long idEstudiante);
}
