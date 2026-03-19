// ===== MÓDULO REPORTES DE INDISCIPLINA =====

const KEY_REP = 'reportes';
const TIPOS_FALTA = ['Falta leve','Falta grave','Falta muy grave','Agresión verbal','Agresión física','Daño a la propiedad','Uso de teléfono','Acoso escolar (bullying)','Otra'];
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
        <button class="btn-icon edit" title="Editar" onclick="editarReporte('${r.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" title="Eliminar" onclick="eliminarReporte('${r.id}')"><i class="fas fa-trash"></i></button>
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
      descripcion, medida: document.getElementById('r-medida').value,
      seguimiento: document.getElementById('r-seguimiento').value.trim()
    };
    datos.unshift(nuevo);
    guardarDatos(KEY_REP, datos);
    if (window.sbSync) window.sbSync(KEY_REP, datos);
    registrarActividad('reporte', `Reporte ${nuevo.folio} — ${alumno} (${nuevo.tipoFalta})`);
    cerrarModal(); renderReportes(); actualizarStats(); actualizarActividad();
    mostrarToast(`Reporte ${nuevo.folio} registrado`);
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
    item.descripcion = document.getElementById('r-descripcion').value.trim();
    item.medida = document.getElementById('r-medida').value;
    item.seguimiento = document.getElementById('r-seguimiento').value.trim();
    guardarDatos(KEY_REP, datos);
    if (window.sbSync) window.sbSync(KEY_REP, [item]);
    cerrarModal(); renderReportes(); mostrarToast('Reporte actualizado');
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
  if (!confirm('¿Eliminar este reporte?')) return;
  guardarDatos(KEY_REP, obtenerDatos(KEY_REP).filter(x => x.id !== id));
  if (window.sbDelete) window.sbDelete(KEY_REP, id);
  renderReportes(); actualizarStats(); mostrarToast('Reporte eliminado');
}

function imprimirReporte(id) {
  const r = obtenerDatos(KEY_REP).find(x => x.id === id);
  if (!r) return;
  const cfg = obtenerConfig();
  window._expedienteAlumno = { noControl: r.noControl, nombre: r.alumno, grado: r.grado, grupo: r.grupo, tipo: 'reporte' };
  const html = `
    <div class="doc-preview" id="doc-to-pdf">
      ${membreteHeader(cfg)}
      <div class="doc-tipo-titulo">Reporte de Conducta / Indisciplina</div>
      <div class="doc-ciclo">Ciclo Escolar ${cfg.ciclo}</div>
      <div class="doc-folio-row">
        <span class="folio-label">FOLIO: <strong>${r.folio||r.id.toUpperCase()}</strong></span>
        <span class="folio-fecha">Fecha: ${formatFecha(r.fecha)}</span>
      </div>
      <div class="doc-body">
        <p>Se hace constar que el(la) alumno(a):</p>
        <p class="doc-highlight"><strong>${r.alumno}</strong> &nbsp;|&nbsp; <strong>${r.grado} Sem. — ${r.grupo}</strong>${r.especialidad?'&nbsp;|&nbsp; Esp: <strong>'+r.especialidad+'</strong>':''}${r.noControl?'&nbsp;|&nbsp; No. Control: <strong>'+r.noControl+'</strong>':''}</p>
        <p>Presentó la siguiente conducta el día <strong>${formatFecha(r.fecha)}</strong>:</p>
        <p><strong>Tipo de falta:</strong> ${r.tipoFalta}</p>
        <p><strong>Descripción:</strong> <em>${r.descripcion}</em></p>
        <p><strong>Medida tomada:</strong> ${r.medida}</p>
        ${r.seguimiento?`<p><strong>Seguimiento:</strong> ${r.seguimiento}</p>`:''}
        <p>Reportado por: <strong>${r.reporta}</strong></p>
      </div>
      <div class="doc-signature">
        <div class="signature-box"><div class="sig-line"></div><p>${r.reporta||cfg.orientadores?.[0]||'Orientador(a)'}</p><small>Quien reporta</small></div>
        <div class="signature-box"><div class="sig-line"></div><p>${cfg.director||'Director(a)'}</p><small>Dirección</small></div>
        <div class="signature-box"><div class="sig-line"></div><p>Padre / Tutor</p><small>Firma de enterado</small></div>
      </div>
      ${membreteFooter(cfg)}
    </div>`;
  abrirPrint(`Reporte ${r.folio||r.id}`, html);
}

function initReportes() {
  document.getElementById('btn-nuevo-reporte').addEventListener('click', nuevoReporte);
  filtrarTabla('search-reportes', 'tbody-reportes');
  renderReportes();
}
