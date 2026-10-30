package pe.blenkir.web;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.blenkir.model.Usuario;
import pe.blenkir.service.SesionService;
import pe.blenkir.service.UsuarioService;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/login")
public class AuthController {
    private final UsuarioService usuarios;
    private final SesionService sesion;
    public AuthController(UsuarioService usuarios, SesionService sesion) { this.usuarios=usuarios; this.sesion=sesion; }
    public record Credenciales(String usuario, String password) {}

    @PostMapping
    public ResponseEntity<Map<String,Object>> login(@RequestBody Credenciales c, HttpSession session) {
        var encontrado = usuarios.login(c.usuario(), c.password());
        if (encontrado.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Usuario o contraseña incorrectos."));
        }
        Usuario u = encontrado.get();
        if (!usuarios.cuentaActiva(u)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Acceso denegado: tu cuenta está inactiva. Comunícate con la administración del colegio."));
        }
        sesion.iniciar(session, u.getId(), u.getTipo());
        return ResponseEntity.ok(datosSesion(u));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) { sesion.cerrar(session); return ResponseEntity.noContent().build(); }

    private Map<String,Object> datosSesion(Usuario u) {
        Map<String,Object> m=new LinkedHashMap<>();
        m.put("usuario",u.getUsuario()); m.put("tipo",u.getTipo()); m.put("nombre",u.getNombre());
        m.put("idEstudiante",u.getIdEstudiante()); m.put("idDocente",u.getIdDocente());
        return m;
    }
}
