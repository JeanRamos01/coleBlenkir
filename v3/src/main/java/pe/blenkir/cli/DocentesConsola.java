package pe.blenkir.cli;

import org.springframework.stereotype.Component;
import pe.blenkir.model.Docente;
import pe.blenkir.service.DocenteService;

@Component
public class DocentesConsola extends ModuloConsola {

    private final DocenteService service;

    public DocentesConsola(Entrada in, DocenteService service) {
        super(in);
        this.service = service;
    }

    @Override
    public void abrir() {
        while (true) {
            titulo("DOCENTES");
            System.out.println(" 1) Listar\n 2) Registrar\n 3) Modificar\n 4) Activar / Desactivar\n 5) Eliminar\n 0) Volver");
            int op = in.entero("Opción", 0, 5);
            if (op == 0) return;
            ejecutar(() -> {
                switch (op) {
                    case 1 -> listar();
                    case 2 -> registrar();
                    case 3 -> modificar();
                    case 4 -> alternar();
                    case 5 -> eliminar();
                }
            });
        }
    }

    void listar() {
        Tabla.imprimir(new String[]{"ID", "Docente", "Especialidad", "Email", "Estado"},
                service.listar().stream().map(d -> new String[]{String.valueOf(d.getId()), d.getNombres(),
                        d.getEspecialidad(), d.getEmail(), d.getEstado()}).toList());
    }

    private void registrar() {
        Docente d = new Docente();
        d.setNombres(in.texto("Nombres"));
        d.setEspecialidad(in.texto("Especialidad"));
        d.setEmail(in.texto("Email"));
        ok("Docente registrado con ID " + service.crear(d).getId() + ".");
    }

    private void modificar() {
        listar();
        Docente actual = service.obtener(in.id("ID del docente a modificar"));
        System.out.println("(Enter conserva el valor actual)");
        Docente d = new Docente();
        d.setNombres(in.texto("Nombres", actual.getNombres()));
        d.setEspecialidad(in.texto("Especialidad", actual.getEspecialidad()));
        d.setEmail(in.texto("Email", actual.getEmail()));
        service.actualizar(actual.getId(), d);
        ok("Docente actualizado.");
    }

    private void alternar() {
        listar();
        Docente d = service.alternarEstado(in.id("ID del docente"));
        ok("Docente " + ("activo".equals(d.getEstado()) ? "activado" : "desactivado") + ".");
    }

    private void eliminar() {
        listar();
        Docente d = service.obtener(in.id("ID del docente a eliminar"));
        if (!in.confirmar("¿Eliminar a " + d.getNombres() + "?")) return;
        service.eliminar(d.getId());
        ok("Docente eliminado.");
    }
}
