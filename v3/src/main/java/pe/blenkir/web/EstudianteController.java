package pe.blenkir.web;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import pe.blenkir.model.Estudiante;
import pe.blenkir.service.EstudianteService;
import pe.blenkir.service.SesionService;
import java.util.LinkedHashMap; import java.util.List; import java.util.Map;

@RestController @RequestMapping("/api/estudiantes")
public class EstudianteController {
 private final EstudianteService service; private final SesionService sesion;
 public EstudianteController(EstudianteService service,SesionService sesion){this.service=service;this.sesion=sesion;}
 @GetMapping public List<Estudiante> listar(HttpSession s){sesion.requerirNoApoderado(s);return service.listar();}
 @GetMapping("/{id}") public Estudiante obtener(@PathVariable Long id,HttpSession s){sesion.requerirNoApoderado(s);return service.obtener(id);}
 @PostMapping public Map<String,Object> crear(@Valid @RequestBody Estudiante e,HttpSession s){sesion.requerirAdmin(s);Estudiante x=service.crear(e);Map<String,Object> m=new LinkedHashMap<>();m.put("registro",x);m.put("usuario","alumno."+x.getDni());m.put("passwordInicial","Blenkir@"+x.getDni());return m;}
 @PutMapping("/{id}") public Estudiante actualizar(@PathVariable Long id,@Valid @RequestBody Estudiante e,HttpSession s){sesion.requerirAdmin(s);return service.actualizar(id,e);}
 @PatchMapping("/{id}/estado") public Estudiante alternarEstado(@PathVariable Long id,HttpSession s){sesion.requerirAdmin(s);return service.alternarEstado(id);}
 @DeleteMapping("/{id}") public void eliminar(@PathVariable Long id,HttpSession s){sesion.requerirAdmin(s);service.eliminar(id);}
}
