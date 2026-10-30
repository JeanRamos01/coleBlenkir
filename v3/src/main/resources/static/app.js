/* ============================================================
   Colegio Blenkir · Front conectado a Spring Boot + PostgreSQL
   Los datos ya NO viven en arreglos ni en localStorage:
   todo se lee y se guarda mediante la API REST (/api/...).
   La web consulta el servidor cada pocos segundos, así los cambios
   hechos desde la consola (Scanner) aparecen solos.
   ============================================================ */

const API = "/api";
const INTERVALO_SINCRONIZACION_MS = 3000;

/* Copia local de lo que hay en la base de datos (se rellena desde /api/estado) */
const state = {
  estudiantes: [],
  docentes: [],
  cursos: [],
  asignaciones: [],
  notas: [],
  asistencias: []
};

let sesion = null; // { usuario, tipo, nombre, idEstudiante }
let ultimoEstadoJSON = "";
let temporizadorSync = null;

function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/* Evita que texto guardado en la BD se interprete como HTML */
function esc(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* ---------- Comunicación con el servidor ---------- */
async function api(ruta, metodo = "GET", cuerpo) {
  const opciones = { method: metodo, headers: {} };
  if (cuerpo !== undefined) {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(API + ruta, opciones);
  } catch (e) {
    throw new Error("No se pudo conectar con el servidor.");
  }

  const texto = await respuesta.text();
  let datos = null;
  if (texto) { try { datos = JSON.parse(texto); } catch (e) { /* respuesta sin JSON */ } }

  if (!respuesta.ok) throw new Error((datos && datos.error) || `Error del servidor (${respuesta.status}).`);
  return datos;
}

/* Descarga el estado completo. Devuelve true si cambió algo respecto a la última vez. */
async function sincronizar(forzar = false) {
  const respuesta = await fetch(`${API}/estado`, { cache: "no-store" });
  if (!respuesta.ok) throw new Error(`Error del servidor (${respuesta.status}).`);
  const texto = await respuesta.text();
  if (!forzar && texto === ultimoEstadoJSON) return false;
  ultimoEstadoJSON = texto;
  Object.assign(state, JSON.parse(texto));
  return true;
}

/* Recarga desde la BD y vuelve a dibujar todo (se usa después de cada cambio) */
async function recargar() {
  await sincronizar(true);
  renderTodo();
}

/* Ejecuta una acción y muestra el error del servidor si falla */
async function intentar(accion) {
  try {
    await accion();
  } catch (e) {
    alert(e.message);
    try { await recargar(); } catch (_) { /* servidor caído */ }
  }
}

function iniciarSincronizacion() {
  detenerSincronizacion();
  temporizadorSync = setInterval(async () => {
    if (!sesion || document.hidden) return;
    try {
      if (await sincronizar()) {
        renderTodo();
        mostrarToast("Datos actualizados desde el servidor.");
      }
    } catch (e) { /* se reintenta en el siguiente ciclo */ }
  }, INTERVALO_SINCRONIZACION_MS);
}

function detenerSincronizacion() {
  if (temporizadorSync) clearInterval(temporizadorSync);
  temporizadorSync = null;
}

/*  Toast  */
let toastInstance;
function mostrarToast(mensaje) {
  const toastEl = document.getElementById("appToast");
  document.getElementById("appToastBody").textContent = mensaje;
  if (!toastInstance) toastInstance = new bootstrap.Toast(toastEl, { delay: 2200 });
  toastInstance.show();
}

/* LOGIN (valida contra la tabla usuarios de PostgreSQL) */
document.getElementById("formLogin").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const usuario = document.getElementById("loginUsuario").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorBox = document.getElementById("loginError");

  try {
    const u = await api("/login", "POST", { usuario, password });
    errorBox.classList.add("d-none");
    sesion = { usuario: u.usuario, tipo: u.tipo, nombre: u.nombre, idEstudiante: u.idEstudiante || null };
    sessionStorage.setItem("blenkirahora_sesion", JSON.stringify(sesion));
    await iniciarApp();
  } catch (e) {
    errorBox.textContent = e.message;
    errorBox.classList.remove("d-none");
  }
});

document.getElementById("btnLogout").addEventListener("click", async () => {
  try { await api("/login/logout", "POST"); } catch (_) {}
  sesion = null;
  detenerSincronizacion();
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
  document.getElementById("countEstudiantes").textContent = state.estudiantes.filter(e => e.estado === "activo").length;
  document.getElementById("countDocentes").textContent = state.docentes.length;
  document.getElementById("countCursos").textContent = state.cursos.length;
  document.getElementById("countNotas").textContent = state.notas.length;
  document.getElementById("countAsistencias").textContent = state.asistencias.length;
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
      <td><strong>${esc(e.nombres)} ${esc(e.apellidos)}</strong><br><span class="text-muted" style="font-size:0.76rem;">DNI ${esc(e.dni)}</span></td>
      <td>${esc(e.dni)}</td>
      <td>${esc(e.grado)}</td>
      <td><span class="grade-pill">${esc(e.seccion)}</span></td>
      <td><span class="status-pill ${esc(e.estado)}">${e.estado === "activo" ? "Activo" : "Inactivo"}</span></td>
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
  intentar(async () => {
    const id = document.getElementById("estId").value;
    const nombres = document.getElementById("estNombres").value.trim();
    const apellidos = document.getElementById("estApellidos").value.trim();
    const dni = document.getElementById("estDni").value.trim();
    const grado = document.getElementById("estGrado").value;
    const seccion = document.getElementById("estSeccion").value;

    if (!nombres || !apellidos || !dni || !grado || !seccion) return;
    if (!/^\d{6,15}$/.test(dni)) { alert("El DNI debe contener solo números (6 a 15 dígitos)."); return; }

    const datos = { nombres, apellidos, dni, grado, seccion };
    if (id) {
      await api(`/estudiantes/${id}`, "PUT", datos);
      mostrarToast("Estudiante actualizado.");
    } else {
      const respuesta = await api("/estudiantes", "POST", datos);
      mostrarToast("Estudiante guardado.");
      alert(`Cuenta creada automáticamente\n\nUsuario: ${respuesta.usuario}\nContraseña inicial: ${respuesta.passwordInicial}\n\nGuarda estos datos para el primer acceso.`);
    }

    limpiarFormEstudiante();
    await recargar();
  });
});

document.getElementById("btnCancelarEdicionEst").addEventListener("click", limpiarFormEstudiante);
document.getElementById("buscarEstudiante").addEventListener("input", renderEstudiantes);
document.getElementById("filtroEstadoEstudiante").addEventListener("change", renderEstudiantes);

document.getElementById("tbodyEstudiantes").addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-accion]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const est = state.estudiantes.find(e => e.id === id);
  if (!est) return;

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
    intentar(async () => {
      const actualizado = await api(`/estudiantes/${id}/estado`, "PATCH");
      await recargar();
      mostrarToast(`Estudiante ${actualizado.estado === "activo" ? "activado" : "desactivado"}.`);
    });
  }

  if (btn.dataset.accion === "eliminar-estudiante") {
    if (!confirm("Esto eliminará también sus notas, asistencias y matrículas. ¿Continuar?")) return;
    intentar(async () => {
      await api(`/estudiantes/${id}`, "DELETE");
      await recargar();
      mostrarToast("Estudiante eliminado.");
    });
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
      <td><strong>${esc(d.nombres)}</strong></td>
      <td>${esc(d.especialidad)}</td>
      <td>${esc(d.email)}</td>
      <td><span class="status-pill ${esc(d.estado)}">${d.estado === "activo" ? "Activo" : "Inactivo"}</span></td>
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
  intentar(async () => {
    const id = document.getElementById("docId").value;
    const nombres = document.getElementById("docNombres").value.trim();
    const especialidad = document.getElementById("docEspecialidad").value.trim();
    const email = document.getElementById("docEmail").value.trim();
    if (!nombres || !especialidad || !email) return;

    const datos = { nombres, especialidad, email };
    if (id) {
      await api(`/docentes/${id}`, "PUT", datos);
      mostrarToast("Docente actualizado.");
    } else {
      const respuesta = await api("/docentes", "POST", datos);
      mostrarToast("Docente guardado.");
      alert(`Cuenta creada automáticamente\n\nUsuario: ${respuesta.usuario}\nContraseña inicial: ${respuesta.passwordInicial}\n\nEl docente podrá cambiarla desde el administrador.`);
    }

    limpiarFormDocente();
    await recargar();
  });
});

document.getElementById("btnCancelarEdicionDoc").addEventListener("click", limpiarFormDocente);

document.getElementById("tbodyDocentes").addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-accion]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const doc = state.docentes.find(d => d.id === id);
  if (!doc) return;

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
    intentar(async () => {
      await api(`/docentes/${id}/estado`, "PATCH");
      await recargar();
    });
  }

  if (btn.dataset.accion === "eliminar-docente") {
    const enUso = state.cursos.some(c => c.idDocente === id);
    if (enUso) { alert("Este docente tiene cursos asignados. Reasigna esos cursos antes de eliminarlo."); return; }
    if (!confirm("¿Eliminar este docente?")) return;
    intentar(async () => {
      await api(`/docentes/${id}`, "DELETE");
      await recargar();
      mostrarToast("Docente eliminado.");
    });
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
      <td><strong>${esc(c.nombre)}</strong></td>
      <td>${doc ? esc(doc.nombres) : "Sin asignar"}</td>
      <td><span class="grade-pill">${c.creditos} cr.</span></td>
      <td class="text-end">
        <button class="btn-icon" title="Editar" data-accion="editar-curso" data-id="${c.id}">✎</button>
        <button class="btn-icon danger" title="Eliminar" data-accion="eliminar-curso" data-id="${c.id}">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  actualizarSelectsGlobales();
  renderDashboard();
}

function limpiarFormCurso() {
  document.getElementById("formCurso").reset();
  document.getElementById("curCreditos").value = 3;
  document.getElementById("btnGuardarCurso").textContent = "Guardar curso";
  document.getElementById("curId").value = "";
}

document.getElementById("formCurso").addEventListener("submit", (ev) => {
  ev.preventDefault();
  intentar(async () => {
    const id = document.getElementById("curId").value;
    const nombre = document.getElementById("curNombre").value.trim();
    const idDocente = Number(document.getElementById("curDocente").value);
    const creditos = Number(document.getElementById("curCreditos").value);
    if (!nombre || !idDocente || !creditos) return;
    if (id) { await api(`/cursos/${id}`, "PUT", { nombre, idDocente, creditos }); mostrarToast("Curso actualizado."); }
    else { await api("/cursos", "POST", { nombre, idDocente, creditos }); mostrarToast("Curso guardado."); }
    limpiarFormCurso(); await recargar();
  });
});

document.getElementById("tbodyCursos").addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-accion]"); if (!btn) return;
  const id = Number(btn.dataset.id); const curso = state.cursos.find(c => c.id === id); if (!curso) return;
  if (btn.dataset.accion === "editar-curso") {
    document.getElementById("curId").value = curso.id;
    document.getElementById("curNombre").value = curso.nombre;
    document.getElementById("curDocente").value = curso.idDocente;
    document.getElementById("curCreditos").value = curso.creditos;
    document.getElementById("btnGuardarCurso").textContent = "Guardar cambios";
    window.scrollTo({top:0,behavior:"smooth"}); return;
  }
  if (btn.dataset.accion === "eliminar-curso") {
    const enUso = state.notas.some(n => n.idCurso === id) || state.asistencias.some(a => a.idCurso === id);
    if (enUso && !confirm("Este curso tiene notas o asistencia registradas. ¿Eliminar de todos modos?")) return;
    intentar(async () => { await api(`/cursos/${id}`, "DELETE"); await recargar(); mostrarToast("Curso eliminado."); });
  }
});

/* GESTIÓN DE USUARIOS (solo administrador) */
let usuariosPanel = [];
async function renderUsuarios() {
  if (!sesion || sesion.tipo !== "Administrador") return;
  try { usuariosPanel = await api("/usuarios"); } catch (e) { return; }
  const q = (document.getElementById("buscarUsuario")?.value || "").toLowerCase().trim();
  const tbody = document.getElementById("tbodyUsuarios"); const vacio = document.getElementById("emptyUsuarios"); if (!tbody) return;
  const lista = usuariosPanel.filter(u => `${u.usuario} ${u.nombre} ${u.tipo}`.toLowerCase().includes(q));
  tbody.innerHTML = lista.map(u => {
    const vinculo = u.tipo === "Alumno" ? (state.estudiantes.find(e=>e.id===u.idEstudiante)?.nombres || `ID ${u.idEstudiante||"—"}`) : u.tipo === "Docente" ? (state.docentes.find(d=>d.id===u.idDocente)?.nombres || `ID ${u.idDocente||"—"}`) : "—";
    return `<tr><td><strong>${esc(u.usuario)}</strong></td><td>${esc(u.nombre)}</td><td><span class="badge-rol">${esc(u.tipo)}</span></td><td>${esc(vinculo)}</td><td class="text-end"><button class="btn-icon" title="Editar" data-accion="editar-usuario" data-id="${u.id}">✎</button><button class="btn-icon danger" title="Eliminar" data-accion="eliminar-usuario" data-id="${u.id}">✕</button></td></tr>`;
  }).join(""); vacio.classList.toggle("d-none", lista.length>0);
}
function actualizarVinculoUsuario() {
  const tipo=document.getElementById("usrTipo").value, wrap=document.getElementById("usrVinculoWrap"), sel=document.getElementById("usrVinculo");
  if(typeIsAdmin(tipo)){wrap.classList.add("d-none");sel.innerHTML="";return;}
  wrap.classList.remove("d-none");
  if(tipo==="Alumno") { sel.innerHTML='<option value="">Seleccionar estudiante</option>'+state.estudiantes.map(e=>`<option value="${e.id}">${esc(e.nombres+" "+e.apellidos)} — ${esc(e.dni)}</option>`).join(""); }
  else { sel.innerHTML='<option value="">Seleccionar docente</option>'+state.docentes.map(d=>`<option value="${d.id}">${esc(d.nombres)} — ${esc(d.email)}</option>`).join(""); }
}
function typeIsAdmin(t){return t==="Administrador";}
function limpiarFormUsuario(){document.getElementById("formUsuario").reset();document.getElementById("usrId").value="";document.getElementById("usrTipo").value="Administrador";document.getElementById("tituloFormUsuario").textContent="Nuevo usuario";document.getElementById("btnGuardarUsuario").textContent="Crear usuario";document.getElementById("btnCancelarEdicionUsr").classList.add("d-none");actualizarVinculoUsuario();}
document.getElementById("usrTipo")?.addEventListener("change",actualizarVinculoUsuario);
document.getElementById("buscarUsuario")?.addEventListener("input",renderUsuarios);
document.getElementById("btnCancelarEdicionUsr")?.addEventListener("click",limpiarFormUsuario);
document.getElementById("formUsuario")?.addEventListener("submit",ev=>{ev.preventDefault();intentar(async()=>{const id=document.getElementById("usrId").value,tipo=document.getElementById("usrTipo").value,v=Number(document.getElementById("usrVinculo").value)||null;const body={usuario:document.getElementById("usrUsuario").value.trim(),password:document.getElementById("usrPassword").value,tipo,nombre:document.getElementById("usrNombre").value.trim(),idEstudiante:tipo==="Alumno"?v:null,idDocente:tipo==="Docente"?v:null};if(!body.usuario||!body.nombre||(tipo!=="Administrador"&&!v))return;if(id)await api(`/usuarios/${id}`,"PUT",body);else if(!body.password)return alert("La contraseña es obligatoria para un usuario nuevo.");else await api("/usuarios","POST",body);limpiarFormUsuario();await renderUsuarios();mostrarToast(id?"Usuario actualizado.":"Usuario creado.");});});
document.getElementById("tbodyUsuarios")?.addEventListener("click",ev=>{const btn=ev.target.closest("button[data-accion]");if(!btn)return;const id=Number(btn.dataset.id),u=usuariosPanel.find(x=>x.id===id);if(!u)return;if(btn.dataset.accion==="editar-usuario"){document.getElementById("usrId").value=u.id;document.getElementById("usrUsuario").value=u.usuario;document.getElementById("usrPassword").value="";document.getElementById("usrTipo").value=u.tipo;document.getElementById("usrNombre").value=u.nombre;actualizarVinculoUsuario();document.getElementById("usrVinculo").value=String(u.idEstudiante||u.idDocente||"");document.getElementById("tituloFormUsuario").textContent="Modificar usuario";document.getElementById("btnGuardarUsuario").textContent="Guardar cambios";document.getElementById("btnCancelarEdicionUsr").classList.remove("d-none");return;}if(btn.dataset.accion==="eliminar-usuario"&&confirm("¿Eliminar esta cuenta de acceso? El registro del estudiante o docente no se eliminará."))intentar(async()=>{await api(`/usuarios/${id}`,"DELETE");await renderUsuarios();mostrarToast("Usuario eliminado.");});});

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
      <td><strong>${esc(e.nombres)} ${esc(e.apellidos)}</strong></td>
      <td>${esc(e.grado)} · ${esc(e.seccion)}</td>
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

  intentar(async () => {
    if (check.checked) {
      await api("/asignaciones", "POST", { idCurso, idEstudiante });
      mostrarToast("Estudiante matriculado en el curso.");
    } else {
      await api(`/asignaciones?idCurso=${idCurso}&idEstudiante=${idEstudiante}`, "DELETE");
      mostrarToast("Estudiante retirado del curso.");
    }
    await recargar();
  });
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
  const valorAnterior = comboEst.value;
  const disponibles = estudiantesDeCurso(idCurso);

  comboEst.innerHTML = `<option value="" disabled selected>${idCurso ? "Elegir estudiante" : "Elige primero un curso"}</option>` +
    disponibles.map(e => `<option value="${e.id}">${esc(e.nombres)} ${esc(e.apellidos)}</option>`).join("");
  comboEst.disabled = !idCurso || disponibles.length === 0;

  // Conserva la selección si el estudiante sigue disponible (importante al refrescar datos)
  if (disponibles.some(e => String(e.id) === valorAnterior)) comboEst.value = valorAnterior;
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
      <td>${est ? esc(est.nombres) + " " + esc(est.apellidos) : "—"}</td>
      <td>${cur ? esc(cur.nombre) : "—"}</td>
      <td>${n.bimestre}</td>
      <td><span class="score-pill ${claseParaNota(n.calificacion)}">${n.calificacion.toFixed(1)}</span></td>
      <td>${esc(n.fecha)}</td>
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
  intentar(async () => {
    const idCurso = Number(document.getElementById("notaCurso").value);
    const idEstudiante = Number(document.getElementById("notaEstudiante").value);
    const bimestre = Number(document.getElementById("notaBimestre").value);
    const calificacion = Number(document.getElementById("notaCalificacion").value);

    if (!idCurso || !idEstudiante || !bimestre || calificacion < 0 || calificacion > 20) {
      alert("Revisa los datos: la calificación debe estar entre 0 y 20.");
      return;
    }

    await api("/notas", "POST", { idCurso, idEstudiante, bimestre, calificacion });
    await recargar();
    actualizarPromedio(idEstudiante);
    document.getElementById("notaCalificacion").value = "";
    mostrarToast("Nota registrada.");
  });
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
  intentar(async () => {
    await api(`/notas/${btn.dataset.id}`, "DELETE");
    await recargar();
    mostrarToast("Nota eliminada.");
  });
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
      <td>${est ? esc(est.nombres) + " " + esc(est.apellidos) : "—"}</td>
      <td>${cur ? esc(cur.nombre) : "—"}</td>
      <td>${esc(a.fecha)}</td>
      <td><span class="status-pill ${esc(a.estado.toLowerCase())}">${esc(a.estado)}</span></td>
      <td class="text-end"><button class="btn-icon danger" title="Eliminar" data-accion="eliminar-asistencia" data-id="${a.id}">✕</button></td>
    `;
    tbody.appendChild(tr);
  });

  renderDashboard();
}

document.getElementById("formAsistencia").addEventListener("submit", (ev) => {
  ev.preventDefault();
  intentar(async () => {
    const idCurso = Number(document.getElementById("asisCurso").value);
    const idEstudiante = Number(document.getElementById("asisEstudiante").value);
    const fecha = document.getElementById("asisFecha").value;
    const estado = document.getElementById("asisEstado").value;
    if (!idCurso || !idEstudiante || !fecha || !estado) return;

    await api("/asistencias", "POST", { idCurso, idEstudiante, fecha, estado });
    await recargar();
    mostrarToast("Asistencia registrada.");
  });
});

document.getElementById("filtroEstudianteAsistencia").addEventListener("change", renderAsistencia);

document.getElementById("tbodyAsistencia").addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-accion='eliminar-asistencia']");
  if (!btn) return;
  intentar(async () => {
    await api(`/asistencias/${btn.dataset.id}`, "DELETE");
    await recargar();
    mostrarToast("Registro de asistencia eliminado.");
  });
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
      <td>${est ? esc(est.nombres) + " " + esc(est.apellidos) : "—"}</td>
      <td>${cur ? esc(cur.nombre) : "—"}</td>
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
      <td><strong>${esc(e.nombres)} ${esc(e.apellidos)}</strong></td>
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
      <td><strong>${esc(r.est.nombres)} ${esc(r.est.apellidos)}</strong></td>
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
      <td>${esc(ev.fecha)}</td>
      <td><span class="grade-pill">${ev.tipo}</span></td>
      <td>${est ? esc(est.nombres) + " " + esc(est.apellidos) : "—"}</td>
      <td>${cur ? esc(cur.nombre) : "—"}</td>
      <td>${esc(ev.detalle)}</td>
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
  el.innerHTML = primeraOpcion + lista.map(item => `<option value="${getValue(item)}">${esc(getLabel(item))}</option>`).join("");
  if (lista.some(item => String(getValue(item)) === valorAnterior)) el.value = valorAnterior;
}

/* PANTALLA NOTAS (ALUMNO) */
function renderMisNotas() {
  if (!sesion || sesion.tipo !== "Alumno") return;
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
      <td>${cur ? esc(cur.nombre) : "—"}</td>
      <td>${n.bimestre}</td>
      <td><span class="score-pill ${claseParaNota(n.calificacion)}">${n.calificacion.toFixed(1)}</span></td>
      <td>${esc(n.fecha)}</td>
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

/* INICIO */
function renderTodo() {
  renderEstudiantes();
  renderDocentes();
  renderCursos();
  renderAsignacion();
  renderNotas();
  renderAsistencia();
  renderReportes();
  renderDashboard();
  renderMisNotas();
  renderUsuarios();
}

async function iniciarApp() {
  await sincronizar(true); // trae los datos desde PostgreSQL

  document.getElementById("pantallaLogin").classList.add("d-none");
  document.getElementById("appShell").classList.remove("d-none");
  document.getElementById("userNombre").textContent = sesion.nombre;
  document.getElementById("userRol").textContent = sesion.tipo;

  const nombreCorto = (sesion.nombre || "usuario").trim().split(/\\s+/)[0];
  document.getElementById("welcomeTitle").textContent = `¡Bienvenido${sesion.tipo === "Alumno" ? "" : " de nuevo"}, ${nombreCorto}!`;
  document.getElementById("welcomeText").textContent =
    `Has iniciado sesión como ${sesion.tipo.toLowerCase()}. Desde aquí puedes consultar y gestionar la información académica de Blenkir.`;

  aplicarPermisosPorRol();
  document.getElementById("asisFecha").value = hoyISO();

  renderTodo();
  irAVista(sesion.tipo === "Alumno" ? "misnotas" : "dashboard");
  iniciarSincronizacion();
}

document.addEventListener("DOMContentLoaded", async () => {
  inicializarNavegacion();

  const sesionGuardada = sessionStorage.getItem("blenkirahora_sesion");
  if (sesionGuardada) {
    try {
      sesion = JSON.parse(sesionGuardada);
      await iniciarApp();
    } catch (e) {
      // El servidor no responde o la sesión es inválida: volver al login
      sesion = null;
      sessionStorage.removeItem("blenkirahora_sesion");
    }
  }
});
