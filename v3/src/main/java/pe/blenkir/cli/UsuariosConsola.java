package pe.blenkir.cli;

import org.springframework.stereotype.Component;
import pe.blenkir.model.Usuario;
import pe.blenkir.service.UsuarioService;

import java.util.Map;

/** Gestión de las cuentas con las que se inicia sesión en la web. */
@Component
public class UsuariosConsola extends ModuloConsola {

    private final UsuarioService service;
    private final EstudiantesConsola estudiantes;
    private final Nombres nombres;

    public UsuariosConsola(Entrada in, UsuarioService service, EstudiantesConsola estudiantes, Nombres nombres) {
        super(in);
        this.service = service;
        this.estudiantes = estudiantes;
        this.nombres = nombres;
    }

    @Override
    public void abrir() {
        while (true) {
            titulo("USUARIOS (cuentas de acceso a la web)");
            System.out.println(" 1) Listar\n 2) Crear\n 3) Modificar\n 4) Eliminar\n 0) Volver");
            int op = in.entero("Opción", 0, 4);
            if (op == 0) return;
            ejecutar(() -> {
                switch (op) {
                    case 1 -> listar();
                    case 2 -> crear();
                    case 3 -> modificar();
                    case 4 -> eliminar();
                }
            });
        }
    }

    private void listar() {
        Map<Long, String> est = nombres.estudiantes();
        Tabla.imprimir(new String[]{"ID", "Usuario", "Tipo", "Nombre", "Estudiante vinculado"},
                service.listar().stream().map(u -> new String[]{String.valueOf(u.getId()), u.getUsuario(), u.getTipo(),
                        u.getNombre(), u.getIdEstudiante() == null ? "" : est.getOrDefault(u.getIdEstudiante(), "?")}).toList());
    }

    private void crear() {
        String usuario = in.texto("Usuario");
        String password = in.texto("Contraseña (mín. 6 caracteres)");
        String tipo = in.elegir("Tipo", UsuarioService.TIPOS);
        String nombre = in.texto("Nombre para mostrar");

        Long idEstudiante = null;
        Long idDocente = null;

        if ("Alumno".equals(tipo)) {
            estudiantes.listar("");
            idEstudiante = in.id("ID del estudiante vinculado");
        }

        ok("Usuario creado con ID " +
                service.crear(usuario, password, tipo, nombre,
                        idEstudiante, idDocente).getId() + ".");
    }

    private void modificar() {
        listar();

        Usuario actual = service.obtener(in.id("ID del usuario a modificar"));

        System.out.println("(Enter conserva el valor actual; contraseña vacía = no cambiarla)");

        String usuario = in.texto("Usuario", actual.getUsuario());
        String password = in.textoOpcional("Nueva contraseña");
        String tipo = in.elegir("Tipo", UsuarioService.TIPOS, actual.getTipo());
        String nombre = in.texto("Nombre para mostrar", actual.getNombre());

        Long idEstudiante = actual.getIdEstudiante();
        Long idDocente = null;

        if ("Alumno".equals(tipo)) {
            estudiantes.listar("");
            idEstudiante = in.entero("ID del estudiante vinculado", 1,
                    Integer.MAX_VALUE,
                    idEstudiante == null ? 1 : idEstudiante.intValue()) * 1L;
        }

        service.actualizar(
                actual.getId(),
                usuario,
                password,
                tipo,
                nombre,
                idEstudiante,
                idDocente
        );

        ok("Usuario actualizado.");
    }

    private void eliminar() {
        listar();
        Usuario u = service.obtener(in.id("ID del usuario a eliminar"));
        if (!in.confirmar("¿Eliminar al usuario '" + u.getUsuario() + "'?")) return;
        service.eliminar(u.getId());
        ok("Usuario eliminado.");
    }
}
