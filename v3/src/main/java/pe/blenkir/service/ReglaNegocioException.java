package pe.blenkir.service;

/** Error de validación o de regla de negocio (se muestra tal cual al usuario). */
public class ReglaNegocioException extends RuntimeException {
    public ReglaNegocioException(String mensaje) { super(mensaje); }
}
