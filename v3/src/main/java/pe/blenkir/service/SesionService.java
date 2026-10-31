package pe.blenkir.service;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SesionService {
    public static final String USER_ID = "BLENKIR_USER_ID";
    public static final String ROLE = "BLENKIR_ROLE";

    public void iniciar(HttpSession session, Long id, String tipo) {
        session.setAttribute(USER_ID, id);
        session.setAttribute(ROLE, tipo);
    }

    public Long requerirUsuario(HttpSession session) {
        if (session == null || session.getAttribute(USER_ID) == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesión para continuar.");
        }
        return (Long) session.getAttribute(USER_ID);
    }

    public void requerirRol(HttpSession session, String tipo) {
        requerirUsuario(session);
        if (!tipo.equals(session.getAttribute(ROLE))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para realizar esta operación.");
        }
    }

    public void requerirNoApoderado(HttpSession session) {
        requerirUsuario(session);
        if ("APODERADO".equals(session.getAttribute(ROLE))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accede a la información desde el portal de apoderados.");
        }
    }

    public void requerirAdmin(HttpSession session) { requerirRol(session, "Administrador"); }

    public void cerrar(HttpSession session) { if (session != null) session.invalidate(); }
}
