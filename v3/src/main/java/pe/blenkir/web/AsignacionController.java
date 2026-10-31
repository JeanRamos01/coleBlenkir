package pe.blenkir.web;

import pe.blenkir.service.SesionService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import pe.blenkir.model.Asignacion;
import pe.blenkir.service.MatriculaService;

import java.util.List;

@RestController
@RequestMapping("/api/asignaciones")
public class AsignacionController {

    private final MatriculaService service;
    private final SesionService sesion;

    public AsignacionController(MatriculaService service, SesionService sesion) { this.service = service; this.sesion = sesion; }

    @GetMapping public List<Asignacion> listar(HttpSession s) { sesion.requerirNoApoderado(s); return service.listar(); }

    @PostMapping
    public Asignacion matricular(@Valid @RequestBody Asignacion a, HttpSession s) { sesion.requerirAdmin(s); return service.matricular(a.getIdCurso(), a.getIdEstudiante()); }

    @DeleteMapping
    public void retirar(@RequestParam Long idCurso, @RequestParam Long idEstudiante, HttpSession s) { sesion.requerirAdmin(s); service.retirar(idCurso, idEstudiante); }
}
