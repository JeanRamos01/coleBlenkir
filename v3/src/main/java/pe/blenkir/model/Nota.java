package pe.blenkir.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;

@Entity
@Table(name = "notas")
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull @Positive @Column(name = "id_curso", nullable = false)
    private Long idCurso;
    @NotNull @Positive @Column(name = "id_estudiante", nullable = false)
    private Long idEstudiante;
    @NotNull @Min(1) @Max(4)
    private Integer bimestre;
    @NotNull @DecimalMin("0.0") @DecimalMax("20.0")
    private Double calificacion;
    private LocalDate fecha;

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
    public Integer getBimestre() { return bimestre; }
    public void setBimestre(Integer bimestre) { this.bimestre = bimestre; }
    public Double getCalificacion() { return calificacion; }
    public void setCalificacion(Double calificacion) { this.calificacion = calificacion; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
}
