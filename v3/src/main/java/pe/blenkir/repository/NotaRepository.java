package pe.blenkir.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.blenkir.model.*;
import java.util.List;

public interface NotaRepository extends JpaRepository<Nota, Long> {
    List<Nota> findByIdEstudiante(Long idEstudiante);
    List<Nota> findByIdCurso(Long idCurso);
}
