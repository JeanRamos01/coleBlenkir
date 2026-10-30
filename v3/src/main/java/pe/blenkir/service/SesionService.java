package pe.blenkir.service;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

@Service
public class SesionService {
    public static final String USER_ID = "BLENKIR_USER_ID";
    public static final String ROLE = "BLENKIR_ROLE";

    public void iniciar(HttpSession session, Long id, String tipo) {
        session.setAttribute(USER_ID, id);
        session.setAttribute(ROLE, tipo);
    }

    public void requerirAdmin(HttpSession session) {
        if (!"Administrador".equals(session.getAttribute(ROLE))) {
            throw new ReglaNegocioException("Solo un administrador puede realizar esta operación.");
        }
    }

    public void cerrar(HttpSession session) { session.invalidate(); }
}
