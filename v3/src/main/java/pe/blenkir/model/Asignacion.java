package pe.blenkir.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "asignaciones")
public class Asignacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull @Positive @Column(name = "id_curso", nullable = false)
    private Long idCurso;
    @NotNull @Positive @Column(name = "id_estudiante", nullable = false)
    private Long idEstudiante;

    @JsonIgnore @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_curso", insertable = false, updatable = false)
    private Curso curso;
    @JsonIgnore @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estudiante", insertable = false, updatable = false)
    private Estudiante estudiante;
    public Curso getCurso() { return curso; }
    public Estudiante getEstudiante() { return estudiante; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getIdCurso() { return idCurso; }
    public void setIdCurso(Long idCurso) { this.idCurso = idCurso; }
    public Long getIdEstudiante() { return idEstudiante; }
    public void setIdEstudiante(Long idEstudiante) { this.idEstudiante = idEstudiante; }
}
