// ===== MÓDULO CITATORIOS =====

const KEY_CIT = 'citatorios';

function renderCitatorios(datos) {
  const tbody = document.getElementById('tbody-citatorios');
  if (!datos) datos = obtenerDatos(KEY_CIT);
  if (!datos.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No hay registros</td></tr>'; return; }
  tbody.innerHTML = datos.map((c) => `
    <tr>
      <td><span class="folio-tag">${c.folio||'-'}</span></td>
      <td><strong>${c.alumno}</strong>${c.noControl?'<br><small style="color:#94a3b8">'+c.noControl+'</small>':''}</td>
      <td>${c.grado} ${c.grupo}</td>
      <td>${c.tutor}${c.telefonoTutor?'<br><small style="color:#64748b">📞 '+c.telefonoTutor+'</small>':''}</td>
      <td>${formatFecha(c.fechaCita)} ${c.horaCita||''}</td>
      <td><span class="badge badge-${c.estado==='Pendiente'?'pendiente':'atendido'}">${c.estado}</span></td>
      <td><small>${c.validador||'-'}</small></td>
      <td><div class="btn-actions">
        <button class="btn-icon print" title="PDF" onclick="imprimirCitatorio('${c.id}')"><i class="fas fa-file-pdf"></i></button>
        <button class="btn-icon ${c.driveSaved?'drive':'drive-pend'}" title="${c.driveSaved?'Guardado en Drive':'Guardar en Drive'}" onclick="_driveCitatorio('${c.id}')"><i class="fab fa-google-drive"></i></button>
        <button class="btn-icon edit" title="Editar" onclick="editarCitatorio('${c.id}')"><i class="fas fa-edit"></i></button>
        ${esAdmin()?`<button class="btn-icon delete" title="Eliminar" onclick="eliminarCitatorio('${c.id}')"><i class="fas fa-trash"></i></button>`:''}
      </div></td>
    </tr>`).join('');
}

function formularioCitatorio(datos = {}) {
  return `
    <div class="form-grid">
      <div class="form-group form-full">
        <label>Buscar Alumno (nombre o No. Control)</label>
        <div class="ac-wrapper">
          <input type="text" id="c-alumno" class="form-control" value="${datos.alumno||''}" placeholder="Escribe para buscar en el padrón...">
        </div>
        <input type="hidden" id="c-nocontrol" value="${datos.noControl||''}">
      </div>
      <div class="form-group"><label>Semestre</label>
        <select id="c-grado" class="form-control">${['1°','2°','3°','4°','5°','6°'].map(g=>`<option ${datos.grado===g?'selected':''}>${g}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Grupo</label>
        <input type="text" id="c-grupo" class="form-control" value="${datos.grupo||''}" placeholder="2AMARH, 3B...">
      </div>
      <div class="form-group"><label>Especialidad</label>
        <input type="text" id="c-especialidad" class="form-control" value="${datos.especialidad||''}" placeholder="Administración, Informática...">
      </div>
      <div class="form-group"><label>Padre / Madre / Tutor *</label>
        <input type="text" id="c-tutor" class="form-control" value="${datos.tutor||''}" placeholder="Nombre del tutor">
      </div>
      <div class="form-group"><label>Teléfono del Padre/Tutor</label>
        <input type="tel" id="c-telefono" class="form-control" value="${datos.telefonoTutor||''}" placeholder="10 dígitos">
      </div>
      <div class="form-group"><label>Fecha de la Cita *</label>
        <input type="date" id="c-fechaCita" class="form-control" value="${datos.fechaCita||fechaHoy()}">
      </div>
      <div class="form-group"><label>Hora de la Cita</label>
        <input type="time" id="c-horaCita" class="form-control" value="${datos.horaCita||''}">
      </div>
      <div class="form-group"><label>Emitido por</label>
        <input type="text" id="c-emite" class="form-control" value="${datos.emite||''}" placeholder="Nombre de quien cita">
      </div>
      <div class="form-group"><label>Validó</label><input type="text" id="c-validador" class="form-control" value="${datos.validador || (getUsuarioActual()?.nombre || '')}" readonly style="background:#f1f5f9;color:#475569;cursor:not-allowed"></div>
      <div class="form-group"><label>Estado</label>
        <select id="c-estado" class="form-control">
          <option ${!datos.estado||datos.estado==='Pendiente'?'selected':''}>Pendiente</option>
          <option ${datos.estado==='Atendido'?'selected':''}>Atendido</option>
        </select>
      </div>
      <div class="form-group form-full"><label>Motivo del Citatorio *</label>
        <textarea id="c-motivo" class="form-control">${datos.motivo||''}</textarea>
      </div>
      <div class="form-group form-full"><label>Acuerdos / Seguimiento</label>
        <textarea id="c-acuerdos" class="form-control" placeholder="Llenar después de la cita">${datos.acuerdos||''}</textarea>
      </div>
    </div>`;
}

function _acCitatorio() {
  initAlumnoAutocomplete('c-alumno', function(a) {
    document.getElementById('c-alumno').value = a.nombre;
    document.getElementById('c-nocontrol').value = a.noControl||'';
    document.getElementById('c-grado').value = a.grado||'1°';
    document.getElementById('c-grupo').value = a.grupo||'';
    document.getElementById('c-tutor').value = a.tutor||'';
    document.getElementById('c-telefono').value = a.telefonoTutor||'';
    const espEl = document.getElementById('c-especialidad');
    if (espEl) espEl.value = a.especialidad || '';
  });
}

function nuevoCitatorio() {
  abrirModal('Nuevo Citatorio', formularioCitatorio(), function() {
    const alumno = document.getElementById('c-alumno').value.trim();
    const tutor  = document.getElementById('c-tutor').value.trim();
    const motivo = document.getElementById('c-motivo').value.trim();
    if (!alumno||!tutor||!motivo) { mostrarToast('Alumno, tutor y motivo son obligatorios', 'error'); return; }
    const datos = obtenerDatos(KEY_CIT);
    const nuevo = {
      id: genId(), folio: generarFolio(KEY_CIT),
      alumno, noControl: document.getElementById('c-nocontrol').value,
      grado: document.getElementById('c-grado').value,
      grupo: document.getElementById('c-grupo').value.trim().toUpperCase(),
      especialidad: document.getElementById('c-especialidad').value.trim(),
      tutor, telefonoTutor: document.getElementById('c-telefono').value.trim(),
      fechaCita: document.getElementById('c-fechaCita').value,
      horaCita: document.getElementById('c-horaCita').value,
      emite: document.getElementById('c-emite').value.trim(),
      validador: document.getElementById('c-validador').value,
      estado: document.getElementById('c-estado').value,
      motivo, acuerdos: document.getElementById('c-acuerdos').value.trim(),
      fechaCreacion: fechaHoy()
    };
    datos.unshift(nuevo);
    guardarDatos(KEY_CIT, datos);
    if (window.sbSync) window.sbSync(KEY_CIT, datos);
    registrarActividad('citatorio', `Citatorio ${nuevo.folio} — tutor de ${alumno}`);
    cerrarModal(); renderCitatorios(); actualizarStats(); actualizarActividad();
    mostrarToast(`Citatorio ${nuevo.folio} registrado`);
    _driveCitatorio(nuevo.id);
  });
  _acCitatorio();
}

function editarCitatorio(id) {
  const datos = obtenerDatos(KEY_CIT);
  const item = datos.find(x => x.id === id);
  if (!item) return;
  abrirModal('Editar Citatorio', formularioCitatorio(item), function() {
    item.alumno = document.getElementById('c-alumno').value.trim();
    item.noControl = document.getElementById('c-nocontrol').value;
    item.grado = document.getElementById('c-grado').value;
    item.grupo = document.getElementById('c-grupo').value.trim().toUpperCase();
    item.especialidad = document.getElementById('c-especialidad').value.trim();
    item.tutor = document.getElementById('c-tutor').value.trim();
    item.telefonoTutor = document.getElementById('c-telefono').value.trim();
    item.fechaCita = document.getElementById('c-fechaCita').value;
    item.horaCita = document.getElementById('c-horaCita').value;
    item.emite = document.getElementById('c-emite').value.trim();
    item.validador = document.getElementById('c-validador').value;
    item.estado = document.getElementById('c-estado').value;
    item.motivo = document.getElementById('c-motivo').value.trim();
    item.acuerdos = document.getElementById('c-acuerdos').value.trim();
    guardarDatos(KEY_CIT, datos);
    if (window.sbSync) window.sbSync(KEY_CIT, [item]);
    cerrarModal(); renderCitatorios(); mostrarToast('Citatorio actualizado');
    _driveCitatorio(item.id);
  });
  _acCitatorio();
}

function eliminarCitatorio(id) {
  if (!esAdmin()) { mostrarToast('Solo el administrador puede eliminar registros','error'); return; }
  if (!confirm('¿Eliminar este citatorio?')) return;
  guardarDatos(KEY_CIT, obtenerDatos(KEY_CIT).filter(x => x.id !== id));
  if (window.sbDelete) window.sbDelete(KEY_CIT, id);
  renderCitatorios(); actualizarStats(); mostrarToast('Citatorio eliminado');
}

function _htmlDocCit(c, cfg) {
  return `
    <div class="doc-preview" id="doc-to-pdf">
      ${membreteHeader(cfg)}
      <div class="doc-tipo-titulo">Citatorio</div>
      <div class="doc-ciclo">Ciclo Escolar ${cfg.ciclo}</div>
      <div class="doc-folio-row">
        <span class="folio-label">FOLIO: <strong>${c.folio||c.id.toUpperCase()}</strong></span>
        <span class="folio-fecha">Emitido: ${formatFecha(c.fechaCreacion)}</span>
      </div>
      <div class="doc-body">
        <p>Se cita al señor(a) <strong>${c.tutor}</strong>, padre/madre/tutor del(la) alumno(a):</p>
        <p class="doc-highlight"><strong>${c.alumno}</strong> &nbsp;|&nbsp; <strong>${c.grado} Sem. — ${c.grupo}</strong>${c.especialidad?'&nbsp;|&nbsp; Esp: <strong>'+c.especialidad+'</strong>':''}${c.noControl?'&nbsp;|&nbsp; No. Control: <strong>'+c.noControl+'</strong>':''}</p>
        ${c.telefonoTutor?`<p>Teléfono del padre/tutor: <strong>${c.telefonoTutor}</strong></p>`:''}
        <p>Para el día <strong>${formatFecha(c.fechaCita)}</strong>${c.horaCita?' a las <strong>'+c.horaCita+' hrs</strong>':''}, en el Departamento de Orientación Educativa.</p>
        <p>Motivo: <em>"${c.motivo}"</em></p>
        <p>Se solicita puntual asistencia.</p>
        ${c.acuerdos?`<hr style="margin:16px 0;border-color:#ccc"><p><strong>Acuerdos:</strong> ${c.acuerdos}</p>`:''}
      </div>
      <div class="doc-validation-seal"><div class="seal-box">
        <div class="seal-title">VALIDÓ</div>
        <div class="seal-name">${c.validador||'________________________'}</div>
        <div class="seal-role">Orientación Educativa</div>
      </div></div>
      <div class="doc-signature">
        <div class="signature-box"><div class="sig-line"></div><p>${c.emite||c.validador||cfg.orientadores?.[0]||'Orientador(a)'}</p><small>Orientación Educativa</small></div>
        <div class="signature-box"><div class="sig-line"></div><p>${c.tutor}</p><small>Firma de recibido</small></div>
      </div>
      ${membreteFooter(cfg)}
    </div>`;
}

function imprimirCitatorio(id) {
  const c = obtenerDatos(KEY_CIT).find(x => x.id === id);
  if (!c) return;
  const cfg = obtenerConfig();
  window._expedienteAlumno = { noControl: c.noControl, nombre: c.alumno, grado: c.grado, grupo: c.grupo, especialidad: c.especialidad, turno: (obtenerDatos('alumnos').find(a=>a.noControl===c.noControl)||{}).turno, folio: c.folio, tipo: 'citatorio' };
  abrirPrint(`Citatorio ${c.folio||c.id}`, _htmlDocCit(c, cfg));
}

async function _driveCitatorio(id) {
  const datos = obtenerDatos(KEY_CIT);
  const c = datos.find(x => x.id === id);
  if (!c) return;
  const cfg = obtenerConfig();
  const expediente = { noControl: c.noControl, nombre: c.alumno, grado: c.grado, grupo: c.grupo, especialidad: c.especialidad, turno: (obtenerDatos('alumnos').find(a=>a.noControl===c.noControl)||{}).turno, folio: c.folio, tipo: 'citatorio' };
  const ok = await guardarDocEnDrive(_htmlDocCit(c, cfg), expediente);
  if (ok) {
    c.driveSaved = true;
    guardarDatos(KEY_CIT, datos);
    renderCitatorios();
  }
}

function initCitatorios() {
  document.getElementById('btn-nuevo-citatorio').addEventListener('click', nuevoCitatorio);
  filtrarTabla('search-citatorios', 'tbody-citatorios');
  renderCitatorios();
}
