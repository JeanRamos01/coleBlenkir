package pe.blenkir.web;

import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import pe.blenkir.model.Asignacion;
import pe.blenkir.service.MatriculaService;

import java.util.List;

@RestController
@RequestMapping("/api/asignaciones")
public class AsignacionController {

    private final MatriculaService service;

    public AsignacionController(MatriculaService service) { this.service = service; }

    @GetMapping public List<Asignacion> listar() { return service.listar(); }

    @PostMapping
    public Asignacion matricular(@Valid @RequestBody Asignacion a) { return service.matricular(a.getIdCurso(), a.getIdEstudiante()); }

    @DeleteMapping
    public void retirar(@RequestParam Long idCurso, @RequestParam Long idEstudiante) { service.retirar(idCurso, idEstudiante); }
}
