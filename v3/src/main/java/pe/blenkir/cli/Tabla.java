package pe.blenkir.cli;

import java.util.List;

/** Imprime tablas de texto alineadas en la consola. */
public final class Tabla {

    private Tabla() {}

    public static void imprimir(String[] cabeceras, List<String[]> filas) {
        if (filas.isEmpty()) {
            System.out.println("  (sin registros)");
            return;
        }
        int[] ancho = new int[cabeceras.length];
        for (int i = 0; i < cabeceras.length; i++) ancho[i] = cabeceras[i].length();
        for (String[] f : filas) {
            for (int i = 0; i < f.length; i++) ancho[i] = Math.max(ancho[i], f[i] == null ? 0 : f[i].length());
        }
        linea(cabeceras, ancho);
        StringBuilder sep = new StringBuilder();
        for (int a : ancho) sep.append("-".repeat(a)).append("-+-");
        System.out.println(sep.substring(0, sep.length() - 3));
        for (String[] f : filas) linea(f, ancho);
        System.out.println("  " + filas.size() + " registro(s)");
    }

    private static void linea(String[] celdas, int[] ancho) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < ancho.length; i++) {
            String c = i < celdas.length && celdas[i] != null ? celdas[i] : "";
            sb.append(String.format("%-" + ancho[i] + "s", c));
            if (i < ancho.length - 1) sb.append(" | ");
        }
        System.out.println(sb);
    }
}
