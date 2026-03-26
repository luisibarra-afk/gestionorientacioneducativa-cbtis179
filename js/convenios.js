// ===== MÓDULO CONVENIOS =====

const KEY_CON = 'convenios';

const TIPOS_CONVENIO = [
  'Buena Conducta / Sanción Reparadora',
  'Académico'
];

// ===== RENDER TABLA =====
function renderConvenios(datos) {
  const tbody = document.getElementById('tbody-convenios');
  if (!tbody) return;
  if (!datos) datos = obtenerDatos(KEY_CON);
  if (!datos.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No hay convenios registrados</td></tr>'; return; }
  tbody.innerHTML = datos.map((c) => `
    <tr>
      <td><span class="folio-tag">${c.folio||'-'}</span></td>
      <td><strong>${c.alumno}</strong>${c.noControl?'<br><small style="color:#94a3b8">'+c.noControl+'</small>':''}</td>
      <td>${c.grado||''} ${c.grupo||''}</td>
      <td><span class="badge badge-${c.tipo==='Académico'?'pendiente':'atendido'}" style="font-size:11px;white-space:nowrap">${c.tipo||'-'}</span></td>
      <td>${formatFecha(c.fecha)}</td>
      <td><span class="badge badge-${c.estado==='Vigente'?'pendiente':c.estado==='Cumplido'?'atendido':'cancelado'}">${c.estado||'Vigente'}</span></td>
      <td><div class="btn-actions">
        ${c.pdfUrl
          ? `<a class="btn-icon drive" title="Ver PDF convenio" href="${c.pdfUrl}" target="_blank"><i class="fas fa-file-pdf"></i></a>
             <a class="btn-icon drive" title="PDF en nube" href="${c.pdfUrl}" target="_blank"><i class="fas fa-cloud-download-alt"></i></a>`
          : `<button class="btn-icon delete" style="background:#f97316" title="Sin PDF — sube el convenio escaneado" onclick="subirPDFConvenio('${c.id}')"><i class="fas fa-cloud-upload-alt"></i></button>`}
        <button class="btn-icon edit" title="Editar" onclick="editarConvenio('${c.id}')"><i class="fas fa-edit"></i></button>
        ${esAdmin()?`<button class="btn-icon delete" title="Eliminar" onclick="eliminarConvenio('${c.id}')"><i class="fas fa-trash"></i></button>`:''}
      </div></td>
    </tr>`).join('');
}

// ===== FORMULARIO =====
function formularioConvenio(datos = {}) {
  return `
    <div class="form-grid">
      <div class="form-group form-full">
        <label>Buscar Alumno (nombre o No. Control) *</label>
        <div class="ac-wrapper">
          <input type="text" id="con-alumno" class="form-control" value="${datos.alumno||''}" placeholder="Escribe para buscar en el padrón...">
        </div>
        <input type="hidden" id="con-nocontrol" value="${datos.noControl||''}">
      </div>
      <div class="form-group"><label>Semestre</label>
        <select id="con-grado" class="form-control">${['1°','2°','3°','4°','5°','6°'].map(g=>`<option ${datos.grado===g?'selected':''}>${g}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Grupo</label>
        <input type="text" id="con-grupo" class="form-control" value="${datos.grupo||''}" placeholder="2AMARH, 3B...">
      </div>
      <div class="form-group"><label>Especialidad</label>
        <input type="text" id="con-especialidad" class="form-control" value="${datos.especialidad||''}" placeholder="Administración, Informática...">
      </div>
      <div class="form-group"><label>Tipo de Convenio *</label>
        <select id="con-tipo" class="form-control">
          ${TIPOS_CONVENIO.map(t=>`<option ${datos.tipo===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Fecha *</label>
        <input type="date" id="con-fecha" class="form-control" value="${datos.fecha||fechaHoy()}">
      </div>
      <div class="form-group"><label>Estado</label>
        <select id="con-estado" class="form-control">
          ${['Vigente','Cumplido','Cancelado'].map(e=>`<option ${datos.estado===e?'selected':''}>${e}</option>`).join('')}
        </select>
      </div>
      <div class="form-group form-full"><label>Observaciones / Compromisos</label>
        <textarea id="con-observaciones" class="form-control" rows="4" placeholder="Describe los compromisos, acuerdos y condiciones del convenio...">${datos.observaciones||''}</textarea>
      </div>
      <div class="form-group form-full">
        <label>PDF del Convenio Escaneado <small style="color:#64748b">(PDF, máx. 10 MB)</small></label>
        <input type="file" id="con-pdf" class="form-control" accept=".pdf,application/pdf">
        ${datos.pdfUrl?`<div style="margin-top:6px"><a href="${datos.pdfUrl}" target="_blank" class="btn btn-outline" style="font-size:12px"><i class="fas fa-file-pdf"></i> Ver PDF actual</a></div>`:''}
      </div>
      <div class="form-group form-full"><label>Validó</label>
        <input type="text" id="con-validador" class="form-control" value="${datos.validador||(getUsuarioActual()?.nombre||'')}" readonly style="background:#f1f5f9;color:#475569;cursor:not-allowed">
      </div>
    </div>`;
}

function _acConvenio() {
  initAlumnoAutocomplete('con-alumno', function(a) {
    document.getElementById('con-alumno').value = a.nombre;
    document.getElementById('con-nocontrol').value = a.noControl||'';
    document.getElementById('con-grado').value = a.grado||'1°';
    document.getElementById('con-grupo').value = a.grupo||'';
    const espEl = document.getElementById('con-especialidad');
    if (espEl) espEl.value = a.especialidad||'';
  });
}

// ===== SUBIR PDF A STORAGE =====
async function _subirPDFArchivoConvenio(file, nombreAlu, folio, fecha) {
  if (!window.sbUploadPDF) return null;
  if (!file) return null;
  const cfg = obtenerConfig();
  const ciclo = cfg.ciclo || '2025-2026';
  const carpeta = `Expedientes ${limpiarRutaStorage(ciclo)}/${limpiarRutaStorage(nombreAlu)}`;
  const fileName = `CONVENIO_${folio}_${fecha}.pdf`;
  const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
  return await window.sbUploadPDF(blob, `${carpeta}/${fileName}`);
}

// ===== NUEVO =====
function nuevoConvenio() {
  abrirModal('Nuevo Convenio', formularioConvenio(), async function() {
    const alumno = document.getElementById('con-alumno').value.trim();
    if (!alumno) { mostrarToast('El nombre del alumno es obligatorio', 'error'); return; }
    const btn = document.getElementById('modal-save');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      const nuevo = {
        id: genId(),
        folio: generarFolio(KEY_CON),
        alumno,
        noControl: document.getElementById('con-nocontrol').value,
        grado: document.getElementById('con-grado').value,
        grupo: document.getElementById('con-grupo').value.trim().toUpperCase(),
        especialidad: document.getElementById('con-especialidad').value.trim(),
        tipo: document.getElementById('con-tipo').value,
        fecha: document.getElementById('con-fecha').value,
        estado: document.getElementById('con-estado').value,
        observaciones: document.getElementById('con-observaciones').value.trim(),
        validador: document.getElementById('con-validador').value,
        pdfUrl: null
      };
      // Subir PDF si se seleccionó
      const pdfFile = document.getElementById('con-pdf').files[0];
      if (pdfFile) {
        mostrarToast('Subiendo PDF...');
        const url = await _subirPDFArchivoConvenio(pdfFile, nuevo.alumno, nuevo.folio, nuevo.fecha);
        if (url) nuevo.pdfUrl = url;
        else mostrarToast('No se pudo subir el PDF, se guardará el registro sin él', 'error');
      }
      const datos = obtenerDatos(KEY_CON);
      datos.unshift(nuevo);
      guardarDatos(KEY_CON, datos);
      if (window.sbSync) window.sbSync(KEY_CON, datos);
      autoRegistrarAlumno(nuevo);
      registrarActividad('convenio', `Convenio ${nuevo.folio} — ${alumno} — ${nuevo.tipo}`);
      cerrarModal(); renderConvenios(); actualizarStats(); actualizarActividad();
      mostrarToast(`Convenio ${nuevo.folio} registrado${nuevo.pdfUrl?' y PDF subido':''}`);
    } finally {
      btn.disabled = false; btn.textContent = 'Guardar';
    }
  });
  _acConvenio();
}

// ===== EDITAR =====
function editarConvenio(id) {
  const datos = obtenerDatos(KEY_CON);
  const item = datos.find(x => x.id === id);
  if (!item) return;
  abrirModal('Editar Convenio', formularioConvenio(item), async function() {
    const alumno = document.getElementById('con-alumno').value.trim();
    if (!alumno) { mostrarToast('El nombre del alumno es obligatorio', 'error'); return; }
    const btn = document.getElementById('modal-save');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      item.alumno       = alumno;
      item.noControl    = document.getElementById('con-nocontrol').value;
      item.grado        = document.getElementById('con-grado').value;
      item.grupo        = document.getElementById('con-grupo').value.trim().toUpperCase();
      item.especialidad = document.getElementById('con-especialidad').value.trim();
      item.tipo         = document.getElementById('con-tipo').value;
      item.fecha        = document.getElementById('con-fecha').value;
      item.estado       = document.getElementById('con-estado').value;
      item.observaciones= document.getElementById('con-observaciones').value.trim();
      item.validador    = document.getElementById('con-validador').value;
      // Subir nuevo PDF si se seleccionó
      const pdfFile = document.getElementById('con-pdf').files[0];
      if (pdfFile) {
        mostrarToast('Subiendo PDF...');
        const url = await _subirPDFArchivoConvenio(pdfFile, item.alumno, item.folio, item.fecha);
        if (url) item.pdfUrl = url;
        else mostrarToast('No se pudo subir el PDF', 'error');
      }
      guardarDatos(KEY_CON, datos);
      if (window.sbSync) window.sbSync(KEY_CON, [item]);
      cerrarModal(); renderConvenios(); mostrarToast('Convenio actualizado');
    } finally {
      btn.disabled = false; btn.textContent = 'Guardar';
    }
  });
  _acConvenio();
}

// ===== SUBIR PDF MANUAL (botón naranja) =====
function subirPDFConvenio(id) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,application/pdf';
  input.onchange = async function() {
    const file = this.files[0];
    if (!file) return;
    const datos = obtenerDatos(KEY_CON);
    const rec = datos.find(x => x.id === id);
    if (!rec) return;
    mostrarToast('Subiendo PDF a la nube...');
    const url = await _subirPDFArchivoConvenio(file, rec.alumno, rec.folio, rec.fecha);
    if (url) {
      rec.pdfUrl = url;
      guardarDatos(KEY_CON, datos);
      if (window.sbSync) window.sbSync(KEY_CON, [rec]);
      renderConvenios();
      mostrarToast('PDF subido a la nube ☁️');
    } else {
      mostrarToast('No se pudo subir el PDF', 'error');
    }
  };
  input.click();
}

// ===== ELIMINAR =====
function eliminarConvenio(id) {
  if (!esAdmin()) { mostrarToast('Solo el administrador puede eliminar registros', 'error'); return; }
  if (!confirm('¿Eliminar este convenio?')) return;
  guardarDatos(KEY_CON, obtenerDatos(KEY_CON).filter(x => x.id !== id));
  if (window.sbDelete) window.sbDelete(KEY_CON, id);
  renderConvenios(); actualizarStats();
  mostrarToast('Convenio eliminado');
}

// ===== INIT =====
function initConvenios() {
  const btn = document.getElementById('btn-nuevo-convenio');
  if (btn) btn.addEventListener('click', nuevoConvenio);
  filtrarTabla('search-convenios', 'tbody-convenios');
  renderConvenios();
}
