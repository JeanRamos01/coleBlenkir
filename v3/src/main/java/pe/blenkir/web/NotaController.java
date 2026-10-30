package pe.blenkir.web;

import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import pe.blenkir.model.Nota;
import pe.blenkir.service.NotaService;

import java.util.List;

@RestController
@RequestMapping("/api/notas")
public class NotaController {

    private final NotaService service;

    public NotaController(NotaService service) { this.service = service; }

    @GetMapping public List<Nota> listar() { return service.listar(); }
    @GetMapping("/{id}") public Nota obtener(@PathVariable Long id) { return service.obtener(id); }
    @PostMapping public Nota crear(@Valid @RequestBody Nota n) { return service.crear(n); }
    @PutMapping("/{id}") public Nota actualizar(@PathVariable Long id, @RequestBody Nota n) { return service.actualizar(id, n); }
    @DeleteMapping("/{id}") public void eliminar(@PathVariable Long id) { service.eliminar(id); }
}
