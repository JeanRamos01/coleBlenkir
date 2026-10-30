package pe.blenkir.web;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import pe.blenkir.model.Docente; import pe.blenkir.service.DocenteService; import pe.blenkir.service.SesionService;
import java.util.LinkedHashMap; import java.util.List; import java.util.Map;
@RestController @RequestMapping("/api/docentes")
public class DocenteController {
 private final DocenteService service; private final SesionService sesion;
 public DocenteController(DocenteService service,SesionService sesion){this.service=service;this.sesion=sesion;}
 @GetMapping public List<Docente> listar(){return service.listar();}
 @GetMapping("/{id}") public Docente obtener(@PathVariable Long id){return service.obtener(id);}
 @PostMapping public Map<String,Object> crear(@Valid @RequestBody Docente d,HttpSession s){sesion.requerirAdmin(s);Docente x=service.crear(d);Map<String,Object> m=new LinkedHashMap<>();m.put("registro",x);m.put("usuario","docente."+x.getId());m.put("passwordInicial","Blenkir@"+x.getId());return m;}
 @PutMapping("/{id}") public Docente actualizar(@PathVariable Long id,@Valid @RequestBody Docente d,HttpSession s){sesion.requerirAdmin(s);return service.actualizar(id,d);}
 @PatchMapping("/{id}/estado") public Docente alternarEstado(@PathVariable Long id,HttpSession s){sesion.requerirAdmin(s);return service.alternarEstado(id);}
 @DeleteMapping("/{id}") public void eliminar(@PathVariable Long id,HttpSession s){sesion.requerirAdmin(s);service.eliminar(id);}
}
