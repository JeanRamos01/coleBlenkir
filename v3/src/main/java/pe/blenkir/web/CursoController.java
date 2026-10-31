package pe.blenkir.web;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import pe.blenkir.model.Curso; import pe.blenkir.service.CursoService; import pe.blenkir.service.SesionService;
import java.util.List;
@RestController @RequestMapping("/api/cursos")
public class CursoController {
 private final CursoService service; private final SesionService sesion;
 public CursoController(CursoService service,SesionService sesion){this.service=service;this.sesion=sesion;}
 @GetMapping public List<Curso> listar(HttpSession s){sesion.requerirNoApoderado(s);return service.listar();}
 @GetMapping("/{id}") public Curso obtener(@PathVariable Long id,HttpSession s){sesion.requerirNoApoderado(s);return service.obtener(id);}
 @PostMapping public Curso crear(@Valid @RequestBody Curso c,HttpSession s){sesion.requerirAdmin(s);return service.crear(c);}
 @PutMapping("/{id}") public Curso actualizar(@PathVariable Long id,@Valid @RequestBody Curso c,HttpSession s){sesion.requerirAdmin(s);return service.actualizar(id,c);}
 @DeleteMapping("/{id}") public void eliminar(@PathVariable Long id,HttpSession s){sesion.requerirAdmin(s);service.eliminar(id);}
}
