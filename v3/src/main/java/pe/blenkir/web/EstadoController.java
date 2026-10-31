package pe.blenkir.web;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import pe.blenkir.service.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Devuelve todas las listas en un solo JSON con la misma forma que tenía el objeto `state`
 * del front. El navegador lo consulta cada pocos segundos, así los cambios hechos desde
 * la consola aparecen solos en la web.
 */
@RestController
@RequestMapping("/api/estado")
public class EstadoController {

    private final SesionService sesion;
    private final EstudianteService estudiantes;
    private final DocenteService docentes;
    private final CursoService cursos;
    private final MatriculaService matriculas;
    private final NotaService notas;
    private final AsistenciaService asistencias;

    public EstadoController(EstudianteService estudiantes, DocenteService docentes, CursoService cursos,
                            MatriculaService matriculas, NotaService notas, AsistenciaService asistencias, SesionService sesion) {
        this.sesion = sesion;
        this.estudiantes = estudiantes;
        this.docentes = docentes;
        this.cursos = cursos;
        this.matriculas = matriculas;
        this.notas = notas;
        this.asistencias = asistencias;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> estado(HttpSession session) {
        sesion.requerirNoApoderado(session);
        Map<String, Object> estado = new LinkedHashMap<>();
        estado.put("estudiantes", estudiantes.listar());
        estado.put("docentes", docentes.listar());
        estado.put("cursos", cursos.listar());
        estado.put("asignaciones", matriculas.listar());
        estado.put("notas", notas.listar());
        estado.put("asistencias", asistencias.listar());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(estado);
    }
}
