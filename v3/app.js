
const STORAGE_KEY = "blenkirahora_data_v2";

/* Usuarios de demostración (en un sistema real esto vendría del backend) */
const USUARIOS_DEMO = [
  { usuario: "admin", password: "admin123", tipo: "Administrador", nombre: "Admin General" },
  { usuario: "docente", password: "docente123", tipo: "Docente", nombre: "Prof. Carlos Ruiz" },
  { usuario: "alumno", password: "alumno123", tipo: "Alumno", nombre: "Ana Quispe Torres", idEstudiante: 1 },
];

const state = {
  estudiantes: [],
  docentes: [],
  cursos: [],
  asignaciones: [], 
  notas: [],        
  asistencias: []   
};

let sesion = null; // { usuario, tipo, nombre }


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

/*  Toast  */
let toastInstance;
function mostrarToast(mensaje) {
  const toastEl = document.getElementById("appToast");
  document.getElementById("appToastBody").textContent = mensaje;
  if (!toastInstance) toastInstance = new bootstrap.Toast(toastEl, { delay: 2200 });
  toastInstance.show();
}

/* LOGIN */
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
  sesion = { usuario: encontrado.usuario, tipo: encontrado.tipo, nombre: encontrado.nombre, idEstudiante: encontrado.idEstudiante || null };
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

/* NAVEGACIÓN (sidebar + dashboard + subtabs)*/
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

/* PANEL PRINCIPAL*/
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

    const preview = document.getElementById("teacherCoursesPreview");
    if (preview) {
      preview.innerHTML = misCursos.length
        ? misCursos.map(c => {
            const alumnos = state.asignaciones.filter(a => a.idCurso === c.idCurso || a.idCurso === c.id).length;
            return `<div class="course-preview-row">
              <div><strong>${c.nombre}</strong><small>${c.creditos} créditos</small></div>
              <span>${alumnos} estudiante${alumnos === 1 ? "" : "s"}</span>
            </div>`;
          }).join("")
        : `<div class="empty-state">No tienes cursos asignados.</div>`;
    }
  }

  // Alumno
  if (sesion && sesion.tipo === "Alumno") {
    const est = state.estudiantes.find(e => e.id === sesion.idEstudiante);
    if (est) {
      const misAsignaciones = state.asignaciones.filter(a => a.idEstudiante === est.id);
      const misCursoIds = new Set(misAsignaciones.map(a => a.idCurso));
      const misNotas = state.notas
        .filter(n => n.idEstudiante === est.id)
        .sort((a,b) => b.fecha.localeCompare(a.fecha));
      const misAsistencias = state.asistencias.filter(a => a.idEstudiante === est.id);

      const promedio = misNotas.length
        ? (misNotas.reduce((s, n) => s + Number(n.calificacion), 0) / misNotas.length).toFixed(1)
        : "—";

      const presentes = misAsistencias.filter(a => a.estado === "Presente").length;
      const asistencia = misAsistencias.length
        ? Math.round((presentes / misAsistencias.length) * 100) + "%"
        : "—";

      setText("alumnoWelcomeName", `${est.nombres} ${est.apellidos}`);
      setText("studentCourseCount", misCursoIds.size);
      setText("studentAverage", promedio);
      setText("studentAverageCircle", promedio);
      setText("studentAttendance", asistencia);
      setText("studentLastGrade", misNotas.length ? misNotas[0].calificacion : "—");

      const tbody = document.getElementById("studentGradesPreview");
      if (tbody) {
        tbody.innerHTML = misNotas.length
          ? misNotas.slice(0, 5).map(n => {
              const curso = state.cursos.find(c => c.id === n.idCurso);
              return `<tr>
                <td>${curso ? curso.nombre : "Curso"}</td>
                <td>${n.bimestre}</td>
                <td><span class="score-pill ${n.calificacion < 11 ? "low" : n.calificacion >= 17 ? "high" : ""}">${n.calificacion}</span></td>
                <td>${n.fecha}</td>
              </tr>`;
            }).join("")
          : `<tr><td colspan="4" class="text-center text-muted">Aún no tienes calificaciones registradas.</td></tr>`;
      }
    }
  }
}

/* PANTALLA 3 · ESTUDIANTES*/
function renderEstudiantes() {
  const tbody = document.getElementById("tbodyEstudiantes");
  const vacio = document.getElementById("emptyEstudiantes");
  const texto = document.getElementById("buscarEstudiante").value.trim().toLowerCase();
  const estadoFiltro = document.getElementById("filtroEstadoEstudiante").value;

  const lista = state.estudiantes.filter(e => {
    const coincideTexto = !texto || `${e.nombres} ${e.apellidos}`.toLowerCase().includes(texto) || e.dni.includes(texto);
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
  if (!/^\d{6,15}$/.test(dni)) { alert("El DNI debe contener solo números (6 a 15 dígitos)."); return; }

  if (id) {
    const est = state.estudiantes.find(e => e.id === Number(id));
    Object.assign(est, { nombres, apellidos, dni, grado, seccion });
    mostrarToast("Estudiante actualizado.");
  } else {
    state.estudiantes.push({ id: generarId(state.estudiantes), nombres, apellidos, dni, grado, seccion, estado: "activo" });
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

/* GESTIÓN ACADÉMICA (Cursos, Docentes, Asignación) */

/* Docentes */
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
    state.docentes.push({ id: generarId(state.docentes), nombres, especialidad, email, estado: "activo" });
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
    if (enUso) { alert("Este docente tiene cursos asignados. Reasigna esos cursos antes de eliminarlo."); return; }
    if (!confirm("¿Eliminar este docente?")) return;
    state.docentes = state.docentes.filter(d => d.id !== id);
    guardarEstado();
    renderDocentes();
    mostrarToast("Docente eliminado.");
  }
});

/* Cursos*/
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

  state.cursos.push({ id: generarId(state.cursos), nombre, idDocente, creditos });
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
  const enUso = state.notas.some(n => n.idCurso === id) || state.asistencias.some(a => a.idCurso === id);
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

/* Asignación de estudiantes a cursos */
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
    const matriculado = state.asignaciones.some(a => a.idCurso === idCurso && a.idEstudiante === e.id);
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
    state.asignaciones.push({ id: generarId(state.asignaciones), idCurso, idEstudiante });
    mostrarToast("Estudiante matriculado en el curso.");
  } else {
    state.asignaciones = state.asignaciones.filter(a => !(a.idCurso === idCurso && a.idEstudiante === idEstudiante));
    mostrarToast("Estudiante retirado del curso.");
  }
  guardarEstado();
  actualizarSelectsGlobales();
});

/* CALIFICACIONES */
function estudiantesDeCurso(idCurso) {
  if (!idCurso) return [];
  const ids = state.asignaciones.filter(a => a.idCurso === idCurso).map(a => a.idEstudiante);
  return state.estudiantes.filter(e => ids.includes(e.id) && e.estado === "activo");
}

function actualizarComboEstudiantesPorCurso(comboCursoId, comboEstId) {
  const idCurso = Number(document.getElementById(comboCursoId).value) || null;
  const comboEst = document.getElementById(comboEstId);
  const disponibles = estudiantesDeCurso(idCurso);

  comboEst.innerHTML = `<option value="" disabled selected>${idCurso ? "Elegir estudiante" : "Elige primero un curso"}</option>` +
    disponibles.map(e => `<option value="${e.id}">${e.nombres} ${e.apellidos}</option>`).join("");
  comboEst.disabled = !idCurso || disponibles.length === 0;
}

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

function claseParaNota(valor) {
  if (valor < 11) return "low";
  if (valor >= 17) return "high";
  return "";
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

  state.notas.push({ id: generarId(state.notas), idCurso, idEstudiante, bimestre, calificacion, fecha: hoyISO() });
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
  if (!idEstudiante || notasEst.length === 0) { box.style.display = "none"; return; }
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

/* ASISTENCIA*/
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

  state.asistencias.push({ id: generarId(state.asistencias), idCurso, idEstudiante, fecha, estado });
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

/* REPORTES*/
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
    const promedio = notasEst.length ? notasEst.reduce((acc, n) => acc + n.calificacion, 0) / notasEst.length : null;
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
    fecha: n.fecha, tipo: "Nota",
    idEstudiante: n.idEstudiante, idCurso: n.idCurso,
    detalle: `Bimestre ${n.bimestre} · ${n.calificacion.toFixed(1)}`
  }));
  const eventosAsistencia = state.asistencias.map(a => ({
    fecha: a.fecha, tipo: "Asistencia",
    idEstudiante: a.idEstudiante, idCurso: a.idCurso,
    detalle: a.estado
  }));

  const todos = [...eventosNotas, ...eventosAsistencia].sort((a, b) => b.fecha.localeCompare(a.fecha));

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

/* SELECTS GLOBALES*/
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

function llenarSelect(id, lista, getValue, getLabel, opcionTodos) {
  const el = document.getElementById(id);
  if (!el) return;
  const valorAnterior = el.value;
  const primeraOpcion = opcionTodos
    ? `<option value="">${opcionTodos}</option>`
    : `<option value="" disabled ${!valorAnterior ? "selected" : ""}>Elegir</option>`;
  el.innerHTML = primeraOpcion + lista.map(item => `<option value="${getValue(item)}">${getLabel(item)}</option>`).join("");
  if (lista.some(item => String(getValue(item)) === valorAnterior)) el.value = valorAnterior;
}

/* PANTALLA NOTAS (ALUMNO) */
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

/* DATOS DE DEMOSTRACIÓN*/
function sembrarDatosDemo() {
  if (state.estudiantes.length || state.docentes.length) return;

  state.docentes = [
    { id: 1, nombres: "Carlos Ruiz", especialidad: "Matemática", email: "carlos.ruiz@blenkirahora.edu", estado: "activo" },
    { id: 2, nombres: "Ana Torres", especialidad: "Comunicación", email: "ana.torres@blenkirahora.edu", estado: "activo" }
  ];
  state.cursos = [
    { id: 1, nombre: "Matemática", idDocente: 1, creditos: 4 },
    { id: 2, nombre: "Comunicación", idDocente: 2, creditos: 3 }
  ];
  state.estudiantes = [
    { id: 1, nombres: "Ana", apellidos: "Quispe Torres", dni: "71234567", grado: "5to Secundaria", seccion: "A", estado: "activo" },
    { id: 2, nombres: "Luis", apellidos: "Fernández Vera", dni: "70654321", grado: "5to Secundaria", seccion: "B", estado: "activo" }
  ];
  state.asignaciones = [
    { id: 1, idCurso: 1, idEstudiante: 1 },
    { id: 2, idCurso: 2, idEstudiante: 1 },
    { id: 3, idCurso: 1, idEstudiante: 2 }
  ];
  state.notas = [
    { id: 1, idCurso: 1, idEstudiante: 1, bimestre: 1, calificacion: 16, fecha: hoyISO() },
    { id: 2, idCurso: 2, idEstudiante: 1, bimestre: 1, calificacion: 13, fecha: hoyISO() },
    { id: 3, idCurso: 1, idEstudiante: 2, bimestre: 1, calificacion: 9, fecha: hoyISO() }
  ];
  state.asistencias = [
    { id: 1, idCurso: 1, idEstudiante: 1, fecha: hoyISO(), estado: "Presente" },
    { id: 2, idCurso: 1, idEstudiante: 2, fecha: hoyISO(), estado: "Tardanza" }
  ];
  guardarEstado();
}

/* INICIO */
function iniciarApp() {
  document.getElementById("pantallaLogin").classList.add("d-none");
  document.getElementById("appShell").classList.remove("d-none");
  document.getElementById("userNombre").textContent = sesion.nombre;
  document.getElementById("userRol").textContent = sesion.tipo;

  aplicarPermisosPorRol();

  // Mostrar únicamente el dashboard correspondiente al rol autenticado.
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

document.addEventListener("DOMContentLoaded", () => {
  cargarEstado();
  sembrarDatosDemo();
  inicializarNavegacion();

  const sesionGuardada = sessionStorage.getItem("blenkirahora_sesion");
  if (sesionGuardada) {
    sesion = JSON.parse(sesionGuardada);
    iniciarApp();
  }
});
