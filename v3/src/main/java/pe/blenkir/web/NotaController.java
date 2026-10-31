package pe.blenkir.web;

import pe.blenkir.service.SesionService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import pe.blenkir.model.Nota;
import pe.blenkir.service.NotaService;

import java.util.List;

@RestController
@RequestMapping("/api/notas")
public class NotaController {

    private final NotaService service;
    private final SesionService sesion;

    public NotaController(NotaService service, SesionService sesion) { this.service = service; this.sesion = sesion; }

    @GetMapping public List<Nota> listar(HttpSession s) { sesion.requerirNoApoderado(s); return service.listar(); }
    @GetMapping("/{id}") public Nota obtener(@PathVariable Long id, HttpSession s) { sesion.requerirNoApoderado(s); return service.obtener(id); }
    @PostMapping public Nota crear(@Valid @RequestBody Nota n, HttpSession s) { sesion.requerirNoApoderado(s); return service.crear(n); }
    @PutMapping("/{id}") public Nota actualizar(@PathVariable Long id, @RequestBody Nota n, HttpSession s) { sesion.requerirNoApoderado(s); return service.actualizar(id, n); }
    @DeleteMapping("/{id}") public void eliminar(@PathVariable Long id, HttpSession s) { sesion.requerirNoApoderado(s); service.eliminar(id); }
}
