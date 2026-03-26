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
  tbody.innerHTML = datos.map((c) => {
    const extras = (c.otrosAlumnos || []).filter(x => x.alumno);
    const alumnosLabel = extras.length
      ? `${c.alumno} <small style="color:#64748b">+${extras.length} más</small>`
      : c.alumno;
    return `
    <tr>
      <td><span class="folio-tag">${c.folio||'-'}</span></td>
      <td><strong>${alumnosLabel}</strong>${c.noControl?'<br><small style="color:#94a3b8">'+c.noControl+'</small>':''}</td>
      <td>${c.grado||''} ${c.grupo||''}</td>
      <td><span class="badge badge-${c.tipo==='Académico'?'pendiente':'atendido'}" style="font-size:11px;white-space:nowrap">${c.tipo||'-'}</span></td>
      <td>${formatFecha(c.fecha)}</td>
      <td><span class="badge badge-${c.estado==='Vigente'?'pendiente':c.estado==='Cumplido'?'atendido':'cancelado'}">${c.estado||'Vigente'}</span></td>
      <td><div class="btn-actions">
        ${c.pdfUrl
          ? `<a class="btn-icon print" title="Ver PDF convenio" href="${c.pdfUrl}" target="_blank"><i class="fas fa-file-pdf"></i></a>
             <a class="btn-icon drive" title="PDF en nube" href="${c.pdfUrl}" target="_blank"><i class="fas fa-cloud-download-alt"></i></a>`
          : `<button class="btn-icon delete" style="background:#f97316" title="Sin PDF — sube el convenio escaneado" onclick="subirPDFConvenio('${c.id}')"><i class="fas fa-cloud-upload-alt"></i></button>`}
        <button class="btn-icon edit" title="Editar" onclick="editarConvenio('${c.id}')"><i class="fas fa-edit"></i></button>
        ${esAdmin()?`<button class="btn-icon delete" title="Eliminar" onclick="eliminarConvenio('${c.id}')"><i class="fas fa-trash"></i></button>`:''}
      </div></td>
    </tr>`;
  }).join('');
}

// ===== FORMULARIO =====
function _campoAlumno(n, datos = {}) {
  const val = n === 1 ? (datos.alumno||'') : (datos.otrosAlumnos?.[n-2]?.alumno || '');
  const nc  = n === 1 ? (datos.noControl||'') : (datos.otrosAlumnos?.[n-2]?.noControl || '');
  const req = n === 1 ? ' *' : ' <small style="color:#94a3b8">(opcional)</small>';
  return `
    <div class="form-group form-full" style="border-left:3px solid ${n===1?'#2563eb':'#cbd5e1'};padding-left:10px;margin-bottom:4px">
      <label>Alumno ${n}${req}</label>
      <div class="ac-wrapper">
        <input type="text" id="con-alumno-${n}" class="form-control" value="${val}"
          placeholder="${n===1?'Escribe para buscar (obligatorio)':'Escribe para buscar (opcional)'}">
      </div>
      <input type="hidden" id="con-nc-${n}" value="${nc}">
      ${n===1?`
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:6px">
        <select id="con-grado" class="form-control">${['1°','2°','3°','4°','5°','6°'].map(g=>`<option ${datos.grado===g?'selected':''}>${g}</option>`).join('')}</select>
        <input type="text" id="con-grupo" class="form-control" value="${datos.grupo||''}" placeholder="Grupo (ej: 2AMARH)">
        <input type="text" id="con-especialidad" class="form-control" value="${datos.especialidad||''}" placeholder="Especialidad">
      </div>`:''}
    </div>`;
}

function formularioConvenio(datos = {}) {
  return `
    <div class="form-grid">
      <div class="form-group form-full">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:4px">
          <div style="font-weight:600;color:#1e293b;margin-bottom:10px;font-size:13px"><i class="fas fa-users"></i> Alumnos que firman el convenio</div>
          ${[1,2,3,4,5].map(n => _campoAlumno(n, datos)).join('')}
        </div>
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
  // Alumno 1 — también llena grado/grupo/especialidad
  initAlumnoAutocomplete('con-alumno-1', function(a) {
    document.getElementById('con-alumno-1').value = a.nombre;
    document.getElementById('con-nc-1').value = a.noControl||'';
    document.getElementById('con-grado').value = a.grado||'1°';
    document.getElementById('con-grupo').value = a.grupo||'';
    const espEl = document.getElementById('con-especialidad');
    if (espEl) espEl.value = a.especialidad||'';
  });
  // Alumnos 2-5 — solo llenan nombre y noControl
  [2,3,4,5].forEach(n => {
    initAlumnoAutocomplete(`con-alumno-${n}`, function(a) {
      document.getElementById(`con-alumno-${n}`).value = a.nombre;
      document.getElementById(`con-nc-${n}`).value = a.noControl||'';
    });
  });
}

// ===== LEER ALUMNOS DEL FORM =====
function _leerAlumnosForm() {
  const alumno1 = document.getElementById('con-alumno-1').value.trim();
  const nc1     = document.getElementById('con-nc-1').value;
  const otrosAlumnos = [2,3,4,5].map(n => ({
    alumno:    document.getElementById(`con-alumno-${n}`).value.trim(),
    noControl: document.getElementById(`con-nc-${n}`).value
  })).filter(x => x.alumno);
  return { alumno: alumno1, noControl: nc1, otrosAlumnos };
}

// ===== SUBIR PDF A STORAGE =====
async function _subirPDFArchivoConvenio(file, nombreAlu, folio, fecha) {
  if (!window.sbUploadPDF || !file) return null;
  const cfg = obtenerConfig();
  const ciclo = cfg.ciclo || '2025-2026';
  const carpeta = `Expedientes ${limpiarRutaStorage(ciclo)}/${limpiarRutaStorage(nombreAlu)}`;
  const fileName = `CONVENIO_${limpiarRutaStorage(folio)}_${fecha}.pdf`;
  const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
  return await window.sbUploadPDF(blob, `${carpeta}/${fileName}`);
}

// ===== NUEVO =====
function nuevoConvenio() {
  abrirModal('Nuevo Convenio', formularioConvenio(), async function() {
    const { alumno, noControl, otrosAlumnos } = _leerAlumnosForm();
    if (!alumno) { mostrarToast('El alumno 1 es obligatorio', 'error'); return; }
    const btn = document.getElementById('modal-save');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      const nuevo = {
        id: genId(),
        folio: generarFolio(KEY_CON),
        alumno, noControl,
        grado:         document.getElementById('con-grado').value,
        grupo:         document.getElementById('con-grupo').value.trim().toUpperCase(),
        especialidad:  document.getElementById('con-especialidad').value.trim(),
        otrosAlumnos,
        tipo:          document.getElementById('con-tipo').value,
        fecha:         document.getElementById('con-fecha').value,
        estado:        document.getElementById('con-estado').value,
        observaciones: document.getElementById('con-observaciones').value.trim(),
        validador:     document.getElementById('con-validador').value,
        pdfUrl: null
      };
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
      // Auto-registrar todos los alumnos
      autoRegistrarAlumno({ alumno, noControl, grado: nuevo.grado, grupo: nuevo.grupo });
      otrosAlumnos.forEach(o => autoRegistrarAlumno({ alumno: o.alumno, noControl: o.noControl, grado: nuevo.grado, grupo: nuevo.grupo }));
      registrarActividad('convenio', `Convenio ${nuevo.folio} — ${alumno}${otrosAlumnos.length?' +'+otrosAlumnos.length+' más':''} — ${nuevo.tipo}`);
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
    const { alumno, noControl, otrosAlumnos } = _leerAlumnosForm();
    if (!alumno) { mostrarToast('El alumno 1 es obligatorio', 'error'); return; }
    const btn = document.getElementById('modal-save');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      item.alumno        = alumno;
      item.noControl     = noControl;
      item.otrosAlumnos  = otrosAlumnos;
      item.grado         = document.getElementById('con-grado').value;
      item.grupo         = document.getElementById('con-grupo').value.trim().toUpperCase();
      item.especialidad  = document.getElementById('con-especialidad').value.trim();
      item.tipo          = document.getElementById('con-tipo').value;
      item.fecha         = document.getElementById('con-fecha').value;
      item.estado        = document.getElementById('con-estado').value;
      item.observaciones = document.getElementById('con-observaciones').value.trim();
      item.validador     = document.getElementById('con-validador').value;
      const pdfFile = document.getElementById('con-pdf').files[0];
      if (pdfFile) {
        mostrarToast('Subiendo PDF...');
        const url = await _subirPDFArchivoConvenio(pdfFile, item.alumno, item.folio, item.fecha);
        if (url) item.pdfUrl = url;
        else mostrarToast('No se pudo subir el PDF', 'error');
      }
      guardarDatos(KEY_CON, datos);
      if (window.sbSync) window.sbSync(KEY_CON, [item]);
      otrosAlumnos.forEach(o => autoRegistrarAlumno({ alumno: o.alumno, noControl: o.noControl, grado: item.grado, grupo: item.grupo }));
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
