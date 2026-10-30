package pe.blenkir.service;

import java.util.List;
import java.util.regex.Pattern;

/** Validaciones reutilizadas por la API web y por la consola. */
final class Validar {
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern DNI = Pattern.compile("^\\d{6,15}$");

    private Validar() {}

    static String texto(String valor, String campo) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new ReglaNegocioException("El campo '" + campo + "' es obligatorio.");
        }
        return valor.trim();
    }

    static String email(String valor) {
        String v = texto(valor, "email");
        if (!EMAIL.matcher(v).matches()) throw new ReglaNegocioException("El email no es válido.");
        return v;
    }

    static String dni(String valor) {
        String v = texto(valor, "DNI");
        if (!DNI.matcher(v).matches()) {
            throw new ReglaNegocioException("El DNI debe contener solo números (6 a 15 dígitos).");
        }
        return v;
    }

    static String uno(String valor, List<String> permitidos, String campo) {
        String v = texto(valor, campo);
        if (!permitidos.contains(v)) {
            throw new ReglaNegocioException("Valor inválido en '" + campo + "'. Permitidos: " + String.join(", ", permitidos));
        }
        return v;
    }

    static int entre(Integer valor, int min, int max, String campo) {
        if (valor == null || valor < min || valor > max) {
            throw new ReglaNegocioException("'" + campo + "' debe estar entre " + min + " y " + max + ".");
        }
        return valor;
    }
}
