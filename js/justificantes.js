// ===== MÓDULO JUSTIFICANTES =====

const KEY_JUST = 'justificantes';

function renderJustificantes(datos) {
  const tbody = document.getElementById('tbody-justificantes');
  if (!datos) datos = obtenerDatos(KEY_JUST);
  if (!datos.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No hay registros</td></tr>'; return; }
  tbody.innerHTML = datos.map((j) => `
    <tr>
      <td><span class="folio-tag">${j.folio || '-'}</span></td>
      <td><strong>${j.alumno}</strong>${j.noControl ? '<br><small style="color:#94a3b8">'+j.noControl+'</small>' : ''}</td>
      <td>${j.grado} ${j.grupo}</td>
      <td title="${j.fechaAusencia||''}">${(j.fechaAusencia||'-').length>18?(j.fechaAusencia).slice(0,18)+'…':j.fechaAusencia||'-'}</td>
      <td title="${j.motivo}">${j.motivo.length > 35 ? j.motivo.slice(0,35)+'…' : j.motivo}</td>
      <td><small>${j.validador || '-'}</small></td>
      <td><div class="btn-actions">
        <button class="btn-icon print" title="PDF" onclick="imprimirJustificante('${j.id}')"><i class="fas fa-file-pdf"></i></button>
        ${j.pdfUrl?`<a class="btn-icon drive" title="Ver PDF en nube" href="${j.pdfUrl}" target="_blank"><i class="fas fa-cloud-download-alt"></i></a>`:`<button class="btn-icon drive-pend" title="Pendiente de subir a nube" disabled><i class="fas fa-cloud-upload-alt"></i></button>`}
        <button class="btn-icon edit" title="Editar" onclick="editarJustificante('${j.id}')"><i class="fas fa-edit"></i></button>
        ${esAdmin()?`<button class="btn-icon delete" title="Eliminar" onclick="eliminarJustificante('${j.id}')"><i class="fas fa-trash"></i></button>`:''}
      </div></td>
    </tr>`).join('');
}

function formularioJustificante(datos = {}) {
  return `
    <div class="form-grid">
      <div class="form-group form-full">
        <label>Buscar Alumno (nombre o No. Control)</label>
        <div class="ac-wrapper">
          <input type="text" id="j-alumno" class="form-control" value="${datos.alumno || ''}" placeholder="Escribe para buscar en el padrón...">
        </div>
        <input type="hidden" id="j-nocontrol" value="${datos.noControl || ''}">
      </div>
      <div class="form-group">
        <label>Semestre</label>
        <select id="j-grado" class="form-control">${['1°','2°','3°','4°','5°','6°'].map(g=>`<option ${datos.grado===g?'selected':''}>${g}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label>Grupo</label>
        <input type="text" id="j-grupo" class="form-control" value="${datos.grupo||''}" placeholder="2AMARH, 3B...">
      </div>
      <div class="form-group">
        <label>Especialidad</label>
        <input type="text" id="j-especialidad" class="form-control" value="${datos.especialidad||''}" placeholder="Administración, Informática...">
      </div>
      <div class="form-group form-full">
        <label>Fecha(s) de Ausencia * <small style="color:#64748b;font-weight:400">(separa con coma si son varios días: 10/03/2026, 11/03/2026)</small></label>
        <input type="text" id="j-fechaAusencia" class="form-control" value="${datos.fechaAusencia||''}" placeholder="Ej: 10/03/2026  o  10/03/2026, 11/03/2026">
      </div>
      <div class="form-group">
        <label>Fecha de Expedición</label>
        <input type="text" id="j-fechaExpedicion" class="form-control" value="${formatFecha(fechaHoy())}" readonly style="background:#f1f5f9;color:#475569;cursor:not-allowed">
      </div>
      <div class="form-group">
        <label>Padre / Tutor</label>
        <input type="text" id="j-tutor" class="form-control" value="${datos.tutor||''}" placeholder="Nombre del padre o tutor">
      </div>
      <div class="form-group">
        <label>Teléfono del Padre/Tutor</label>
        <input type="tel" id="j-telefono" class="form-control" value="${datos.telefonoTutor||''}" placeholder="10 dígitos">
      </div>
      <div class="form-group">
        <label>Validó</label>
        <input type="text" id="j-validador" class="form-control" value="${datos.validador || (getUsuarioActual()?.nombre || '')}" readonly style="background:#f1f5f9;color:#475569;cursor:not-allowed">
      </div>
      <div class="form-group">
        <label>Motivo de la Ausencia *</label>
        <select id="j-motivo" class="form-control">
          ${['Atención Médica / Reposo','Atención Médica / Cita','Personal / Familiar','Personal / Trámites'].map(m=>`<option ${datos.motivo===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-group form-full">
        <label>Observaciones</label>
        <textarea id="j-observaciones" class="form-control">${datos.observaciones||''}</textarea>
      </div>
    </div>`;
}

function nuevoJustificante() {
  abrirModal('Nuevo Justificante', formularioJustificante(), function() {
    const alumno = document.getElementById('j-alumno').value.trim();
    const motivo = document.getElementById('j-motivo').value.trim();
    if (!alumno || !motivo) { mostrarToast('Nombre y motivo son obligatorios', 'error'); return; }
    const datos = obtenerDatos(KEY_JUST);
    const nuevo = {
      id: genId(), folio: generarFolio(KEY_JUST),
      alumno, noControl: document.getElementById('j-nocontrol').value,
      grado: document.getElementById('j-grado').value,
      grupo: document.getElementById('j-grupo').value.trim().toUpperCase(),
      especialidad: document.getElementById('j-especialidad').value.trim(),
      fechaAusencia: document.getElementById('j-fechaAusencia').value,
      fechaExpedicion: fechaHoy(),
      tutor: document.getElementById('j-tutor').value.trim(),
      telefonoTutor: document.getElementById('j-telefono').value.trim(),
      validador: document.getElementById('j-validador').value,
      motivo, observaciones: document.getElementById('j-observaciones').value.trim()
    };
    datos.unshift(nuevo);
    guardarDatos(KEY_JUST, datos);
    if (window.sbSync) window.sbSync(KEY_JUST, datos);
    registrarActividad('justificante', `Justificante ${nuevo.folio} — ${alumno}`);
    cerrarModal(); renderJustificantes(); actualizarStats(); actualizarActividad();
    mostrarToast(`Justificante ${nuevo.folio} registrado`);
    const cfg2 = obtenerConfig();
    autoSubirPDF(_wrapMediaHoja(_htmlDocJust(nuevo, cfg2, true, true)), { noControl: nuevo.noControl, nombre: nuevo.alumno, grado: nuevo.grado, grupo: nuevo.grupo, especialidad: nuevo.especialidad, folio: nuevo.folio, tipo: 'justificante' }, KEY_JUST, nuevo.id, true);
  });
  initAlumnoAutocomplete('j-alumno', function(a) {
    document.getElementById('j-alumno').value = a.nombre;
    document.getElementById('j-nocontrol').value = a.noControl || '';
    document.getElementById('j-grado').value = a.grado || '1°';
    document.getElementById('j-grupo').value = a.grupo || '';
    document.getElementById('j-tutor').value = a.tutor || '';
    document.getElementById('j-telefono').value = a.telefonoTutor || '';
    const espEl = document.getElementById('j-especialidad');
    if (espEl) espEl.value = a.especialidad || '';
  });
}

function editarJustificante(id) {
  const datos = obtenerDatos(KEY_JUST);
  const item = datos.find(x => x.id === id);
  if (!item) return;
  abrirModal('Editar Justificante', formularioJustificante(item), function() {
    item.alumno = document.getElementById('j-alumno').value.trim();
    item.noControl = document.getElementById('j-nocontrol').value;
    item.grado = document.getElementById('j-grado').value;
    item.grupo = document.getElementById('j-grupo').value.trim().toUpperCase();
    item.especialidad = document.getElementById('j-especialidad').value.trim();
    item.fechaAusencia = document.getElementById('j-fechaAusencia').value;
    item.tutor = document.getElementById('j-tutor').value.trim();
    item.telefonoTutor = document.getElementById('j-telefono').value.trim();
    item.validador = document.getElementById('j-validador').value;
    item.motivo = document.getElementById('j-motivo').value.trim();
    item.observaciones = document.getElementById('j-observaciones').value.trim();
    guardarDatos(KEY_JUST, datos);
    if (window.sbSync) window.sbSync(KEY_JUST, [item]);
    cerrarModal(); renderJustificantes(); mostrarToast('Justificante actualizado');
    const cfg3 = obtenerConfig();
    autoSubirPDF(_wrapMediaHoja(_htmlDocJust(item, cfg3, true, true)), { noControl: item.noControl, nombre: item.alumno, grado: item.grado, grupo: item.grupo, especialidad: item.especialidad, folio: item.folio, tipo: 'justificante' }, KEY_JUST, item.id, true);
  });
  initAlumnoAutocomplete('j-alumno', function(a) {
    document.getElementById('j-alumno').value = a.nombre;
    document.getElementById('j-nocontrol').value = a.noControl || '';
    document.getElementById('j-grado').value = a.grado || '1°';
    document.getElementById('j-grupo').value = a.grupo || '';
    document.getElementById('j-tutor').value = a.tutor || '';
    document.getElementById('j-telefono').value = a.telefonoTutor || '';
    const espEl = document.getElementById('j-especialidad');
    if (espEl) espEl.value = a.especialidad || '';
  });
}

function eliminarJustificante(id) {
  if (!esAdmin()) { mostrarToast('Solo el administrador puede eliminar registros','error'); return; }
  if (!confirm('¿Eliminar este justificante?')) return;
  guardarDatos(KEY_JUST, obtenerDatos(KEY_JUST).filter(x => x.id !== id));
  if (window.sbDelete) window.sbDelete(KEY_JUST, id);
  renderJustificantes(); actualizarStats(); mostrarToast('Justificante eliminado');
}

function _htmlDocJust(j, cfg, sinPie = false, sinEncabezado = false) {
  return `
    <div class="doc-preview" id="doc-to-pdf" style="${sinEncabezado?'padding-top:6px;padding-bottom:4px':''}">
      ${sinEncabezado ? '' : membreteHeader(cfg)}
      <div class="doc-tipo-titulo" style="${sinEncabezado?'margin-bottom:1px':''}">Justificante de Inasistencia</div>
      <div class="doc-ciclo" style="${sinEncabezado?'margin-bottom:6px':''}">Ciclo Escolar ${cfg.ciclo}</div>
      <div class="doc-folio-row" style="${sinEncabezado?'margin-bottom:8px':''}">
        <span class="folio-label">FOLIO: <strong>${j.folio||j.id.toUpperCase()}</strong></span>
        <span class="folio-fecha">Expedición: ${formatFecha(j.fechaExpedicion)}</span>
      </div>
      <div class="doc-body" style="${sinEncabezado?'font-size:12.5px;line-height:1.6':''}">
        <p>El que suscribe, personal de Orientación Educativa, hace constar que el(la) alumno(a):</p>
        <p class="doc-highlight"><strong>${j.alumno}</strong> &nbsp;|&nbsp; <strong>${j.grado} Sem. — ${j.grupo}</strong>${j.especialidad?'&nbsp;|&nbsp; Esp: <strong>'+j.especialidad+'</strong>':''}${j.noControl?'&nbsp;|&nbsp; No. Control: <strong>'+j.noControl+'</strong>':''}</p>
        <p>No asistió a clases el día(s) <strong>${j.fechaAusencia}</strong>, por el siguiente motivo:</p>
        <p class="doc-motivo">"${j.motivo}"</p>
        ${j.tutor?`<p>Entregado por: <strong>${j.tutor}</strong>${j.telefonoTutor?' &nbsp; Tel: <strong>'+j.telefonoTutor+'</strong>':''}</p>`:''}
        ${j.observaciones?`<p><em>Obs: ${j.observaciones}</em></p>`:''}
        <p>Se expide para los fines que al interesado convengan.</p>
      </div>
      <div class="doc-validation-seal" style="margin:8px 0 4px"><div class="seal-box">
        <div class="seal-title">VALIDÓ</div>
        <div class="seal-name">${j.validador||'________________________'}</div>
        <div class="seal-role">Orientación Educativa</div>
      </div></div>
      <div class="doc-signature" style="margin-top:10px">
        <div class="signature-box"><div class="sig-line"></div><p>${j.validador||cfg.orientadores?.[0]||'Orientador(a)'}</p><small>Orientación Educativa</small></div>
        <div class="signature-box"><div class="sig-line"></div><p>${j.tutor||'Padre / Tutor'}</p><small>Firma de conformidad</small></div>
      </div>
      ${sinPie ? '' : membreteFooter(cfg)}
    </div>`;
}

function imprimirJustificante(id) {
  const j = obtenerDatos(KEY_JUST).find(x => x.id === id);
  if (!j) return;
  const cfg = obtenerConfig();
  window._expedienteAlumno = { noControl: j.noControl, nombre: j.alumno, grado: j.grado, grupo: j.grupo, especialidad: j.especialidad, turno: (obtenerDatos('alumnos').find(a=>a.noControl===j.noControl)||{}).turno, folio: j.folio, tipo: 'justificante' };
  window._pdfUploadCtx = { modulo: KEY_JUST, id: j.id, folio: j.folio };
  abrirPrint(`Justificante ${j.folio||j.id}`, _wrapMediaHoja(_htmlDocJust(j, cfg, true, true)));
}

async function _driveJustificante(id) {
  const datos = obtenerDatos(KEY_JUST);
  const j = datos.find(x => x.id === id);
  if (!j) return;
  const cfg = obtenerConfig();
  const expediente = { noControl: j.noControl, nombre: j.alumno, grado: j.grado, grupo: j.grupo, especialidad: j.especialidad, turno: (obtenerDatos('alumnos').find(a=>a.noControl===j.noControl)||{}).turno, folio: j.folio, tipo: 'justificante' };
  const ok = await guardarDocEnDrive(_htmlDocJust(j, cfg), expediente);
  if (ok) {
    j.driveSaved = true;
    guardarDatos(KEY_JUST, datos);
    renderJustificantes();
  }
}

function initJustificantes() {
  document.getElementById('btn-nuevo-justificante').addEventListener('click', nuevoJustificante);
  filtrarTabla('search-justificantes', 'tbody-justificantes');
  renderJustificantes();
}
