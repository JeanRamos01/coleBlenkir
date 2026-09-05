const STORAGE_KEY = "blenkirahora_data_v2";

/* ============================================================
   USUARIOS DE DEMOSTRACIÓN
============================================================ */
const USUARIOS_DEMO = [
    { usuario: "admin", password: "admin123", tipo: "Administrador", nombre: "Admin General" },
    { usuario: "docente", password: "docente123", tipo: "Docente", nombre: "Prof. Carlos Ruiz" },
    { usuario: "alumno", password: "alumno123", tipo: "Alumno", nombre: "Ana Quispe Torres", idEstudiante: 1 },
];

/* ============================================================
   ESTADO GLOBAL
============================================================ */
const state = {
    estudiantes: [],
    docentes: [],
    cursos: [],
    asignaciones: [],
    notas: [],
    asistencias: [],
    avisos: []
};

let sesion = null;
let toastInstance = null;

/* ============================================================
   FUNCIONES DE PERSISTENCIA
============================================================ */
function cargarEstado() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            Object.assign(state, data);
        } catch (e) {
            console.warn("No se pudo leer el almacenamiento local, se inicia vacío.");
        }
    }
}

function guardarEstado() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function generarId(lista) {
    return lista.length ? Math.max(...lista.map(i => i.id)) + 1 : 1;
}

function hoyISO() {
    return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   TOAST
============================================================ */
function mostrarToast(mensaje) {
    const toastEl = document.getElementById("appToast");
    document.getElementById("appToastBody").textContent = mensaje;
    if (!toastInstance) toastInstance = new bootstrap.Toast(toastEl, { delay: 2200 });
    toastInstance.show();
}

/* ============================================================
   LOGIN / LOGOUT
============================================================ */
document.getElementById("formLogin").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const usuario = document.getElementById("loginUsuario").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorBox = document.getElementById("loginError");

    const encontrado = USUARIOS_DEMO.find(u =>
        u.usuario === usuario && u.password === password
    );

    if (!encontrado) {
        errorBox.classList.remove("d-none");
        return;
    }

    errorBox.classList.add("d-none");
    sesion = {
        usuario: encontrado.usuario,
        tipo: encontrado.tipo,
        nombre: encontrado.nombre,
        idEstudiante: encontrado.idEstudiante || null
    };
    sessionStorage.setItem("blenkirahora_sesion", JSON.stringify(sesion));
    iniciarApp();
});

document.getElementById("btnLogout").addEventListener("click", () => {
    sesion = null;
    sessionStorage.removeItem("blenkirahora_sesion");
    document.getElementById("appShell").classList.add("d-none");
    document.getElementById("pantallaLogin").classList.remove("d-none");
    document.getElementById("formLogin").reset();
});

function aplicarPermisosPorRol() {
    document.querySelectorAll("[data-roles]").forEach(el => {
        const permitidos = el.dataset.roles.split(",");
        el.classList.toggle("d-none", !permitidos.includes(sesion.tipo));
    });
}

/* ============================================================
   NAVEGACIÓN
============================================================ */
function irAVista(nombre) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById(`view-${nombre}`).classList.add("active");

    document.querySelectorAll(".side-link").forEach(l => l.classList.remove("active"));
    const link = document.querySelector(`.side-link[data-view="${nombre}"]`);
    if (link) link.classList.add("active");

    cerrarSidebarMovil();
}

function inicializarNavegacion() {
    document.querySelectorAll(".side-link").forEach(btn => {
        btn.addEventListener("click", () => irAVista(btn.dataset.view));
    });

    document.querySelectorAll(".dash-card").forEach(btn => {
        btn.addEventListener("click", () => {
            irAVista(btn.dataset.goto);
            if (btn.dataset.sub) activarSubtab(btn.dataset.sub);
        });
    });

    document.getElementById("btnMenu").addEventListener("click", abrirSidebarMovil);
    document.getElementById("sidebarBackdrop").addEventListener("click", cerrarSidebarMovil);

    document.querySelectorAll(".subtab-btn[data-subtab]").forEach(btn => {
        btn.addEventListener("click", () => activarSubtab(btn.dataset.subtab));
    });

    document.querySelectorAll(".subtab-btn[data-subtab-rep]").forEach(btn => {
        btn.addEventListener("click", () => activarSubtabReporte(btn.dataset.subtabRep));
    });
}

function activarSubtab(nombre) {
    document.querySelectorAll(".subtab-btn[data-subtab]").forEach(b => b.classList.remove("active"));
    document.querySelector(`.subtab-btn[data-subtab="${nombre}"]`).classList.add("active");
    document.querySelectorAll(".subpanel").forEach(p => p.classList.remove("active"));
    document.getElementById(`sub-${nombre}`).classList.add("active");
}

function activarSubtabReporte(nombre) {
    document.querySelectorAll(".subtab-btn[data-subtab-rep]").forEach(b => b.classList.remove("active"));
    document.querySelector(`.subtab-btn[data-subtab-rep="${nombre}"]`).classList.add("active");
    document.querySelectorAll(".subpanel-rep").forEach(p => p.classList.remove("active"));
    document.getElementById(`rep-${nombre}`).classList.add("active");
    renderReportes();
}

function abrirSidebarMovil() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarBackdrop").classList.remove("d-none");
}

function cerrarSidebarMovil() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarBackdrop").classList.add("d-none");
}

/* ============================================================
   FUNCIONES AUXILIARES PARA SELECTS
============================================================ */
function llenarSelect(id, lista, getValue, getLabel, opcionTodos) {
    const el = document.getElementById(id);
    if (!el) return;
    const valorAnterior = el.value;
    const primeraOpcion = opcionTodos ?
        `<option value="">${opcionTodos}</option>` :
        `<option value="" disabled ${!valorAnterior ? "selected" : ""}>Elegir</option>`;
    el.innerHTML = primeraOpcion + lista.map(item =>
        `<option value="${getValue(item)}">${getLabel(item)}</option>`
    ).join("");
    if (lista.some(item => String(getValue(item)) === valorAnterior)) el.value = valorAnterior;
}

function actualizarSelectsGlobales() {
    const docentesActivos = state.docentes.filter(d => d.estado === "activo");
    llenarSelect("curDocente", docentesActivos, d => d.id, d => d.nombres);

    llenarSelect("asigCurso", state.cursos, c => c.id, c => c.nombre);
    llenarSelect("notaCurso", state.cursos, c => c.id, c => c.nombre);
    llenarSelect("asisCurso", state.cursos, c => c.id, c => c.nombre);
    llenarSelect("filtroCursoNotas", state.cursos, c => c.id, c => c.nombre, "Todos los cursos");
    llenarSelect("repFiltroCurso", state.cursos, c => c.id, c => c.nombre, "Todos los cursos");

    const activos = state.estudiantes.filter(e => e.estado === "activo");
    llenarSelect("filtroEstudianteAsistencia", activos, e => e.id, e => `${e.nombres} ${e.apellidos}`, "Todos los estudiantes");

    actualizarComboEstudiantesPorCurso("notaCurso", "notaEstudiante");
    actualizarComboEstudiantesPorCurso("asisCurso", "asisEstudiante");
}

function estudiantesDeCurso(idCurso) {
    if (!idCurso) return [];
    const ids = state.asignaciones.filter(a => a.idCurso === idCurso).map(a => a.idEstudiante);
    return state.estudiantes.filter(e => ids.includes(e.id) && e.estado === "activo");
}

function actualizarComboEstudiantesPorCurso(comboCursoId, comboEstId) {
    const idCurso = Number(document.getElementById(comboCursoId).value) || null;
    const comboEst = document.getElementById(comboEstId);
    const disponibles = estudiantesDeCurso(idCurso);

    comboEst.innerHTML =
        `<option value="" disabled selected>${idCurso ? "Elegir estudiante" : "Elige primero un curso"}</option>` +
        disponibles.map(e => `<option value="${e.id}">${e.nombres} ${e.apellidos}</option>`).join("");
    comboEst.disabled = !idCurso || disponibles.length === 0;
}

function claseParaNota(valor) {
    if (valor < 11) return "low";
    if (valor >= 17) return "high";
    return "";
}

/* ============================================================
   RENDER: DASHBOARD
============================================================ */
function renderDashboard() {
    const totalEstudiantes = state.estudiantes.filter(e => e.estado === "activo").length;
    const totalDocentes = state.docentes.length;
    const totalCursos = state.cursos.length;
    const totalNotas = state.notas.length;
    const totalAsistencias = state.asistencias.length;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    // Administrador
    setText("countEstudiantes", totalEstudiantes);
    setText("countDocentes", totalDocentes);
    setText("countCursos", totalCursos);
    setText("countNotas", totalNotas);
    setText("countAsistencias", totalAsistencias);
    setText("adminStudents2", totalEstudiantes);
    setText("adminTeachers2", totalDocentes);
    setText("adminCourses2", totalCursos);

    // Docente
    if (sesion && sesion.tipo === "Docente") {
        const docente = state.docentes.find(d =>
            d.nombres.toLowerCase().includes((sesion.nombre || "").replace("Prof. ", "").split(" ")[0].toLowerCase())
        );
        const docenteId = docente ? docente.id : null;
        const misCursos = docenteId ? state.cursos.filter(c => c.idDocente === docenteId) : state.cursos;
        const misCursoIds = new Set(misCursos.map(c => c.id));
        const misNotas = state.notas.filter(n => misCursoIds.has(n.idCurso));
        const misAsistencias = state.asistencias.filter(a => misCursoIds.has(a.idCurso));

        setText("docenteWelcomeName", sesion.nombre.replace(/^Prof\.\s*/i, ""));
        setText("teacherCourseCount", misCursos.length);
        setText("teacherGradeCount", misNotas.length);
        setText("teacherAttendanceCount", misAsistencias.length);

        // Mis cursos (vista previa)
        const preview = document.getElementById("teacherCoursesPreview");
        if (preview) {
            preview.innerHTML = misCursos.length ?
                misCursos.map(c => {
                    const alumnos = state.asignaciones.filter(a => a.idCurso === c.id).length;
                    return `<div class="course-preview-row">
                                <div><strong>${c.nombre}</strong><small>${c.creditos} créditos</small></div>
                                <span>${alumnos} estudiante${alumnos === 1 ? "" : "s"}</span>
                            </div>`;
                }).join("") :
                `<div class="empty-state">No tienes cursos asignados.</div>`;
        }

        // Actividad reciente (simulada)
        const activity = document.getElementById("teacherRecentActivity");
        if (activity) {
            const actividades = [
                "Registraste asistencia en Matemática - 5° Secundaria A",
                "Publicaste calificaciones de Examen Práctico en Ciencias",
                "Creaste evaluación: Examen 1er bimestre en Comunicación",
                "Enviaste comunicado a estudiantes de 4° Secundaria A"
            ];
            activity.innerHTML = actividades.map((act, i) =>
                `<div class="activity-item">
                            <span>${act}</span>
                            <div class="act-time">${i === 0 ? "Hace 2 horas" : i === 1 ? "Ayer" : i === 2 ? "Ayer" : "Hace 3 días"}</div>
                        </div>`
            ).join("");
        }

        // Próximas evaluaciones (simuladas)
        const exams = document.getElementById("teacherUpcomingExams");
        if (exams) {
            const examenes = [
                { dia: "28", mes: "MAY", nombre: "Examen 1er bimestre", curso: "Matemática" },
                { dia: "29", mes: "MAY", nombre: "Examen 1er bimestre", curso: "Comunicación" },
                { dia: "30", mes: "MAY", nombre: "Práctica Calificada", curso: "Ciencia y Tecnología" },
                { dia: "02", mes: "JUN", nombre: "Trabajo Grupal", curso: "Historia" }
            ];
            exams.innerHTML = examenes.map(e =>
                `<div class="exam-item">
                            <div class="exam-date"><span class="day">${e.dia}</span><span class="month">${e.mes}</span></div>
                            <div class="exam-info">
                                <div class="exam-name">${e.nombre}</div>
                                <div class="exam-course">${e.curso}</div>
                            </div>
                            <span class="exam-status">Programada</span>
                        </div>`
            ).join("");
        }

        // Mensajes recientes (simulados)
        const msgs = document.getElementById("teacherRecentMessages");
        if (msgs) {
            const mensajes = [
                { avatar: "AR", nombre: "Coordinación Académica", preview: "Recorrer: entrega de silabos del 2do bimestre...", time: "Ayer" },
                { avatar: "ML", nombre: "María López (Secretaría)", preview: "Se ha actualizado el horario de reuniones...", time: "19/05/2026" },
                { avatar: "JP", nombre: "Juan Pérez (Docente)", preview: "Consulta sobre la evaluación de matemáticas.", time: "18/05/2026" }
            ];
            msgs.innerHTML = mensajes.map(m =>
                `<div class="msg-item">
                            <div class="msg-avatar">${m.avatar}</div>
                            <div class="msg-body">
                                <div class="msg-sender">${m.nombre}</div>
                                <div class="msg-preview">${m.preview}</div>
                                <div class="msg-time">${m.time}</div>
                            </div>
                        </div>`
            ).join("");
        }
    }

    // Alumno
    if (sesion && sesion.tipo === "Alumno") {
        const est = state.estudiantes.find(e => e.id === sesion.idEstudiante);
        if (est) {
            const misAsignaciones = state.asignaciones.filter(a => a.idEstudiante === est.id);
            const misCursoIds = new Set(misAsignaciones.map(a => a.idCurso));
            const misNotas = state.notas.filter(n => n.idEstudiante === est.id);
            const misAsistencias = state.asistencias.filter(a => a.idEstudiante === est.id);

            const promedio = misNotas.length ?
                (misNotas.reduce((s, n) => s + Number(n.calificacion), 0) / misNotas.length).toFixed(1) :
                "—";

            const presentes = misAsistencias.filter(a => a.estado === "Presente").length;
            const asistencia = misAsistencias.length ?
                Math.round((presentes / misAsistencias.length) * 100) + "%" :
                "—";

            const ultimoBimestre = misNotas.length ? Math.max(...misNotas.map(n => n.bimestre)) : "—";

            // Posición (simulada - calculada entre todos los estudiantes)
            const todosPromedios = state.estudiantes.map(e => {
                const notas = state.notas.filter(n => n.idEstudiante === e.id);
                return {
                    id: e.id,
                    promedio: notas.length ? notas.reduce((s, n) => s + n.calificacion, 0) / notas.length : 0
                };
            }).sort((a, b) => b.promedio - a.promedio);
            const posicion = todosPromedios.findIndex(p => p.id === est.id) + 1;
            const totalEstudiantes = todosPromedios.filter(p => p.promedio > 0).length;
            const posicionStr = posicion > 0 ? `${posicion} / ${totalEstudiantes}` : "—";

            setText("alumnoWelcomeName", `${est.nombres} ${est.apellidos}`);
            setText("studentCourseCount", misCursoIds.size);
            setText("studentLastBimestre", ultimoBimestre);
            setText("studentAttendance", asistencia);
            setText("studentPosition", posicionStr);
            setText("studentAverageCircle", promedio);
            setText("studentAttendanceMini", asistencia);
            setText("studentPositionMini", posicionStr);

            // Lista de cursos del alumno
            const courseList = document.getElementById("studentCourseList");
            if (courseList) {
                const cursosAlumno = state.cursos.filter(c => misCursoIds.has(c.id));
                courseList.innerHTML = cursosAlumno.map(c => {
                    const notasCurso = misNotas.filter(n => n.idCurso === c.id);
                    const promCurso = notasCurso.length ?
                        (notasCurso.reduce((s, n) => s + n.calificacion, 0) / notasCurso.length).toFixed(1) :
                        "—";
                    const ultimaNota = notasCurso.length ? notasCurso[notasCurso.length - 1] : null;
                    const docente = state.docentes.find(d => d.id === c.idDocente);
                    return `<tr>
                                <td><strong>${c.nombre}</strong></td>
                                <td>${docente ? docente.nombres : "—"}</td>
                                <td><span class="score-pill ${claseParaNota(Number(promCurso))}">${promCurso}</span></td>
                                <td>${ultimaNota ? `Bim. ${ultimaNota.bimestre}` : "—"}</td>
                                <td class="text-end"><button class="btn btn-sm btn-outline-brand" data-goto="misnotas">Ver detalle</button></td>
                            </tr>`;
                }).join("") || `<tr><td colspan="5" class="empty-state">No estás matriculado en ningún curso.</td></tr>`;
            }

            // Asistencia por curso
            const attendanceByCourse = document.getElementById("studentAttendanceByCourse");
            if (attendanceByCourse) {
                const cursosAlumno = state.cursos.filter(c => misCursoIds.has(c.id));
                attendanceByCourse.innerHTML = cursosAlumno.map(c => {
                    const asistenciasCurso = misAsistencias.filter(a => a.idCurso === c.id);
                    const presentesCurso = asistenciasCurso.filter(a => a.estado === "Presente").length;
                    const pct = asistenciasCurso.length ?
                        Math.round((presentesCurso / asistenciasCurso.length) * 100) :
                        0;
                    return `<div class="attendance-item">
                                <span class="course-name">${c.nombre}</span>
                                <span class="attendance-pct" style="color: ${pct >= 85 ? '#1e9b60' : pct >= 70 ? '#ff6b00' : '#c93a09'}">${pct}%</span>
                            </div>`;
                }).join("") || `<div class="empty-state">Sin datos de asistencia.</div>`;
            }

            // Perfil del alumno
            const profile = document.getElementById("studentProfile");
            if (profile) {
                profile.innerHTML = `
                            <div><strong>${est.nombres} ${est.apellidos}</strong></div>
                            <div style="color:#7b8798;font-size:.8rem;">${est.grado} · Sección ${est.seccion}</div>
                            <hr>
                            <div class="profile-field"><span class="field-label">Código</span><span class="field-value">EST2026${String(est.id).padStart(4,'0')}</span></div>
                            <div class="profile-field"><span class="field-label">Grado</span><span class="field-value">${est.grado}</span></div>
                            <div class="profile-field"><span class="field-label">Sección</span><span class="field-value">${est.seccion}</span></div>
                            <div class="profile-field"><span class="field-label">DNI</span><span class="field-value">${est.dni}</span></div>
                            <div class="profile-field"><span class="field-label">Correo</span><span class="field-value">${est.nombres.toLowerCase()}.${est.apellidos.toLowerCase()}@blenkir.edu.pe</span></div>
                            <div class="profile-field"><span class="field-label">Estado</span><span class="field-value"><span class="status-pill activo">Activo</span></span></div>
                        `;
            }

            // Resumen académico
            const summary = document.getElementById("studentAcademicSummary");
            if (summary) {
                const promedioGeneral = misNotas.length ?
                    (misNotas.reduce((s, n) => s + n.calificacion, 0) / misNotas.length).toFixed(1) :
                    "—";
                const asistenciasPct = misAsistencias.length ?
                    Math.round((misAsistencias.filter(a => a.estado === "Presente").length / misAsistencias.length) * 100) :
                    0;
                summary.innerHTML = `
                            <div class="summary-item"><span class="summary-label">Promedio general</span><span class="summary-value">${promedioGeneral}</span></div>
                            <div class="summary-item"><span class="summary-label">Puesto en el aula</span><span class="summary-value">${posicionStr}</span></div>
                            <div class="summary-item"><span class="summary-label">Asistencia general</span><span class="summary-value">${asistenciasPct}%</span></div>
                            <div class="summary-item"><span class="summary-label">Conducta</span><span class="summary-value">A</span></div>
                        `;
            }

            // Próximas evaluaciones (alumno)
            const upcomingExams = document.getElementById("studentUpcomingExams");
            if (upcomingExams) {
                const examenes = [
                    { dia: "28", mes: "MAY", nombre: "Examen 1er bimestre", curso: "Matemática" },
                    { dia: "29", mes: "MAY", nombre: "Examen 1er bimestre", curso: "Comunicación" },
                    { dia: "30", mes: "MAY", nombre: "Práctica Calificada", curso: "Ciencia y Tecnología" }
                ];
                upcomingExams.innerHTML = examenes.map(e =>
                    `<div class="exam-item">
                                <div class="exam-date"><span class="day">${e.dia}</span><span class="month">${e.mes}</span></div>
                                <div class="exam-info">
                                    <div class="exam-name">${e.nombre}</div>
                                    <div class="exam-course">${e.curso}</div>
                                </div>
                            </div>`
                ).join("");
            }

            // Avisos recientes
            const announcements = document.getElementById("studentRecentAnnouncements");
            if (announcements) {
                const avisos = [
                    { titulo: "Reunión de padres de familia", fecha: "25/05/2026" },
                    { titulo: "Entrega de boletas 1er bimestre", fecha: "20/05/2026" },
                    { titulo: "Feriado institucional", fecha: "15/05/2026" }
                ];
                announcements.innerHTML = avisos.map(a =>
                    `<div class="announcement-item">
                                <div class="ann-title">${a.titulo}</div>
                                <div class="ann-date">${a.fecha}</div>
                            </div>`
                ).join("");
            }
        }
    }
}

/* ============================================================
   RENDER: ESTUDIANTES
============================================================ */
function renderEstudiantes() {
    const tbody = document.getElementById("tbodyEstudiantes");
    const vacio = document.getElementById("emptyEstudiantes");
    const texto = document.getElementById("buscarEstudiante").value.trim().toLowerCase();
    const estadoFiltro = document.getElementById("filtroEstadoEstudiante").value;

    const lista = state.estudiantes.filter(e => {
        const coincideTexto = !texto ||
            `${e.nombres} ${e.apellidos}`.toLowerCase().includes(texto) ||
            e.dni.includes(texto);
        const coincideEstado = !estadoFiltro || e.estado === estadoFiltro;
        return coincideTexto && coincideEstado;
    });

    tbody.innerHTML = "";
    vacio.classList.toggle("d-none", lista.length > 0);

    lista.forEach(e => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td><strong>${e.nombres} ${e.apellidos}</strong><br><span class="text-muted" style="font-size:0.76rem;">DNI ${e.dni}</span></td>
                    <td>${e.dni}</td>
                    <td>${e.grado}</td>
                    <td><span class="grade-pill">${e.seccion}</span></td>
                    <td><span class="status-pill ${e.estado}">${e.estado === "activo" ? "Activo" : "Inactivo"}</span></td>
                    <td class="text-end">
                        <button class="btn-icon" title="Editar" data-accion="editar-estudiante" data-id="${e.id}">✎</button>
                        <button class="btn-icon" title="${e.estado === "activo" ? "Desactivar" : "Activar"}" data-accion="toggle-estudiante" data-id="${e.id}">⏻</button>
                        <button class="btn-icon danger" title="Eliminar" data-accion="eliminar-estudiante" data-id="${e.id}">✕</button>
                    </td>
                `;
        tbody.appendChild(tr);
    });

    actualizarSelectsGlobales();
    renderDashboard();
}

function limpiarFormEstudiante() {
    document.getElementById("formEstudiante").reset();
    document.getElementById("estId").value = "";
    document.getElementById("tituloFormEstudiante").textContent = "Registrar estudiante";
    document.getElementById("btnGuardarEstudiante").textContent = "Guardar estudiante";
    document.getElementById("btnCancelarEdicionEst").classList.add("d-none");
}

document.getElementById("formEstudiante").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const id = document.getElementById("estId").value;
    const nombres = document.getElementById("estNombres").value.trim();
    const apellidos = document.getElementById("estApellidos").value.trim();
    const dni = document.getElementById("estDni").value.trim();
    const grado = document.getElementById("estGrado").value;
    const seccion = document.getElementById("estSeccion").value;

    if (!nombres || !apellidos || !dni || !grado || !seccion) return;
    if (!/^\d{6,15}$/.test(dni)) {
        alert("El DNI debe contener solo números (6 a 15 dígitos).");
        return;
    }

    if (id) {
        const est = state.estudiantes.find(e => e.id === Number(id));
        Object.assign(est, { nombres, apellidos, dni, grado, seccion });
        mostrarToast("Estudiante actualizado.");
    } else {
        state.estudiantes.push({
            id: generarId(state.estudiantes),
            nombres,
            apellidos,
            dni,
            grado,
            seccion,
            estado: "activo"
        });
        mostrarToast("Estudiante guardado.");
    }

    guardarEstado();
    limpiarFormEstudiante();
    renderEstudiantes();
});

document.getElementById("btnCancelarEdicionEst").addEventListener("click", limpiarFormEstudiante);
document.getElementById("buscarEstudiante").addEventListener("input", renderEstudiantes);
document.getElementById("filtroEstadoEstudiante").addEventListener("change", renderEstudiantes);

document.getElementById("tbodyEstudiantes").addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-accion]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const est = state.estudiantes.find(e => e.id === id);

    if (btn.dataset.accion === "editar-estudiante") {
        document.getElementById("estId").value = est.id;
        document.getElementById("estNombres").value = est.nombres;
        document.getElementById("estApellidos").value = est.apellidos;
        document.getElementById("estDni").value = est.dni;
        document.getElementById("estGrado").value = est.grado;
        document.getElementById("estSeccion").value = est.seccion;
        document.getElementById("tituloFormEstudiante").textContent = "Modificar estudiante";
        document.getElementById("btnGuardarEstudiante").textContent = "Guardar cambios";
        document.getElementById("btnCancelarEdicionEst").classList.remove("d-none");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (btn.dataset.accion === "toggle-estudiante") {
        est.estado = est.estado === "activo" ? "inactivo" : "activo";
        guardarEstado();
        renderEstudiantes();
        mostrarToast(`Estudiante ${est.estado === "activo" ? "activado" : "desactivado"}.`);
    }

    if (btn.dataset.accion === "eliminar-estudiante") {
        if (!confirm("Esto eliminará también sus notas, asistencias y matrículas. ¿Continuar?")) return;
        state.estudiantes = state.estudiantes.filter(e => e.id !== id);
        state.notas = state.notas.filter(n => n.idEstudiante !== id);
        state.asistencias = state.asistencias.filter(a => a.idEstudiante !== id);
        state.asignaciones = state.asignaciones.filter(a => a.idEstudiante !== id);
        guardarEstado();
        renderEstudiantes();
        renderNotas();
        renderAsistencia();
        mostrarToast("Estudiante eliminado.");
    }
});

/* ============================================================
   RENDER: DOCENTES
============================================================ */
function renderDocentes() {
    const tbody = document.getElementById("tbodyDocentes");
    const vacio = document.getElementById("emptyDocentes");
    tbody.innerHTML = "";
    vacio.classList.toggle("d-none", state.docentes.length > 0);

    state.docentes.forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td><strong>${d.nombres}</strong></td>
                    <td>${d.especialidad}</td>
                    <td>${d.email}</td>
                    <td><span class="status-pill ${d.estado}">${d.estado === "activo" ? "Activo" : "Inactivo"}</span></td>
                    <td class="text-end">
                        <button class="btn-icon" title="Editar" data-accion="editar-docente" data-id="${d.id}">✎</button>
                        <button class="btn-icon" title="${d.estado === "activo" ? "Desactivar" : "Activar"}" data-accion="toggle-docente" data-id="${d.id}">⏻</button>
                        <button class="btn-icon danger" title="Eliminar" data-accion="eliminar-docente" data-id="${d.id}">✕</button>
                    </td>
                `;
        tbody.appendChild(tr);
    });

    actualizarSelectsGlobales();
    renderDashboard();
}

function limpiarFormDocente() {
    document.getElementById("formDocente").reset();
    document.getElementById("docId").value = "";
    document.getElementById("tituloFormDocente").textContent = "Registrar docente";
    document.getElementById("btnGuardarDocente").textContent = "Guardar docente";
    document.getElementById("btnCancelarEdicionDoc").classList.add("d-none");
}

document.getElementById("formDocente").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const id = document.getElementById("docId").value;
    const nombres = document.getElementById("docNombres").value.trim();
    const especialidad = document.getElementById("docEspecialidad").value.trim();
    const email = document.getElementById("docEmail").value.trim();
    if (!nombres || !especialidad || !email) return;

    if (id) {
        const doc = state.docentes.find(d => d.id === Number(id));
        Object.assign(doc, { nombres, especialidad, email });
        mostrarToast("Docente actualizado.");
    } else {
        state.docentes.push({
            id: generarId(state.docentes),
            nombres,
            especialidad,
            email,
            estado: "activo"
        });
        mostrarToast("Docente guardado.");
    }

    guardarEstado();
    limpiarFormDocente();
    renderDocentes();
});

document.getElementById("btnCancelarEdicionDoc").addEventListener("click", limpiarFormDocente);

document.getElementById("tbodyDocentes").addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-accion]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const doc = state.docentes.find(d => d.id === id);

    if (btn.dataset.accion === "editar-docente") {
        document.getElementById("docId").value = doc.id;
        document.getElementById("docNombres").value = doc.nombres;
        document.getElementById("docEspecialidad").value = doc.especialidad;
        document.getElementById("docEmail").value = doc.email;
        document.getElementById("tituloFormDocente").textContent = "Modificar docente";
        document.getElementById("btnGuardarDocente").textContent = "Guardar cambios";
        document.getElementById("btnCancelarEdicionDoc").classList.remove("d-none");
    }

    if (btn.dataset.accion === "toggle-docente") {
        doc.estado = doc.estado === "activo" ? "inactivo" : "activo";
        guardarEstado();
        renderDocentes();
    }

    if (btn.dataset.accion === "eliminar-docente") {
        const enUso = state.cursos.some(c => c.idDocente === id);
        if (enUso) {
            alert("Este docente tiene cursos asignados. Reasigna esos cursos antes de eliminarlo.");
            return;
        }
        if (!confirm("¿Eliminar este docente?")) return;
        state.docentes = state.docentes.filter(d => d.id !== id);
        guardarEstado();
        renderDocentes();
        mostrarToast("Docente eliminado.");
    }
});

/* ============================================================
   RENDER: CURSOS
============================================================ */
function renderCursos() {
    const tbody = document.getElementById("tbodyCursos");
    const vacio = document.getElementById("emptyCursos");
    tbody.innerHTML = "";
    vacio.classList.toggle("d-none", state.cursos.length > 0);

    state.cursos.forEach(c => {
        const doc = state.docentes.find(d => d.id === c.idDocente);
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td><strong>${c.nombre}</strong></td>
                    <td>${doc ? doc.nombres : "Sin asignar"}</td>
                    <td><span class="grade-pill">${c.creditos} cr.</span></td>
                    <td class="text-end">
                        <button class="btn-icon danger" title="Eliminar" data-accion="eliminar-curso" data-id="${c.id}">✕</button>
                    </td>
                `;
        tbody.appendChild(tr);
    });

    actualizarSelectsGlobales();
    renderDashboard();
}

document.getElementById("formCurso").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const nombre = document.getElementById("curNombre").value.trim();
    const idDocente = Number(document.getElementById("curDocente").value);
    const creditos = Number(document.getElementById("curCreditos").value);
    if (!nombre || !idDocente || !creditos) return;

    state.cursos.push({
        id: generarId(state.cursos),
        nombre,
        idDocente,
        creditos
    });
    guardarEstado();
    renderCursos();
    ev.target.reset();
    document.getElementById("curCreditos").value = 3;
    mostrarToast("Curso guardado.");
});

document.getElementById("tbodyCursos").addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-accion='eliminar-curso']");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const enUso = state.notas.some(n => n.idCurso === id) ||
        state.asistencias.some(a => a.idCurso === id);
    if (enUso && !confirm("Este curso tiene notas o asistencia registradas. ¿Eliminar de todos modos?")) return;
    state.cursos = state.cursos.filter(c => c.id !== id);
    state.asignaciones = state.asignaciones.filter(a => a.idCurso !== id);
    state.notas = state.notas.filter(n => n.idCurso !== id);
    state.asistencias = state.asistencias.filter(a => a.idCurso !== id);
    guardarEstado();
    renderCursos();
    renderNotas();
    renderAsistencia();
    mostrarToast("Curso eliminado.");
});

/* ============================================================
   RENDER: ASIGNACIÓN
============================================================ */
function renderAsignacion() {
    const idCurso = Number(document.getElementById("asigCurso").value) || null;
    const tbody = document.getElementById("tbodyAsignacion");
    const vacio = document.getElementById("emptyAsignacion");
    tbody.innerHTML = "";

    if (!idCurso) {
        vacio.classList.remove("d-none");
        vacio.textContent = "Elige un curso para ver a los estudiantes.";
        return;
    }

    const activos = state.estudiantes.filter(e => e.estado === "activo");
    vacio.classList.toggle("d-none", activos.length > 0);
    if (activos.length === 0) vacio.textContent = "No hay estudiantes activos.";

    activos.forEach(e => {
        const matriculado = state.asignaciones.some(a =>
            a.idCurso === idCurso && a.idEstudiante === e.id
        );
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td><strong>${e.nombres} ${e.apellidos}</strong></td>
                    <td>${e.grado} · ${e.seccion}</td>
                    <td class="text-end">
                        <div class="form-check form-switch d-flex justify-content-end">
                            <input class="form-check-input" type="checkbox" role="switch" data-id="${e.id}" ${matriculado ? "checked" : ""}>
                        </div>
                    </td>
                `;
        tbody.appendChild(tr);
    });
}

document.getElementById("asigCurso").addEventListener("change", renderAsignacion);

document.getElementById("tbodyAsignacion").addEventListener("change", (ev) => {
    const check = ev.target.closest("input[type='checkbox']");
    if (!check) return;
    const idCurso = Number(document.getElementById("asigCurso").value);
    const idEstudiante = Number(check.dataset.id);

    if (check.checked) {
        state.asignaciones.push({
            id: generarId(state.asignaciones),
            idCurso,
            idEstudiante
        });
        mostrarToast("Estudiante matriculado en el curso.");
    } else {
        state.asignaciones = state.asignaciones.filter(a =>
            !(a.idCurso === idCurso && a.idEstudiante === idEstudiante)
        );
        mostrarToast("Estudiante retirado del curso.");
    }
    guardarEstado();
    actualizarSelectsGlobales();
});

/* ============================================================
   RENDER: NOTAS / CALIFICACIONES
============================================================ */
document.getElementById("notaCurso").addEventListener("change", () => {
    actualizarComboEstudiantesPorCurso("notaCurso", "notaEstudiante");
});

function renderNotas() {
    const tbody = document.getElementById("tbodyNotas");
    const vacio = document.getElementById("emptyNotas");
    const filtroCurso = document.getElementById("filtroCursoNotas").value;

    const lista = state.notas.filter(n => !filtroCurso || n.idCurso === Number(filtroCurso));
    tbody.innerHTML = "";
    vacio.classList.toggle("d-none", lista.length > 0);

    lista.forEach(n => {
        const est = state.estudiantes.find(e => e.id === n.idEstudiante);
        const cur = state.cursos.find(c => c.id === n.idCurso);
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${est ? est.nombres + " " + est.apellidos : "—"}</td>
                    <td>${cur ? cur.nombre : "—"}</td>
                    <td>${n.bimestre}</td>
                    <td><span class="score-pill ${claseParaNota(n.calificacion)}">${n.calificacion.toFixed(1)}</span></td>
                    <td>${n.fecha}</td>
                    <td class="text-end"><button class="btn-icon danger" title="Eliminar" data-accion="eliminar-nota" data-id="${n.id}">✕</button></td>
                `;
        tbody.appendChild(tr);
    });

    renderDashboard();
}

document.getElementById("formNota").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const idCurso = Number(document.getElementById("notaCurso").value);
    const idEstudiante = Number(document.getElementById("notaEstudiante").value);
    const bimestre = Number(document.getElementById("notaBimestre").value);
    const calificacion = Number(document.getElementById("notaCalificacion").value);

    if (!idCurso || !idEstudiante || !bimestre || calificacion < 0 || calificacion > 20) {
        alert("Revisa los datos: la calificación debe estar entre 0 y 20.");
        return;
    }

    state.notas.push({
        id: generarId(state.notas),
        idCurso,
        idEstudiante,
        bimestre,
        calificacion,
        fecha: hoyISO()
    });
    guardarEstado();
    renderNotas();
    actualizarPromedio(idEstudiante);
    document.getElementById("notaCalificacion").value = "";
    mostrarToast("Nota registrada.");
});

document.getElementById("notaEstudiante").addEventListener("change", (ev) => {
    actualizarPromedio(Number(ev.target.value));
});

function actualizarPromedio(idEstudiante) {
    const box = document.getElementById("promedioBox");
    const valor = document.getElementById("promedioValor");
    const notasEst = state.notas.filter(n => n.idEstudiante === idEstudiante);
    if (!idEstudiante || notasEst.length === 0) {
        box.style.display = "none";
        return;
    }
    const promedio = notasEst.reduce((acc, n) => acc + n.calificacion, 0) / notasEst.length;
    valor.textContent = promedio.toFixed(1);
    box.style.display = "flex";
}

document.getElementById("filtroCursoNotas").addEventListener("change", renderNotas);

document.getElementById("tbodyNotas").addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-accion='eliminar-nota']");
    if (!btn) return;
    state.notas = state.notas.filter(n => n.id !== Number(btn.dataset.id));
    guardarEstado();
    renderNotas();
    mostrarToast("Nota eliminada.");
});

/* ============================================================
   RENDER: ASISTENCIA
============================================================ */
document.getElementById("asisCurso").addEventListener("change", () => {
    actualizarComboEstudiantesPorCurso("asisCurso", "asisEstudiante");
});

function renderAsistencia() {
    const tbody = document.getElementById("tbodyAsistencia");
    const vacio = document.getElementById("emptyAsistencia");
    const filtroEst = document.getElementById("filtroEstudianteAsistencia").value;

    const lista = state.asistencias
        .filter(a => !filtroEst || a.idEstudiante === Number(filtroEst))
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

    tbody.innerHTML = "";
    vacio.classList.toggle("d-none", lista.length > 0);

    lista.forEach(a => {
        const est = state.estudiantes.find(e => e.id === a.idEstudiante);
        const cur = state.cursos.find(c => c.id === a.idCurso);
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${est ? est.nombres + " " + est.apellidos : "—"}</td>
                    <td>${cur ? cur.nombre : "—"}</td>
                    <td>${a.fecha}</td>
                    <td><span class="status-pill ${a.estado.toLowerCase()}">${a.estado}</span></td>
                    <td class="text-end"><button class="btn-icon danger" title="Eliminar" data-accion="eliminar-asistencia" data-id="${a.id}">✕</button></td>
                `;
        tbody.appendChild(tr);
    });

    renderDashboard();
}

document.getElementById("formAsistencia").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const idCurso = Number(document.getElementById("asisCurso").value);
    const idEstudiante = Number(document.getElementById("asisEstudiante").value);
    const fecha = document.getElementById("asisFecha").value;
    const estado = document.getElementById("asisEstado").value;
    if (!idCurso || !idEstudiante || !fecha || !estado) return;

    state.asistencias.push({
        id: generarId(state.asistencias),
        idCurso,
        idEstudiante,
        fecha,
        estado
    });
    guardarEstado();
    renderAsistencia();
    mostrarToast("Asistencia registrada.");
});

document.getElementById("filtroEstudianteAsistencia").addEventListener("change", renderAsistencia);

document.getElementById("tbodyAsistencia").addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-accion='eliminar-asistencia']");
    if (!btn) return;
    state.asistencias = state.asistencias.filter(a => a.id !== Number(btn.dataset.id));
    guardarEstado();
    renderAsistencia();
    mostrarToast("Registro de asistencia eliminado.");
});

/* ============================================================
   RENDER: REPORTES
============================================================ */
function renderReportes() {
    const activo = document.querySelector(".subpanel-rep.active");
    if (!activo) return;
    if (activo.id === "rep-notas") renderRepNotas();
    if (activo.id === "rep-asistencia") renderRepAsistencia();
    if (activo.id === "rep-rendimiento") renderRepRendimiento();
    if (activo.id === "rep-historial") renderRepHistorial();
}

function renderRepNotas() {
    const tbody = document.getElementById("tbodyRepNotas");
    const filtroCurso = document.getElementById("repFiltroCurso").value;
    const lista = state.notas.filter(n => !filtroCurso || n.idCurso === Number(filtroCurso));

    tbody.innerHTML = lista.map(n => {
        const est = state.estudiantes.find(e => e.id === n.idEstudiante);
        const cur = state.cursos.find(c => c.id === n.idCurso);
        return `<tr>
                    <td>${est ? est.nombres + " " + est.apellidos : "—"}</td>
                    <td>${cur ? cur.nombre : "—"}</td>
                    <td>${n.bimestre}</td>
                    <td><span class="score-pill ${claseParaNota(n.calificacion)}">${n.calificacion.toFixed(1)}</span></td>
                </tr>`;
    }).join("") || `<tr><td colspan="4" class="empty-state">Sin datos aún.</td></tr>`;
}

document.getElementById("repFiltroCurso").addEventListener("change", renderRepNotas);

function renderRepAsistencia() {
    const tbody = document.getElementById("tbodyRepAsistencia");
    tbody.innerHTML = state.estudiantes.map(e => {
        const registros = state.asistencias.filter(a => a.idEstudiante === e.id);
        if (registros.length === 0) return "";
        const presente = registros.filter(a => a.estado === "Presente").length;
        const tardanza = registros.filter(a => a.estado === "Tardanza").length;
        const inasistencia = registros.filter(a => a.estado === "Inasistencia").length;
        const pct = (((presente + tardanza) / registros.length) * 100).toFixed(0);
        return `<tr>
                    <td><strong>${e.nombres} ${e.apellidos}</strong></td>
                    <td>${presente}</td>
                    <td>${tardanza}</td>
                    <td>${inasistencia}</td>
                    <td><span class="status-pill ${pct >= 85 ? "activo" : "inasistencia"}">${pct}%</span></td>
                </tr>`;
    }).join("") || `<tr><td colspan="5" class="empty-state">Sin datos aún.</td></tr>`;
}

function renderRepRendimiento() {
    const tbody = document.getElementById("tbodyRepRendimiento");
    const ranking = state.estudiantes.map(e => {
        const notasEst = state.notas.filter(n => n.idEstudiante === e.id);
        const promedio = notasEst.length ?
            notasEst.reduce((acc, n) => acc + n.calificacion, 0) / notasEst.length :
            null;
        return { est: e, promedio, cantidad: notasEst.length };
    }).filter(r => r.promedio !== null)
        .sort((a, b) => b.promedio - a.promedio);

    tbody.innerHTML = ranking.map((r, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td><strong>${r.est.nombres} ${r.est.apellidos}</strong></td>
                    <td><span class="score-pill ${claseParaNota(r.promedio)}">${r.promedio.toFixed(1)}</span></td>
                    <td>${r.cantidad}</td>
                </tr>
            `).join("") || `<tr><td colspan="4" class="empty-state">Sin datos aún.</td></tr>`;
}

function renderRepHistorial() {
    const tbody = document.getElementById("tbodyRepHistorial");
    const eventosNotas = state.notas.map(n => ({
        fecha: n.fecha,
        tipo: "Nota",
        idEstudiante: n.idEstudiante,
        idCurso: n.idCurso,
        detalle: `Bimestre ${n.bimestre} · ${n.calificacion.toFixed(1)}`
    }));
    const eventosAsistencia = state.asistencias.map(a => ({
        fecha: a.fecha,
        tipo: "Asistencia",
        idEstudiante: a.idEstudiante,
        idCurso: a.idCurso,
        detalle: a.estado
    }));

    const todos = [...eventosNotas, ...eventosAsistencia]
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

    tbody.innerHTML = todos.map(ev => {
        const est = state.estudiantes.find(e => e.id === ev.idEstudiante);
        const cur = state.cursos.find(c => c.id === ev.idCurso);
        return `<tr>
                    <td>${ev.fecha}</td>
                    <td><span class="grade-pill">${ev.tipo}</span></td>
                    <td>${est ? est.nombres + " " + est.apellidos : "—"}</td>
                    <td>${cur ? cur.nombre : "—"}</td>
                    <td>${ev.detalle}</td>
                </tr>`;
    }).join("") || `<tr><td colspan="5" class="empty-state">Sin datos aún.</td></tr>`;
}

/* ============================================================
   RENDER: MIS NOTAS (ALUMNO)
============================================================ */
function renderMisNotas() {
    if (sesion.tipo !== "Alumno") return;
    const est = state.estudiantes.find(e => e.id === sesion.idEstudiante);

    document.getElementById("alumnoNombre").textContent = est ? `${est.nombres} ${est.apellidos}` : sesion.nombre;
    document.getElementById("alumnoMeta").textContent = est ? `${est.grado} · Sección ${est.seccion} · DNI ${est.dni}` : "";

    const notasEst = state.notas.filter(n => n.idEstudiante === sesion.idEstudiante)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

    const tbody = document.getElementById("tbodyMisNotas");
    const vacio = document.getElementById("emptyMisNotas");
    tbody.innerHTML = "";
    vacio.classList.toggle("d-none", notasEst.length > 0);

    notasEst.forEach(n => {
        const cur = state.cursos.find(c => c.id === n.idCurso);
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${cur ? cur.nombre : "—"}</td>
                    <td>${n.bimestre}</td>
                    <td><span class="score-pill ${claseParaNota(n.calificacion)}">${n.calificacion.toFixed(1)}</span></td>
                    <td>${n.fecha}</td>
                `;
        tbody.appendChild(tr);
    });

    const valor = document.getElementById("promedioAlumnoValor");
    if (notasEst.length === 0) {
        valor.textContent = "—";
    } else {
        const promedio = notasEst.reduce((acc, n) => acc + n.calificacion, 0) / notasEst.length;
        valor.textContent = promedio.toFixed(1);
    }
}

/* ============================================================
   DATOS DE DEMOSTRACIÓN (30 estudiantes)
============================================================ */
function sembrarDatosDemo() {
    // 🔥 FORZAR RECARGA DE DATOS: limpiar el localStorage primero
    // Esto asegura que siempre se carguen los datos nuevos
    // Si quieres mantener datos guardados, elimina esta línea
    // localStorage.removeItem(STORAGE_KEY);

    // Solo sembrar si no hay datos
    if (state.estudiantes.length > 0 || state.docentes.length > 0) {
        console.log("Los datos ya existen, no se sobrescriben.");
        return;
    }

    console.log("Sembrando datos de demostración con 30 estudiantes...");

    // Docentes (6)
    state.docentes = [
        { id: 1, nombres: "Carlos Ruiz", especialidad: "Matemática", email: "carlos.ruiz@blenkir.edu", estado: "activo" },
        { id: 2, nombres: "Ana Torres", especialidad: "Comunicación", email: "ana.torres@blenkir.edu", estado: "activo" },
        { id: 3, nombres: "Luis Martínez", especialidad: "Ciencia y Tecnología", email: "luis.martinez@blenkir.edu", estado: "activo" },
        { id: 4, nombres: "María Rivera", especialidad: "Historia", email: "maria.rivera@blenkir.edu", estado: "activo" },
        { id: 5, nombres: "Susan Pinto", especialidad: "Inglés", email: "susan.pinto@blenkir.edu", estado: "activo" },
        { id: 6, nombres: "Pedro Torres", especialidad: "Educación Física", email: "pedro.torres@blenkir.edu", estado: "activo" },
    ];

    // Cursos (6)
    state.cursos = [
        { id: 1, nombre: "Matemática", idDocente: 1, creditos: 4 },
        { id: 2, nombre: "Comunicación", idDocente: 2, creditos: 3 },
        { id: 3, nombre: "Ciencia y Tecnología", idDocente: 3, creditos: 3 },
        { id: 4, nombre: "Historia, Geografía y Economía", idDocente: 4, creditos: 3 },
        { id: 5, nombre: "Inglés", idDocente: 5, creditos: 2 },
        { id: 6, nombre: "Educación Física", idDocente: 6, creditos: 2 },
    ];

    // 30 estudiantes
    const nombres = [
        "Ana", "Luis", "María", "José", "Laura", "Carlos", "Valentina", "Diego",
        "Isabella", "Mateo", "Sofía", "Javier", "Camila", "Andrés", "Valeria",
        "Daniel", "Lucía", "Gabriel", "Emilia", "Santiago", "Victoria", "Nicolás",
        "Rafael", "Paula", "Adrián", "Clara", "Hugo", "Elena", "Iván", "Renata"
    ];
    const apellidos = [
        "Quispe Torres", "Fernández Vera", "Gómez Paredes", "Ramírez Flores",
        "Sánchez Ortiz", "Mendoza Rojas", "Castro Herrera", "Ponce Jiménez",
        "Rojas Núñez", "Vargas León", "Díaz Paredes", "Cruz Martínez",
        "Torres Rivas", "Morales Castro", "Ortega Silva", "Ramos Juárez",
        "Flores Mendoza", "Reyes Ponce", "Gutiérrez Ramos", "Méndez Ortega",
        "Herrera Castro", "López Ramírez", "Martínez Sánchez", "García Torres",
        "Pérez González", "Rodríguez Ruiz", "Fernández Díaz", "Luna Cruz",
        "Ramos Flores", "Molina Rojas"
    ];
    const grados = ["1ro Secundaria", "2do Secundaria", "3ro Secundaria", "4to Secundaria", "5to Secundaria"];
    const secciones = ["A", "B"];

    state.estudiantes = [];
    let idEst = 1;
    let dniBase = 71000000;

    for (let i = 0; i < 30; i++) {
        const grado = grados[Math.floor(i / 6) % grados.length];
        const seccion = secciones[Math.floor(i / 3) % 2];
        state.estudiantes.push({
            id: idEst++,
            nombres: nombres[i % nombres.length],
            apellidos: apellidos[i % apellidos.length],
            dni: String(dniBase + i),
            grado: grado,
            seccion: seccion,
            estado: "activo"
        });
    }

    // Asignaciones: todos los estudiantes a todos los cursos
    state.asignaciones = [];
    let idAsig = 1;
    state.estudiantes.forEach(e => {
        state.cursos.forEach(c => {
            state.asignaciones.push({
                id: idAsig++,
                idCurso: c.id,
                idEstudiante: e.id
            });
        });
    });

    // Notas: cada estudiante tiene notas en 2 bimestres para cada curso
    state.notas = [];
    let idNota = 1;
    const bimestres = [1, 2];

    state.estudiantes.forEach(e => {
        state.cursos.forEach(c => {
            bimestres.forEach(bim => {
                const nota = (8 + Math.random() * 12).toFixed(1);
                state.notas.push({
                    id: idNota++,
                    idCurso: c.id,
                    idEstudiante: e.id,
                    bimestre: bim,
                    calificacion: Number(nota),
                    fecha: hoyISO()
                });
            });
        });
    });

    // Asistencias: cada estudiante tiene 3 registros por curso
    state.asistencias = [];
    let idAsis = 1;
    const estados = ["Presente", "Presente", "Presente", "Tardanza", "Inasistencia"];

    state.estudiantes.forEach(e => {
        state.cursos.forEach(c => {
            for (let i = 0; i < 3; i++) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i * 3);
                state.asistencias.push({
                    id: idAsis++,
                    idCurso: c.id,
                    idEstudiante: e.id,
                    fecha: fecha.toISOString().slice(0, 10),
                    estado: estados[Math.floor(Math.random() * estados.length)]
                });
            }
        });
    });

    guardarEstado();
    console.log("Datos sembrados exitosamente:", {
        estudiantes: state.estudiantes.length,
        docentes: state.docentes.length,
        cursos: state.cursos.length,
        asignaciones: state.asignaciones.length,
        notas: state.notas.length,
        asistencias: state.asistencias.length
    });
}

/* ============================================================
   FUNCIÓN PARA REINICIAR DATOS (desde consola)
============================================================ */
function reiniciarDatos() {
    localStorage.removeItem(STORAGE_KEY);
    // Limpiar el estado actual
    state.estudiantes = [];
    state.docentes = [];
    state.cursos = [];
    state.asignaciones = [];
    state.notas = [];
    state.asistencias = [];
    state.avisos = [];
    // Sembrar de nuevo
    sembrarDatosDemo();
    // Refrescar la interfaz si está iniciada
    if (document.getElementById("appShell").classList.contains("d-none") === false) {
        renderEstudiantes();
        renderDocentes();
        renderCursos();
        renderAsignacion();
        renderNotas();
        renderAsistencia();
        renderReportes();
        renderDashboard();
        renderMisNotas();
        mostrarToast("Datos reiniciados con 30 estudiantes.");
    }
}

// Exponer la función para usarla desde la consola del navegador
window.reiniciarDatos = reiniciarDatos;

/* ============================================================
   INICIO DE LA APLICACIÓN
============================================================ */
function iniciarApp() {
    document.getElementById("pantallaLogin").classList.add("d-none");
    document.getElementById("appShell").classList.remove("d-none");
    document.getElementById("userNombre").textContent = sesion.nombre;
    document.getElementById("userRol").textContent = sesion.tipo;

    aplicarPermisosPorRol();

    document.querySelectorAll("[data-dashboard-role]").forEach(panel => {
        panel.classList.toggle("d-none", panel.dataset.dashboardRole !== sesion.tipo);
    });
    document.getElementById("asisFecha").value = hoyISO();

    renderEstudiantes();
    renderDocentes();
    renderCursos();
    renderAsignacion();
    renderNotas();
    renderAsistencia();
    renderReportes();
    renderDashboard();
    renderMisNotas();

    irAVista("dashboard");
}

/* ============================================================
   EVENTO DOMContentLoaded
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    cargarEstado();

    // 🔥 FORZAR RECARGA: Si hay menos de 20 estudiantes, reiniciar datos
    if (state.estudiantes.length < 20) {
        console.log("Pocos estudiantes detectados, reiniciando datos...");
        localStorage.removeItem(STORAGE_KEY);
        state.estudiantes = [];
        state.docentes = [];
        state.cursos = [];
        state.asignaciones = [];
        state.notas = [];
        state.asistencias = [];
        sembrarDatosDemo();
    } else {
        sembrarDatosDemo(); // Solo si no hay datos
    }

    inicializarNavegacion();

    const sesionGuardada = sessionStorage.getItem("blenkirahora_sesion");
    if (sesionGuardada) {
        sesion = JSON.parse(sesionGuardada);
        iniciarApp();
    }
});

// Mostrar mensaje en consola con instrucciones
console.log("📚 BLENKIR - Sistema de Seguimiento Académico");
console.log("🔧 Para reiniciar los datos con 30 estudiantes, escribe en consola: reiniciarDatos()");