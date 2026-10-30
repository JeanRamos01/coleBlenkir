-- Ejecutar UNA vez como superusuario (postgres), por ejemplo:
--   psql -U postgres -f database/01_crear_bd.sql
-- Las tablas las crea Spring Boot solo al arrancar (src/main/resources/schema.sql).

CREATE DATABASE blenkir
    WITH ENCODING 'UTF8'
    TEMPLATE template0;
