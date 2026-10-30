package pe.blenkir.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "estudiantes")
public class Estudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 100) private String nombres;
    @NotBlank @Size(max = 100) private String apellidos;
    @NotBlank @Pattern(regexp = "[0-9]{6,15}", message = "debe contener entre 6 y 15 dígitos") private String dni;
    @NotBlank @Size(max = 30) private String grado;
    @NotBlank @Pattern(regexp = "A|B|C") private String seccion;
    private String estado;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }
    public String getGrado() { return grado; }
    public void setGrado(String grado) { this.grado = grado; }
    public String getSeccion() { return seccion; }
    public void setSeccion(String seccion) { this.seccion = seccion; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
