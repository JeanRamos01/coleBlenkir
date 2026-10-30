package pe.blenkir.cli;

/** Base de cada submenú: ejecuta una acción mostrando los errores sin cerrar la consola. */
public abstract class ModuloConsola {

    protected final Entrada in;

    protected ModuloConsola(Entrada in) { this.in = in; }

    /** Muestra el submenú hasta que el usuario elige "Volver". */
    public abstract void abrir();

    protected void ejecutar(Runnable accion) {
        try {
            accion.run();
        } catch (FinEntradaException e) {
            throw e;
        } catch (RuntimeException e) {
            System.out.println("  [ERROR] " + mensaje(e));
        }
    }

    protected void ok(String mensaje) { System.out.println("  [OK] " + mensaje); }

    protected void titulo(String texto) { System.out.println("\n=== " + texto + " ==="); }

    private String mensaje(RuntimeException e) {
        Throwable t = e;
        // Si es un error de BD (clave duplicada, FK), mostrar un mensaje claro.
        if (e instanceof org.springframework.dao.DataIntegrityViolationException) {
            return "No se pudo guardar: datos duplicados o relacionados con otros registros.";
        }
        return t.getMessage() != null ? t.getMessage() : t.getClass().getSimpleName();
    }
}
