package pe.blenkir.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "usuarios")
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank @Size(max = 50) @Column(nullable = false, unique = true, length = 50) private String usuario;
    @Column(name = "password_hash", nullable = false, length = 100) private String passwordHash;
    @NotBlank @Pattern(regexp = "Administrador|Docente|Alumno") @Column(nullable = false, length = 15) private String tipo;
    @NotBlank @Size(max = 120) @Column(nullable = false, length = 120) private String nombre;
    @Column(name = "id_estudiante") private Long idEstudiante;
    @Column(name = "id_docente") private Long idDocente;

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getUsuario(){return usuario;} public void setUsuario(String usuario){this.usuario=usuario;}
    public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String passwordHash){this.passwordHash=passwordHash;}
    public String getTipo(){return tipo;} public void setTipo(String tipo){this.tipo=tipo;}
    public String getNombre(){return nombre;} public void setNombre(String nombre){this.nombre=nombre;}
    public Long getIdEstudiante(){return idEstudiante;} public void setIdEstudiante(Long idEstudiante){this.idEstudiante=idEstudiante;}
    public Long getIdDocente(){return idDocente;} public void setIdDocente(Long idDocente){this.idDocente=idDocente;}
}
