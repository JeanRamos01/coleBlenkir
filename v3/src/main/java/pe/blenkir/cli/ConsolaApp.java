package pe.blenkir.cli;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Menú interactivo por teclado (Scanner). Se inicia en un hilo aparte cuando el servidor web ya
 * está listo, así que la web y la consola funcionan a la vez sobre la misma base de datos.
 */
@Component
public class ConsolaApp {

    private final boolean activa;
    private final String puerto;
    private final Entrada in;
    private final EstudiantesConsola estudiantes;
    private final DocentesConsola docentes;
    private final CursosConsola cursos;
    private final MatriculasConsola matriculas;
    private final NotasConsola notas;
    private final AsistenciasConsola asistencias;
    private final UsuariosConsola usuarios;
    private final ReportesConsola reportes;

    public ConsolaApp(@Value("${blenkir.consola.activa:true}") boolean activa,
                      @Value("${server.port:8080}") String puerto, Entrada in,
                      EstudiantesConsola estudiantes, DocentesConsola docentes, CursosConsola cursos,
                      MatriculasConsola matriculas, NotasConsola notas, AsistenciasConsola asistencias,
                      UsuariosConsola usuarios, ReportesConsola reportes) {
        this.activa = activa;
        this.puerto = puerto;
        this.in = in;
        this.estudiantes = estudiantes;
        this.docentes = docentes;
        this.cursos = cursos;
        this.matriculas = matriculas;
        this.notas = notas;
        this.asistencias = asistencias;
        this.usuarios = usuarios;
        this.reportes = reportes;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void iniciar() {
        if (!activa) return;
        Thread hilo = new Thread(this::menuPrincipal, "consola-blenkir");
        hilo.setDaemon(true);
        hilo.start();
    }

    private void menuPrincipal() {
        System.out.println("\n==========================================================");
        System.out.println("  COLEGIO BLENKIR - Consola de administración");
        System.out.println("  Web: http://localhost:" + puerto + "  (los cambios se ven allí)");
        System.out.println("==========================================================");
        try {
            while (true) {
                System.out.println("\n=== MENÚ PRINCIPAL ===");
                System.out.println(" 1) Estudiantes\n 2) Docentes\n 3) Cursos\n 4) Matrículas (estudiantes por curso)\n"
                        + " 5) Calificaciones\n 6) Asistencia\n 7) Usuarios (acceso a la web)\n 8) Reportes\n"
                        + " 0) Cerrar la consola (el servidor web sigue activo)");
                int op = in.entero("Opción", 0, 8);
                switch (op) {
                    case 1 -> estudiantes.abrir();
                    case 2 -> docentes.abrir();
                    case 3 -> cursos.abrir();
                    case 4 -> matriculas.abrir();
                    case 5 -> notas.abrir();
                    case 6 -> asistencias.abrir();
                    case 7 -> usuarios.abrir();
                    case 8 -> reportes.abrir();
                    case 0 -> {
                        System.out.println("Consola cerrada. Para detener todo, detén la aplicación (botón Stop o Ctrl+C).");
                        return;
                    }
                }
            }
        } catch (FinEntradaException e) {
            System.out.println("Entrada de teclado no disponible: la consola se desactiva (la web sigue activa).");
        }
    }
}
