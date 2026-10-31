package pe.blenkir.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "apoderado_estudiante", uniqueConstraints =
        @UniqueConstraint(name = "uq_apoderado_estudiante", columnNames = {"apoderado_id", "estudiante_id"}))
public class ApoderadoEstudiante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "apoderado_id", nullable = false)
    private Long apoderadoId;

    @Column(name = "estudiante_id", nullable = false)
    private Long estudianteId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apoderado_id", insertable = false, updatable = false)
    private Apoderado apoderado;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", insertable = false, updatable = false)
    private Estudiante estudiante;

    @NotBlank
    @Column(nullable = false, length = 40)
    private String parentesco = "Apoderado";

    @Column(name = "puede_ver_notas", nullable = false)
    private boolean puedeVerNotas = true;
    @Column(name = "puede_ver_asistencia", nullable = false)
    private boolean puedeVerAsistencia = true;
    @Column(name = "puede_ver_alertas", nullable = false)
    private boolean puedeVerAlertas = true;
    @Column(nullable = false)
    private boolean activo = true;

    public Long getId() { return id; }
    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }
    public Long getEstudianteId() { return estudianteId; }
    public void setEstudianteId(Long estudianteId) { this.estudianteId = estudianteId; }
    public String getParentesco() { return parentesco; }
    public void setParentesco(String parentesco) { this.parentesco = parentesco; }
    public boolean isPuedeVerNotas() { return puedeVerNotas; }
    public void setPuedeVerNotas(boolean puedeVerNotas) { this.puedeVerNotas = puedeVerNotas; }
    public boolean isPuedeVerAsistencia() { return puedeVerAsistencia; }
    public void setPuedeVerAsistencia(boolean puedeVerAsistencia) { this.puedeVerAsistencia = puedeVerAsistencia; }
    public boolean isPuedeVerAlertas() { return puedeVerAlertas; }
    public void setPuedeVerAlertas(boolean puedeVerAlertas) { this.puedeVerAlertas = puedeVerAlertas; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
}
