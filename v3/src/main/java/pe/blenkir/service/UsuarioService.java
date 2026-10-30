package pe.blenkir.service;

import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.blenkir.model.Usuario;
import pe.blenkir.repository.DocenteRepository;
import pe.blenkir.repository.EstudianteRepository;
import pe.blenkir.repository.UsuarioRepository;
import java.util.List; import java.util.Optional;

@Service
public class UsuarioService {
    public static final List<String> TIPOS=List.of("Administrador","Docente","Alumno");
    private final UsuarioRepository repo; private final EstudianteRepository estudiantes; private final DocenteRepository docentes; private final PasswordEncoder encoder;
    public UsuarioService(UsuarioRepository repo,EstudianteRepository estudiantes,DocenteRepository docentes,PasswordEncoder encoder){this.repo=repo;this.estudiantes=estudiantes;this.docentes=docentes;this.encoder=encoder;}
    @Transactional(readOnly=true) public Optional<Usuario> login(String usuario,String password){if(usuario==null||password==null)return Optional.empty();return repo.findByUsuarioIgnoreCase(usuario.trim()).filter(u->encoder.matches(password,u.getPasswordHash()));}
    @Transactional(readOnly=true)
    public boolean cuentaActiva(Usuario u) {
        if ("Alumno".equals(u.getTipo()) && u.getIdEstudiante() != null) {
            return estudiantes.findById(u.getIdEstudiante())
                    .map(e -> "activo".equalsIgnoreCase(e.getEstado())).orElse(false);
        }
        if ("Docente".equals(u.getTipo()) && u.getIdDocente() != null) {
            return docentes.findById(u.getIdDocente())
                    .map(d -> "activo".equalsIgnoreCase(d.getEstado())).orElse(false);
        }
        return true; // Administrador
    }

    @Transactional(readOnly=true) public List<Usuario> listar(){return repo.findAll(Sort.by("id"));}
    @Transactional(readOnly=true) public Usuario obtener(Long id){return repo.findById(id).orElseThrow(()->new NoEncontradoException("No existe el usuario con ID "+id+"."));}

    @Transactional public Usuario crear(String usuario,String password,String tipo,String nombre,Long idEstudiante,Long idDocente){
        String login=Validar.texto(usuario,"usuario"); if(repo.existsByUsuarioIgnoreCase(login))throw new ReglaNegocioException("Ya existe el usuario '"+login+"'.");
        Usuario u=new Usuario(); u.setUsuario(login); u.setPasswordHash(hash(password)); u.setTipo(Validar.uno(tipo,TIPOS,"tipo")); u.setNombre(Validar.texto(nombre,"nombre"));
        aplicarVinculo(u,idEstudiante,idDocente); return repo.save(u);
    }
    @Transactional public Usuario actualizar(Long id,String usuario,String password,String tipo,String nombre,Long idEstudiante,Long idDocente){
        Usuario u=obtener(id); String login=Validar.texto(usuario,"usuario");
        if(repo.existsByUsuarioIgnoreCaseAndIdNot(login,id))throw new ReglaNegocioException("Ya existe el usuario '"+login+"'.");
        String nuevoTipo=Validar.uno(tipo,TIPOS,"tipo"); if(esUltimoAdmin(u)&&!"Administrador".equals(nuevoTipo))throw new ReglaNegocioException("No puedes cambiar el tipo del único administrador.");
        if(password!=null&&!password.isBlank())u.setPasswordHash(hash(password)); u.setUsuario(login); u.setTipo(nuevoTipo); u.setNombre(Validar.texto(nombre,"nombre")); aplicarVinculo(u,idEstudiante,idDocente); return repo.save(u);
    }
    @Transactional public void eliminar(Long id){Usuario u=obtener(id);if(esUltimoAdmin(u))throw new ReglaNegocioException("No puedes eliminar al único administrador.");repo.delete(u);}

    private void aplicarVinculo(Usuario u,Long idEstudiante,Long idDocente){
        u.setIdEstudiante(null);u.setIdDocente(null);
        if("Alumno".equals(u.getTipo())){if(idEstudiante==null||!estudiantes.existsById(idEstudiante))throw new ReglaNegocioException("El usuario Alumno debe estar vinculado a un estudiante existente.");u.setIdEstudiante(idEstudiante);}
        if("Docente".equals(u.getTipo())){if(idDocente==null||!docentes.existsById(idDocente))throw new ReglaNegocioException("El usuario Docente debe estar vinculado a un docente existente.");u.setIdDocente(idDocente);}
    }
    private boolean esUltimoAdmin(Usuario u){return "Administrador".equals(u.getTipo())&&repo.findAll().stream().filter(x->"Administrador".equals(x.getTipo())).count()<=1;}
    private String hash(String p){if(p==null||p.length()<6)throw new ReglaNegocioException("La contraseña debe tener al menos 6 caracteres.");return encoder.encode(p);}

    @Transactional public Usuario crearCuentaEstudiante(Long id,String nombres,String apellidos,String dni){
        String login="alumno."+dni; if(repo.existsByUsuarioIgnoreCase(login))throw new ReglaNegocioException("Ya existe la cuenta del estudiante "+login+".");
        return crear(login,"Blenkir@"+dni,"Alumno",nombres+" "+apellidos,id,null);
    }
    @Transactional public Usuario crearCuentaDocente(Long id,String nombres){
        String login="docente."+id; if(repo.existsByUsuarioIgnoreCase(login))throw new ReglaNegocioException("Ya existe la cuenta del docente "+login+".");
        return crear(login,"Blenkir@"+id,"Docente",nombres,null,id);
    }
    @Transactional public void sincronizarEstudiante(Long id,String nombre,String dni){repo.findByIdEstudiante(id).ifPresent(u->{u.setNombre(nombre);u.setUsuario("alumno."+dni);repo.save(u);});}
    @Transactional public void eliminarCuentaDocente(Long id){repo.findByIdDocente(id).ifPresent(repo::delete);}
    @Transactional public void eliminarCuentaEstudiante(Long id){repo.findByIdEstudiante(id).ifPresent(repo::delete);}
    @Transactional public void sincronizarDocente(Long id,String nombre){repo.findByIdDocente(id).ifPresent(u->{u.setNombre(nombre);repo.save(u);});}
}
