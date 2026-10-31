package pe.blenkir.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.blenkir.model.ApoderadoEstudiante;
import java.util.List;

public interface ApoderadoEstudianteRepository extends JpaRepository<ApoderadoEstudiante, Long> {
    List<ApoderadoEstudiante> findByApoderadoIdAndActivoTrueOrderById(Long apoderadoId);
    List<ApoderadoEstudiante> findByApoderadoIdOrderById(Long apoderadoId);
    void deleteByApoderadoId(Long apoderadoId);
}
