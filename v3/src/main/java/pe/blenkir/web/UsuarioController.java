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
    private final UsuarioService service;
    private final SesionService sesion;
    public UsuarioController(UsuarioService service, SesionService sesion) { this.service = service; this.sesion = sesion; }

    public record UsuarioDto(String usuario, String password, String tipo, String nombre,
                             Long idEstudiante, Long idDocente,
                             List<UsuarioService.VinculoApoderadoInput> vinculos) {}
    public record UsuarioResumen(Long id, String usuario, String tipo, String nombre, Long idEstudiante,
                                 Long idDocente, List<UsuarioService.VinculoApoderadoInput> vinculosApoderado) {}

    @GetMapping public List<UsuarioResumen> listar(HttpSession s) {
        sesion.requerirAdmin(s);
        return service.listar().stream().map(this::resumen).toList();
    }
    @PostMapping public UsuarioResumen crear(@RequestBody UsuarioDto d, HttpSession s) {
        sesion.requerirAdmin(s);
        Usuario u = "APODERADO".equals(d.tipo())
                ? service.crearApoderado(d.usuario(), d.password(), d.nombre(), d.vinculos())
                : service.crear(d.usuario(), d.password(), d.tipo(), d.nombre(), d.idEstudiante(), d.idDocente());
        return resumen(u);
    }
    @PutMapping("/{id}") public UsuarioResumen actualizar(@PathVariable Long id, @RequestBody UsuarioDto d, HttpSession s) {
        sesion.requerirAdmin(s);
        Usuario u = "APODERADO".equals(d.tipo()) || "APODERADO".equals(service.obtener(id).getTipo())
                ? service.actualizarApoderado(id, d.usuario(), d.password(), d.tipo(), d.nombre(), d.idEstudiante(), d.idDocente(), d.vinculos())
                : service.actualizar(id, d.usuario(), d.password(), d.tipo(), d.nombre(), d.idEstudiante(), d.idDocente());
        return resumen(u);
    }
    @DeleteMapping("/{id}") public void eliminar(@PathVariable Long id, HttpSession s) { sesion.requerirAdmin(s); service.eliminar(id); }

    private UsuarioResumen resumen(Usuario u) {
        List<UsuarioService.VinculoApoderadoInput> vinculados = "APODERADO".equals(u.getTipo())
                ? service.listarVinculosApoderado(u.getId()) : List.of();
        return new UsuarioResumen(u.getId(), u.getUsuario(), u.getTipo(), u.getNombre(), u.getIdEstudiante(), u.getIdDocente(), vinculados);
    }
}
