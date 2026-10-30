package pe.blenkir.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "docentes")
public class Docente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 120) private String nombres;
    @NotBlank @Size(max = 120) private String especialidad;
    @NotBlank @Email @Size(max = 150) private String email;
    private String estado;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getEspecialidad() { return especialidad; }
    public void setEspecialidad(String especialidad) { this.especialidad = especialidad; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
