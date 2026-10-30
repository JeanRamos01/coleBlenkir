package pe.blenkir.cli;

import org.springframework.stereotype.Component;
import pe.blenkir.model.Estudiante;
import pe.blenkir.service.EstudianteService;

import java.util.List;

@Component
public class EstudiantesConsola extends ModuloConsola {

    private final EstudianteService service;

    public EstudiantesConsola(Entrada in, EstudianteService service) {
        super(in);
        this.service = service;
    }

    @Override
    public void abrir() {
        while (true) {
            titulo("ESTUDIANTES");
            System.out.println(" 1) Listar\n 2) Buscar por nombre o DNI\n 3) Registrar\n 4) Modificar\n"
                    + " 5) Activar / Desactivar\n 6) Eliminar\n 0) Volver");
            int op = in.entero("Opción", 0, 6);
            if (op == 0) return;
            ejecutar(() -> {
                switch (op) {
                    case 1 -> listar("");
                    case 2 -> listar(in.texto("Texto a buscar"));
                    case 3 -> registrar();
                    case 4 -> modificar();
                    case 5 -> alternar();
                    case 6 -> eliminar();
                }
            });
        }
    }

    void listar(String filtro) {
        String f = filtro.toLowerCase();
        List<String[]> filas = service.listar().stream()
                .filter(e -> f.isEmpty() || (e.getNombres() + " " + e.getApellidos()).toLowerCase().contains(f) || e.getDni().contains(f))
                .map(e -> new String[]{String.valueOf(e.getId()), e.getNombres() + " " + e.getApellidos(), e.getDni(),
                        e.getGrado(), e.getSeccion(), e.getEstado()})
                .toList();
        Tabla.imprimir(new String[]{"ID", "Estudiante", "DNI", "Grado", "Sec", "Estado"}, filas);
    }

    private void registrar() {
        Estudiante e = new Estudiante();
        e.setNombres(in.texto("Nombres"));
        e.setApellidos(in.texto("Apellidos"));
        e.setDni(in.texto("DNI (solo números)"));
        e.setGrado(in.elegir("Grado", EstudianteService.GRADOS));
        e.setSeccion(in.elegir("Sección", EstudianteService.SECCIONES));
        Estudiante g = service.crear(e);
        ok("Estudiante registrado con ID " + g.getId() + ".");
    }

    private void modificar() {
        listar("");
        Estudiante actual = service.obtener(in.id("ID del estudiante a modificar"));
        System.out.println("(Enter conserva el valor actual)");
        Estudiante e = new Estudiante();
        e.setNombres(in.texto("Nombres", actual.getNombres()));
        e.setApellidos(in.texto("Apellidos", actual.getApellidos()));
        e.setDni(in.texto("DNI", actual.getDni()));
        e.setGrado(in.elegir("Grado", EstudianteService.GRADOS, actual.getGrado()));
        e.setSeccion(in.elegir("Sección", EstudianteService.SECCIONES, actual.getSeccion()));
        service.actualizar(actual.getId(), e);
        ok("Estudiante actualizado.");
    }

    private void alternar() {
        listar("");
        Estudiante e = service.alternarEstado(in.id("ID del estudiante"));
        ok("Estudiante " + ("activo".equals(e.getEstado()) ? "activado" : "desactivado") + ".");
    }

    private void eliminar() {
        listar("");
        Estudiante e = service.obtener(in.id("ID del estudiante a eliminar"));
        if (!in.confirmar("Se eliminará a " + e.getNombres() + " " + e.getApellidos()
                + " junto con sus notas, asistencias, matrículas y usuario. ¿Continuar?")) return;
        service.eliminar(e.getId());
        ok("Estudiante eliminado.");
    }
}
