package pe.blenkir.cli;

import org.springframework.stereotype.Component;
import pe.blenkir.model.Curso;
import pe.blenkir.model.Docente;
import pe.blenkir.model.Estudiante;
import pe.blenkir.service.CursoService;
import pe.blenkir.service.DocenteService;
import pe.blenkir.service.EstudianteService;

import java.util.HashMap;
import java.util.Map;

/** Mapas id → nombre para mostrar nombres legibles en las tablas de consola. */
@Component
public class Nombres {

    private final EstudianteService estudiantes;
    private final CursoService cursos;
    private final DocenteService docentes;

    public Nombres(EstudianteService estudiantes, CursoService cursos, DocenteService docentes) {
        this.estudiantes = estudiantes;
        this.cursos = cursos;
        this.docentes = docentes;
    }

    public Map<Long, String> estudiantes() {
        Map<Long, String> m = new HashMap<>();
        for (Estudiante e : estudiantes.listar()) m.put(e.getId(), e.getNombres() + " " + e.getApellidos());
        return m;
    }

    public Map<Long, String> cursos() {
        Map<Long, String> m = new HashMap<>();
        for (Curso c : cursos.listar()) m.put(c.getId(), c.getNombre());
        return m;
    }

    public Map<Long, String> docentes() {
        Map<Long, String> m = new HashMap<>();
        for (Docente d : docentes.listar()) m.put(d.getId(), d.getNombres());
        return m;
    }
}
