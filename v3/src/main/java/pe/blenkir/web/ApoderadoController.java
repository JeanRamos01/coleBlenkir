package pe.blenkir.web;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.blenkir.service.ApoderadoPortalService;
import pe.blenkir.service.SesionService;

@RestController
@RequestMapping("/api/apoderado")
public class ApoderadoController {
    private final ApoderadoPortalService portal;
    private final SesionService sesion;

    public ApoderadoController(ApoderadoPortalService portal, SesionService sesion) {
        this.portal = portal; this.sesion = sesion;
    }

    @GetMapping("/portal")
    public ApoderadoPortalService.PortalResponse portal(HttpSession session) {
        sesion.requerirRol(session, "APODERADO");
        Long usuarioId = sesion.requerirUsuario(session);
        Object nombre = session.getAttribute("BLENKIR_USER_NAME");
        return portal.consultar(usuarioId, nombre == null ? "Apoderado" : nombre.toString());
    }
}
