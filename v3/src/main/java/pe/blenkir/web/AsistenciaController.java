package pe.blenkir.web;

import pe.blenkir.service.SesionService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import pe.blenkir.model.Asistencia;
import pe.blenkir.service.AsistenciaService;

import java.util.List;

@RestController
@RequestMapping("/api/asistencias")
public class AsistenciaController {

    private final AsistenciaService service;
    private final SesionService sesion;

    public AsistenciaController(AsistenciaService service, SesionService sesion) { this.service = service; this.sesion = sesion; }

    @GetMapping public List<Asistencia> listar(HttpSession s) { sesion.requerirNoApoderado(s); return service.listar(); }
    @GetMapping("/{id}") public Asistencia obtener(@PathVariable Long id, HttpSession s) { sesion.requerirNoApoderado(s); return service.obtener(id); }
    @PostMapping public Asistencia crear(@Valid @RequestBody Asistencia a, HttpSession s) { sesion.requerirNoApoderado(s); return service.crear(a); }
    @PutMapping("/{id}") public Asistencia actualizar(@PathVariable Long id, @RequestBody Asistencia a, HttpSession s) { sesion.requerirNoApoderado(s); return service.actualizar(id, a); }
    @DeleteMapping("/{id}") public void eliminar(@PathVariable Long id, HttpSession s) { sesion.requerirNoApoderado(s); service.eliminar(id); }
}
