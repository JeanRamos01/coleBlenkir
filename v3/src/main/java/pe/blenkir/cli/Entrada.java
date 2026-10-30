package pe.blenkir.cli;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Scanner;

/** Lectura de teclado con Scanner y validación básica. Un único Scanner para toda la consola. */
@Component
public class Entrada {

    private final Scanner sc = new Scanner(System.in);

    private String linea() {
        if (!sc.hasNextLine()) throw new FinEntradaException();
        return sc.nextLine().trim();
    }

    /** Texto obligatorio. Si hay valor actual, Enter lo conserva. */
    public String texto(String etiqueta, String actual) {
        while (true) {
            System.out.print(etiqueta + (actual != null ? " [" + actual + "]" : "") + ": ");
            String v = linea();
            if (!v.isEmpty()) return v;
            if (actual != null) return actual;
            System.out.println("  Este dato es obligatorio.");
        }
    }

    public String texto(String etiqueta) { return texto(etiqueta, null); }

    /** Texto que se puede dejar vacío. */
    public String textoOpcional(String etiqueta) {
        System.out.print(etiqueta + ": ");
        return linea();
    }

    /** Entero entre min y max. */
    public int entero(String etiqueta, int min, int max) {
        while (true) {
            System.out.print(etiqueta + ": ");
            try {
                int v = Integer.parseInt(linea());
                if (v >= min && v <= max) return v;
            } catch (NumberFormatException ignorado) { /* se vuelve a pedir */ }
            System.out.println("  Ingresa un número entre " + min + " y " + max + ".");
        }
    }

    /** Entero con valor actual (Enter lo conserva). */
    public int entero(String etiqueta, int min, int max, int actual) {
        while (true) {
            System.out.print(etiqueta + " [" + actual + "]: ");
            String s = linea();
            if (s.isEmpty()) return actual;
            try {
                int v = Integer.parseInt(s);
                if (v >= min && v <= max) return v;
            } catch (NumberFormatException ignorado) { /* se vuelve a pedir */ }
            System.out.println("  Ingresa un número entre " + min + " y " + max + ".");
        }
    }

    public long id(String etiqueta) {
        while (true) {
            System.out.print(etiqueta + ": ");
            try {
                return Long.parseLong(linea());
            } catch (NumberFormatException e) {
                System.out.println("  Ingresa un ID numérico.");
            }
        }
    }

    public double decimal(String etiqueta, double min, double max, Double actual) {
        while (true) {
            System.out.print(etiqueta + (actual != null ? " [" + actual + "]" : "") + ": ");
            String s = linea().replace(',', '.');
            if (s.isEmpty() && actual != null) return actual;
            try {
                double v = Double.parseDouble(s);
                if (v >= min && v <= max) return v;
            } catch (NumberFormatException ignorado) { /* se vuelve a pedir */ }
            System.out.println("  Ingresa un número entre " + min + " y " + max + ".");
        }
    }

    /** Fecha en formato AAAA-MM-DD. Enter usa la fecha por defecto. */
    public LocalDate fecha(String etiqueta, LocalDate porDefecto) {
        while (true) {
            System.out.print(etiqueta + " (AAAA-MM-DD) [" + porDefecto + "]: ");
            String s = linea();
            if (s.isEmpty()) return porDefecto;
            try {
                return LocalDate.parse(s);
            } catch (DateTimeParseException e) {
                System.out.println("  Fecha inválida. Ejemplo: 2026-03-15");
            }
        }
    }

    public boolean confirmar(String pregunta) {
        while (true) {
            System.out.print(pregunta + " (s/n): ");
            String s = linea().toLowerCase();
            if (s.equals("s") || s.equals("si") || s.equals("sí")) return true;
            if (s.equals("n") || s.equals("no")) return false;
        }
    }

    /** Muestra opciones numeradas y devuelve la elegida. */
    public String elegir(String etiqueta, List<String> opciones, String actual) {
        System.out.println(etiqueta + ":");
        for (int i = 0; i < opciones.size(); i++) System.out.println("   " + (i + 1) + ") " + opciones.get(i));
        int def = actual == null ? -1 : opciones.indexOf(actual) + 1;
        int n = def > 0 ? entero("  Elige", 1, opciones.size(), def) : entero("  Elige", 1, opciones.size());
        return opciones.get(n - 1);
    }

    public String elegir(String etiqueta, List<String> opciones) { return elegir(etiqueta, opciones, null); }

    public void pausa() {
        System.out.print("\n(Enter para continuar) ");
        linea();
    }
}
