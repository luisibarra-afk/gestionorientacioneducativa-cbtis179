// ===== MÓDULO PERMISOS DE SALIDA =====

const KEY_PERM = 'permisos';

function renderPermisos(datos) {
  const tbody = document.getElementById('tbody-permisos');
  if (!datos) datos = obtenerDatos(KEY_PERM);
  if (!datos.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No hay registros</td></tr>'; return; }
  tbody.innerHTML = datos.map((p) => `
    <tr>
      <td><span class="folio-tag">${p.folio||'-'}</span></td>
      <td><strong>${p.alumno}</strong>${p.noControl?'<br><small style="color:#94a3b8">'+p.noControl+'</small>':''}</td>
      <td>${p.grado} ${p.grupo}</td>
      <td>${formatFecha(p.fecha)} ${p.hora||''}</td>
      <td title="${p.motivo}">${p.motivo.length>30?p.motivo.slice(0,30)+'…':p.motivo}</td>
      <td><small>${p.validador||'-'}</small></td>
      <td><div class="btn-actions">
        <button class="btn-icon print" title="PDF" onclick="imprimirPermiso('${p.id}')"><i class="fas fa-file-pdf"></i></button>
        <button class="btn-icon edit" title="Editar" onclick="editarPermiso('${p.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" title="Eliminar" onclick="eliminarPermiso('${p.id}')"><i class="fas fa-trash"></i></button>
      </div></td>
    </tr>`).join('');
}

function formularioPermiso(datos = {}) {
  return `
    <div class="form-grid">
      <div class="form-group form-full">
        <label>Buscar Alumno (nombre o No. Control)</label>
        <div class="ac-wrapper">
          <input type="text" id="p-alumno" class="form-control" value="${datos.alumno||''}" placeholder="Escribe para buscar en el padrón...">
        </div>
        <input type="hidden" id="p-nocontrol" value="${datos.noControl||''}">
      </div>
      <div class="form-group"><label>Semestre</label>
        <select id="p-grado" class="form-control">${['1°','2°','3°','4°','5°','6°'].map(g=>`<option ${datos.grado===g?'selected':''}>${g}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Grupo</label>
        <input type="text" id="p-grupo" class="form-control" value="${datos.grupo||''}" placeholder="2AMARH, 3B...">
      </div>
      <div class="form-group"><label>Especialidad</label>
        <input type="text" id="p-especialidad" class="form-control" value="${datos.especialidad||''}" placeholder="Administración, Informática...">
      </div>
      <div class="form-group"><label>Fecha de Salida *</label>
        <input type="date" id="p-fecha" class="form-control" value="${datos.fecha||fechaHoy()}">
      </div>
      <div class="form-group"><label>Hora de Salida</label>
        <input type="time" id="p-hora" class="form-control" value="${datos.hora||''}">
      </div>
      <div class="form-group"><label>Hora de Regreso (si aplica)</label>
        <input type="time" id="p-horaRegreso" class="form-control" value="${datos.horaRegreso||''}">
      </div>
      <div class="form-group"><label>Persona que Recoge</label>
        <input type="text" id="p-persona" class="form-control" value="${datos.persona||''}" placeholder="Nombre del familiar/tutor">
      </div>
      <div class="form-group"><label>Parentesco</label>
        <select id="p-parentesco" class="form-control">${['Padre','Madre','Tutor/a','Hermano/a','Abuelo/a','Otro'].map(x=>`<option ${datos.parentesco===x?'selected':''}>${x}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Teléfono del Padre/Tutor</label>
        <input type="tel" id="p-telefono" class="form-control" value="${datos.telefono||''}" placeholder="10 dígitos">
      </div>
      <div class="form-group"><label>Autorizado por *</label>
        <input type="text" id="p-autoriza" class="form-control" value="${datos.autoriza||''}" placeholder="Nombre de quien autoriza">
      </div>
      <div class="form-group"><label>Validó</label><input type="text" id="p-validador" class="form-control" value="${datos.validador || (getUsuarioActual()?.nombre || '')}" readonly style="background:#f1f5f9;color:#475569;cursor:not-allowed"></div>
      <div class="form-group form-full"><label>Motivo de la Salida *</label>
        <textarea id="p-motivo" class="form-control">${datos.motivo||''}</textarea>
      </div>
    </div>`;
}

function _acPermiso() {
  initAlumnoAutocomplete('p-alumno', function(a) {
    document.getElementById('p-alumno').value = a.nombre;
    document.getElementById('p-nocontrol').value = a.noControl||'';
    document.getElementById('p-grado').value = a.grado||'1°';
    document.getElementById('p-grupo').value = a.grupo||'';
    document.getElementById('p-persona').value = a.tutor||'';
    document.getElementById('p-telefono').value = a.telefonoTutor||'';
    const espEl = document.getElementById('p-especialidad');
    if (espEl) espEl.value = a.especialidad || '';
  });
}

function nuevoPermiso() {
  abrirModal('Nuevo Permiso de Salida', formularioPermiso(), function() {
    const alumno = document.getElementById('p-alumno').value.trim();
    const motivo = document.getElementById('p-motivo').value.trim();
    if (!alumno||!motivo) { mostrarToast('Alumno y motivo son obligatorios', 'error'); return; }
    const datos = obtenerDatos(KEY_PERM);
    const nuevo = {
      id: genId(), folio: generarFolio(KEY_PERM),
      alumno, noControl: document.getElementById('p-nocontrol').value,
      grado: document.getElementById('p-grado').value,
      grupo: document.getElementById('p-grupo').value.trim().toUpperCase(),
      especialidad: document.getElementById('p-especialidad').value.trim(),
      fecha: document.getElementById('p-fecha').value,
      hora: document.getElementById('p-hora').value,
      horaRegreso: document.getElementById('p-horaRegreso').value,
      persona: document.getElementById('p-persona').value.trim(),
      parentesco: document.getElementById('p-parentesco').value,
      telefono: document.getElementById('p-telefono').value.trim(),
      autoriza: document.getElementById('p-autoriza').value.trim(),
      validador: document.getElementById('p-validador').value, motivo
    };
    datos.unshift(nuevo);
    guardarDatos(KEY_PERM, datos);
    if (window.sbSync) window.sbSync(KEY_PERM, datos);
    registrarActividad('permiso', `Permiso ${nuevo.folio} — ${alumno}`);
    cerrarModal(); renderPermisos(); actualizarStats(); actualizarActividad();
    mostrarToast(`Permiso ${nuevo.folio} registrado`);
  });
  _acPermiso();
}

function editarPermiso(id) {
  const datos = obtenerDatos(KEY_PERM);
  const item = datos.find(x => x.id === id);
  if (!item) return;
  abrirModal('Editar Permiso de Salida', formularioPermiso(item), function() {
    item.alumno = document.getElementById('p-alumno').value.trim();
    item.noControl = document.getElementById('p-nocontrol').value;
    item.grado = document.getElementById('p-grado').value;
    item.grupo = document.getElementById('p-grupo').value.trim().toUpperCase();
    item.especialidad = document.getElementById('p-especialidad').value.trim();
    item.fecha = document.getElementById('p-fecha').value;
    item.hora = document.getElementById('p-hora').value;
    item.horaRegreso = document.getElementById('p-horaRegreso').value;
    item.persona = document.getElementById('p-persona').value.trim();
    item.parentesco = document.getElementById('p-parentesco').value;
    item.telefono = document.getElementById('p-telefono').value.trim();
    item.autoriza = document.getElementById('p-autoriza').value.trim();
    item.validador = document.getElementById('p-validador').value;
    item.motivo = document.getElementById('p-motivo').value.trim();
    guardarDatos(KEY_PERM, datos);
    if (window.sbSync) window.sbSync(KEY_PERM, [item]);
    cerrarModal(); renderPermisos(); mostrarToast('Permiso actualizado');
  });
  _acPermiso();
}

function eliminarPermiso(id) {
  if (!confirm('¿Eliminar este permiso?')) return;
  guardarDatos(KEY_PERM, obtenerDatos(KEY_PERM).filter(x => x.id !== id));
  if (window.sbDelete) window.sbDelete(KEY_PERM, id);
  renderPermisos(); actualizarStats(); mostrarToast('Permiso eliminado');
}

function imprimirPermiso(id) {
  const p = obtenerDatos(KEY_PERM).find(x => x.id === id);
  if (!p) return;
  const cfg = obtenerConfig();
  window._expedienteAlumno = { noControl: p.noControl, nombre: p.alumno, grado: p.grado, grupo: p.grupo, tipo: 'permiso' };
  const html = `
    <div class="doc-preview" id="doc-to-pdf">
      ${membreteHeader(cfg)}
      <div class="doc-tipo-titulo">Permiso de Salida</div>
      <div class="doc-ciclo">Ciclo Escolar ${cfg.ciclo}</div>
      <div class="doc-folio-row">
        <span class="folio-label">FOLIO: <strong>${p.folio||p.id.toUpperCase()}</strong></span>
        <span class="folio-fecha">Fecha: ${formatFecha(p.fecha)}</span>
      </div>
      <div class="doc-body">
        <p>Se autoriza la salida del(la) alumno(a):</p>
        <p class="doc-highlight"><strong>${p.alumno}</strong> &nbsp;|&nbsp; <strong>${p.grado} Sem. — ${p.grupo}</strong>${p.especialidad?'&nbsp;|&nbsp; Esp: <strong>'+p.especialidad+'</strong>':''}${p.noControl?'&nbsp;|&nbsp; No. Control: <strong>'+p.noControl+'</strong>':''}</p>
        <p>Hora de salida: <strong>${p.hora||'______'}</strong>${p.horaRegreso?' &nbsp;&nbsp; Regresa: <strong>'+p.horaRegreso+'</strong>':''}</p>
        <p>Motivo: <em>"${p.motivo}"</em></p>
        ${p.persona?`<p>Recoge: <strong>${p.persona}</strong> (${p.parentesco})</p>`:''}
        ${p.telefono?`<p>Teléfono: <strong>${p.telefono}</strong></p>`:''}
        ${p.autoriza?`<p>Autoriza: <strong>${p.autoriza}</strong></p>`:''}
      </div>
      <div class="doc-validation-seal"><div class="seal-box">
        <div class="seal-title">VALIDÓ</div>
        <div class="seal-name">${p.validador||'________________________'}</div>
        <div class="seal-role">Orientación Educativa</div>
      </div></div>
      <div class="doc-signature">
        <div class="signature-box"><div class="sig-line"></div><p>${p.validador||cfg.orientadores?.[0]||'Orientador(a)'}</p><small>Orientación Educativa</small></div>
        <div class="signature-box"><div class="sig-line"></div><p>${p.persona||'Padre / Tutor'}</p><small>Firma de quien recoge</small></div>
      </div>
      ${membreteFooter(cfg)}
    </div>`;
  abrirPrint(`Permiso ${p.folio||p.id}`, html);
}

function initPermisos() {
  document.getElementById('btn-nuevo-permiso').addEventListener('click', nuevoPermiso);
  filtrarTabla('search-permisos', 'tbody-permisos');
  renderPermisos();
}
