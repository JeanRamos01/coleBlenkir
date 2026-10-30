package pe.blenkir.web;

import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import pe.blenkir.model.Asistencia;
import pe.blenkir.service.AsistenciaService;

import java.util.List;

@RestController
@RequestMapping("/api/asistencias")
public class AsistenciaController {

    private final AsistenciaService service;

    public AsistenciaController(AsistenciaService service) { this.service = service; }

    @GetMapping public List<Asistencia> listar() { return service.listar(); }
    @GetMapping("/{id}") public Asistencia obtener(@PathVariable Long id) { return service.obtener(id); }
    @PostMapping public Asistencia crear(@Valid @RequestBody Asistencia a) { return service.crear(a); }
    @PutMapping("/{id}") public Asistencia actualizar(@PathVariable Long id, @RequestBody Asistencia a) { return service.actualizar(id, a); }
    @DeleteMapping("/{id}") public void eliminar(@PathVariable Long id) { service.eliminar(id); }
}
