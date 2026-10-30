package pe.blenkir.web;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
import pe.blenkir.model.Usuario;
import pe.blenkir.service.SesionService;
import pe.blenkir.service.UsuarioService;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioService service; private final SesionService sesion;
    public UsuarioController(UsuarioService service, SesionService sesion){this.service=service;this.sesion=sesion;}
    public record UsuarioDto(String usuario,String password,String tipo,String nombre,Long idEstudiante,Long idDocente) {}
    public record UsuarioResumen(Long id,String usuario,String tipo,String nombre,Long idEstudiante,Long idDocente) {}

    @GetMapping public List<UsuarioResumen> listar(HttpSession s){sesion.requerirAdmin(s);return service.listar().stream().map(this::resumen).toList();}
    @PostMapping public UsuarioResumen crear(@RequestBody UsuarioDto d,HttpSession s){sesion.requerirAdmin(s);return resumen(service.crear(d.usuario(),d.password(),d.tipo(),d.nombre(),d.idEstudiante(),d.idDocente()));}
    @PutMapping("/{id}") public UsuarioResumen actualizar(@PathVariable Long id,@RequestBody UsuarioDto d,HttpSession s){sesion.requerirAdmin(s);return resumen(service.actualizar(id,d.usuario(),d.password(),d.tipo(),d.nombre(),d.idEstudiante(),d.idDocente()));}
    @DeleteMapping("/{id}") public void eliminar(@PathVariable Long id,HttpSession s){sesion.requerirAdmin(s);service.eliminar(id);}
    private UsuarioResumen resumen(Usuario u){return new UsuarioResumen(u.getId(),u.getUsuario(),u.getTipo(),u.getNombre(),u.getIdEstudiante(),u.getIdDocente());}
}
