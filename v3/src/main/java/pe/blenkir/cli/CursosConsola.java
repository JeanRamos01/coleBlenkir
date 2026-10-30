package pe.blenkir.cli;

import org.springframework.stereotype.Component;
import pe.blenkir.model.Curso;
import pe.blenkir.service.CursoService;

import java.util.Map;

@Component
public class CursosConsola extends ModuloConsola {

    private final CursoService service;
    private final DocentesConsola docentes;
    private final Nombres nombres;

    public CursosConsola(Entrada in, CursoService service, DocentesConsola docentes, Nombres nombres) {
        super(in);
        this.service = service;
        this.docentes = docentes;
        this.nombres = nombres;
    }

    @Override
    public void abrir() {
        while (true) {
            titulo("CURSOS");
            System.out.println(" 1) Listar\n 2) Registrar\n 3) Modificar\n 4) Eliminar\n 0) Volver");
            int op = in.entero("Opción", 0, 4);
            if (op == 0) return;
            ejecutar(() -> {
                switch (op) {
                    case 1 -> listar();
                    case 2 -> registrar();
                    case 3 -> modificar();
                    case 4 -> eliminar();
                }
            });
        }
    }

    void listar() {
        Map<Long, String> docs = nombres.docentes();
        Tabla.imprimir(new String[]{"ID", "Curso", "Docente", "Créditos"},
                service.listar().stream().map(c -> new String[]{String.valueOf(c.getId()), c.getNombre(),
                        docs.getOrDefault(c.getIdDocente(), "Sin asignar"), String.valueOf(c.getCreditos())}).toList());
    }

    private void registrar() {
        docentes.listar();
        Curso c = new Curso();
        c.setNombre(in.texto("Nombre del curso"));
        c.setIdDocente(in.id("ID del docente"));
        c.setCreditos(in.entero("Créditos (1-10)", 1, 10));
        ok("Curso registrado con ID " + service.crear(c).getId() + ".");
    }

    private void modificar() {
        listar();
        Curso actual = service.obtener(in.id("ID del curso a modificar"));
        System.out.println("(Enter conserva el valor actual)");
        docentes.listar();
        Curso c = new Curso();
        c.setNombre(in.texto("Nombre del curso", actual.getNombre()));
        c.setIdDocente(in.entero("ID del docente", 1, Integer.MAX_VALUE, actual.getIdDocente().intValue()) * 1L);
        c.setCreditos(in.entero("Créditos (1-10)", 1, 10, actual.getCreditos()));
        service.actualizar(actual.getId(), c);
        ok("Curso actualizado.");
    }

    private void eliminar() {
        listar();
        Curso c = service.obtener(in.id("ID del curso a eliminar"));
        if (!in.confirmar("Se eliminará '" + c.getNombre() + "' con sus matrículas, notas y asistencias. ¿Continuar?")) return;
        service.eliminar(c.getId());
        ok("Curso eliminado.");
    }
}
