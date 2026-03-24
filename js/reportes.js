// ===== MÓDULO REPORTES DE INDISCIPLINA =====

const KEY_REP = 'reportes';
const TIPOS_FALTA = ['Falta leve','Falta grave','Falta muy grave','Agresión verbal','Agresión física','Daño a la propiedad','Uso de teléfono','Acoso escolar (bullying)','Inasistencia de clases','Otra'];
const MEDIDAS = ['Llamada de atención verbal','Amonestación escrita','Citatorio a padres','Suspensión temporal','Canalización','Acta compromiso','Reporte a dirección','Otra'];

function badgeFalta(tipo) {
  if (!tipo) return 'leve';
  const t = tipo.toLowerCase();
  if (t.includes('muy grave')) return 'muy-grave';
  if (t.includes('grave')) return 'grave';
  return 'leve';
}

function renderReportes(datos) {
  const tbody = document.getElementById('tbody-reportes');
  if (!datos) datos = obtenerDatos(KEY_REP);
  if (!datos.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No hay registros</td></tr>'; return; }
  tbody.innerHTML = datos.map((r) => `
    <tr>
      <td><span class="folio-tag">${r.folio||'-'}</span></td>
      <td><strong>${r.alumno}</strong>${r.noControl?'<br><small style="color:#94a3b8">'+r.noControl+'</small>':''}</td>
      <td>${r.grado} ${r.grupo}</td>
      <td><span class="badge badge-${badgeFalta(r.tipoFalta)}">${r.tipoFalta}</span></td>
      <td title="${r.descripcion}">${r.descripcion.length>35?r.descripcion.slice(0,35)+'…':r.descripcion}</td>
      <td title="${r.medida}">${r.medida.length>25?r.medida.slice(0,25)+'…':r.medida}</td>
      <td>${formatFecha(r.fecha)}</td>
      <td><div class="btn-actions">
        <button class="btn-icon print" title="PDF" onclick="imprimirReporte('${r.id}')"><i class="fas fa-file-pdf"></i></button>
        ${r.pdfUrl?`<a class="btn-icon drive" title="Ver PDF en nube" href="${r.pdfUrl}" target="_blank"><i class="fas fa-cloud-download-alt"></i></a>`:`<button class="btn-icon delete" style="background:#f97316" title="Subir PDF a nube" onclick="window._subirPDFManual('reportes','${r.id}')"><i class="fas fa-cloud-upload-alt"></i></button>`}
        <button class="btn-icon edit" title="Editar" onclick="editarReporte('${r.id}')"><i class="fas fa-edit"></i></button>
        ${esAdmin()?`<button class="btn-icon delete" title="Eliminar" onclick="eliminarReporte('${r.id}')"><i class="fas fa-trash"></i></button>`:''}
      </div></td>
    </tr>`).join('');
}

function formularioReporte(datos = {}) {
  return `
    <div class="form-grid">
      <div class="form-group form-full">
        <label>Buscar Alumno (nombre o No. Control)</label>
        <div class="ac-wrapper">
          <input type="text" id="r-alumno" class="form-control" value="${datos.alumno||''}" placeholder="Escribe para buscar en el padrón...">
        </div>
        <input type="hidden" id="r-nocontrol" value="${datos.noControl||''}">
      </div>
      <div class="form-group"><label>Semestre</label>
        <select id="r-grado" class="form-control">${['1°','2°','3°','4°','5°','6°'].map(g=>`<option ${datos.grado===g?'selected':''}>${g}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Grupo</label>
        <input type="text" id="r-grupo" class="form-control" value="${datos.grupo||''}" placeholder="2AMARH, 3B...">
      </div>
      <div class="form-group"><label>Especialidad</label>
        <input type="text" id="r-especialidad" class="form-control" value="${datos.especialidad||''}" placeholder="Administración, Informática...">
      </div>
      <div class="form-group"><label>Fecha del Incidente *</label>
        <input type="date" id="r-fecha" class="form-control" value="${datos.fecha||fechaHoy()}">
      </div>
      <div class="form-group"><label>Tipo de Falta *</label>
        <select id="r-tipoFalta" class="form-control">${TIPOS_FALTA.map(t=>`<option ${datos.tipoFalta===t?'selected':''}>${t}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Reportado por</label>
        <input type="text" id="r-reporta" class="form-control" value="${datos.reporta||''}" placeholder="Docente/orientador">
      </div>
      <div class="form-group"><label>Emite / Valida</label>
        <input type="text" id="r-validador" class="form-control" value="${datos.validador||(getUsuarioActual()?.nombre||'')}" readonly style="background:#f1f5f9;color:#475569;cursor:not-allowed">
      </div>
      <div class="form-group form-full"><label>Descripción del Incidente *</label>
        <textarea id="r-descripcion" class="form-control" placeholder="Detalle lo sucedido...">${datos.descripcion||''}</textarea>
      </div>
      <div class="form-group"><label>Medida Tomada</label>
        <select id="r-medida" class="form-control">${MEDIDAS.map(m=>`<option ${datos.medida===m?'selected':''}>${m}</option>`).join('')}</select>
      </div>
      <div class="form-group form-full"><label>Seguimiento / Observaciones</label>
        <textarea id="r-seguimiento" class="form-control">${datos.seguimiento||''}</textarea>
      </div>
    </div>`;
}

function nuevoReporte() {
  abrirModal('Nuevo Reporte de Indisciplina', formularioReporte(), function() {
    const alumno = document.getElementById('r-alumno').value.trim();
    const descripcion = document.getElementById('r-descripcion').value.trim();
    if (!alumno||!descripcion) { mostrarToast('Alumno y descripción son obligatorios', 'error'); return; }
    const datos = obtenerDatos(KEY_REP);
    const nuevo = {
      id: genId(), folio: generarFolio(KEY_REP),
      alumno, noControl: document.getElementById('r-nocontrol').value,
      grado: document.getElementById('r-grado').value,
      grupo: document.getElementById('r-grupo').value.trim().toUpperCase(),
      especialidad: document.getElementById('r-especialidad').value.trim(),
      fecha: document.getElementById('r-fecha').value,
      tipoFalta: document.getElementById('r-tipoFalta').value,
      reporta: document.getElementById('r-reporta').value.trim(),
      validador: document.getElementById('r-validador').value.trim(),
      descripcion, medida: document.getElementById('r-medida').value,
      seguimiento: document.getElementById('r-seguimiento').value.trim()
    };
    datos.unshift(nuevo);
    guardarDatos(KEY_REP, datos);
    if (window.sbSync) window.sbSync(KEY_REP, datos);
    autoRegistrarAlumno(nuevo);
    registrarActividad('reporte', `Reporte ${nuevo.folio} — ${alumno} (${nuevo.tipoFalta})`);
    cerrarModal(); renderReportes(); actualizarStats(); actualizarActividad();
    mostrarToast(`Reporte ${nuevo.folio} registrado`);
    autoSubirPDF(_wrapMediaHoja(_htmlDocRep(nuevo, obtenerConfig(), true, true)), { noControl: nuevo.noControl, nombre: nuevo.alumno, grado: nuevo.grado, grupo: nuevo.grupo, folio: nuevo.folio, tipo: 'reporte' }, KEY_REP, nuevo.id, true);
  });
  initAlumnoAutocomplete('r-alumno', function(a) {
    document.getElementById('r-alumno').value = a.nombre;
    document.getElementById('r-nocontrol').value = a.noControl||'';
    document.getElementById('r-grado').value = a.grado||'1°';
    document.getElementById('r-grupo').value = a.grupo||'';
    const espEl = document.getElementById('r-especialidad');
    if (espEl) espEl.value = a.especialidad || '';
  });
}

function editarReporte(id) {
  const datos = obtenerDatos(KEY_REP);
  const item = datos.find(x => x.id === id);
  if (!item) return;
  abrirModal('Editar Reporte', formularioReporte(item), function() {
    item.alumno = document.getElementById('r-alumno').value.trim();
    item.noControl = document.getElementById('r-nocontrol').value;
    item.grado = document.getElementById('r-grado').value;
    item.grupo = document.getElementById('r-grupo').value.trim().toUpperCase();
    item.especialidad = document.getElementById('r-especialidad').value.trim();
    item.fecha = document.getElementById('r-fecha').value;
    item.tipoFalta = document.getElementById('r-tipoFalta').value;
    item.reporta = document.getElementById('r-reporta').value.trim();
    item.validador = document.getElementById('r-validador').value.trim();
    item.descripcion = document.getElementById('r-descripcion').value.trim();
    item.medida = document.getElementById('r-medida').value;
    item.seguimiento = document.getElementById('r-seguimiento').value.trim();
    guardarDatos(KEY_REP, datos);
    if (window.sbSync) window.sbSync(KEY_REP, [item]);
    cerrarModal(); renderReportes(); mostrarToast('Reporte actualizado');
    autoSubirPDF(_wrapMediaHoja(_htmlDocRep(item, obtenerConfig(), true, true)), { noControl: item.noControl, nombre: item.alumno, grado: item.grado, grupo: item.grupo, folio: item.folio, tipo: 'reporte' }, KEY_REP, item.id, true);
  });
  initAlumnoAutocomplete('r-alumno', function(a) {
    document.getElementById('r-alumno').value = a.nombre;
    document.getElementById('r-nocontrol').value = a.noControl||'';
    document.getElementById('r-grado').value = a.grado||'1°';
    document.getElementById('r-grupo').value = a.grupo||'';
    const espEl = document.getElementById('r-especialidad');
    if (espEl) espEl.value = a.especialidad || '';
  });
}

function eliminarReporte(id) {
  if (!esAdmin()) { mostrarToast('Solo el administrador puede eliminar registros','error'); return; }
  if (!confirm('¿Eliminar este reporte?')) return;
  guardarDatos(KEY_REP, obtenerDatos(KEY_REP).filter(x => x.id !== id));
  if (window.sbDelete) window.sbDelete(KEY_REP, id);
  renderReportes(); actualizarStats(); mostrarToast('Reporte eliminado');
}

function _htmlDocRep(r, cfg, sinPie = false, sinEncabezado = false) {
  return `
    <div class="doc-preview" id="doc-to-pdf" style="${sinEncabezado?'padding-top:6px;padding-bottom:4px':''}">
      ${sinEncabezado ? '' : membreteHeader(cfg)}
      <div class="doc-tipo-titulo" style="${sinEncabezado?'margin-bottom:1px':''}">Reporte de Conducta / Indisciplina</div>
      <div class="doc-ciclo" style="${sinEncabezado?'margin-bottom:6px':''}">Ciclo Escolar ${cfg.ciclo}</div>
      <div class="doc-folio-row" style="${sinEncabezado?'margin-bottom:8px':''}">
        <span class="folio-label">FOLIO: <strong>${r.folio||r.id.toUpperCase()}</strong></span>
        <span class="folio-fecha">Fecha: ${formatFecha(r.fecha)}</span>
      </div>
      <div class="doc-body" style="${sinEncabezado?'font-size:12.5px;line-height:1.6':''}">
        <p>Se hace constar que el(la) alumno(a):</p>
        <p class="doc-highlight"><strong>${r.alumno}</strong> &nbsp;|&nbsp; <strong>${r.grado} Sem. — ${r.grupo}</strong>${r.especialidad?'&nbsp;|&nbsp; Esp: <strong>'+r.especialidad+'</strong>':''}${r.noControl?'&nbsp;|&nbsp; No. Control: <strong>'+r.noControl+'</strong>':''}</p>
        <p>Presentó la siguiente conducta el día <strong>${formatFecha(r.fecha)}</strong>:</p>
        <p><strong>Tipo de falta:</strong> ${r.tipoFalta}</p>
        <p><strong>Descripción:</strong> <em>${r.descripcion}</em></p>
        <p><strong>Medida tomada:</strong> ${r.medida}</p>
        ${r.seguimiento?`<p><strong>Seguimiento:</strong> ${r.seguimiento}</p>`:''}
      </div>
      <div class="doc-validation-seal" style="margin:8px 0 4px"><div class="seal-box">
        <div class="seal-title">EMITIÓ</div>
        <div class="seal-name">${r.validador||cfg.orientadores?.[0]||'Orientador(a)'}</div>
        <div class="seal-role">Orientación Educativa</div>
      </div></div>
      <div class="doc-signature" style="margin-top:10px">
        <div class="signature-box"><div class="sig-line"></div><p>${r.validador||cfg.orientadores?.[0]||'Orientador(a)'}</p><small>Quien emite</small></div>
        <div class="signature-box"><div class="sig-line"></div><p>Padre / Tutor</p><small>Firma de enterado</small></div>
      </div>
      ${sinPie ? '' : membreteFooter(cfg)}
    </div>`;
}

function imprimirReporte(id) {
  const r = obtenerDatos(KEY_REP).find(x => x.id === id);
  if (!r) return;
  const cfg = obtenerConfig();
  window._expedienteAlumno = { noControl: r.noControl, nombre: r.alumno, grado: r.grado, grupo: r.grupo, folio: r.folio, tipo: 'reporte' };
  window._pdfUploadCtx = { modulo: KEY_REP, id: r.id, folio: r.folio };
  abrirPrint(`Reporte ${r.folio||r.id}`, _wrapMediaHoja(_htmlDocRep(r, cfg, true, true)));
}

async function _driveReporte(id) {
  const datos = obtenerDatos(KEY_REP);
  const r = datos.find(x => x.id === id);
  if (!r) return;
  const cfg = obtenerConfig();
  const expediente = { noControl: r.noControl, nombre: r.alumno, grado: r.grado, grupo: r.grupo, folio: r.folio, tipo: 'reporte' };
  const ok = await guardarDocEnDrive(_htmlDocRep(r, cfg), expediente);
  if (ok) {
    r.driveSaved = true;
    guardarDatos(KEY_REP, datos);
    renderReportes();
  }
}

function initReportes() {
  document.getElementById('btn-nuevo-reporte').addEventListener('click', nuevoReporte);
  filtrarTabla('search-reportes', 'tbody-reportes');
  renderReportes();
}
