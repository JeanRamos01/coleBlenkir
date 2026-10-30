package pe.blenkir.cli;

/** Se lanza cuando ya no hay más entrada de teclado (por ejemplo, Ctrl+D / Ctrl+Z). */
public class FinEntradaException extends RuntimeException {
    public FinEntradaException() { super("Fin de la entrada."); }
}
