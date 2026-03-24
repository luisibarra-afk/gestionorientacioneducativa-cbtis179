// ===== MÓDULO VISITAS EN EL AULA =====

const KEY_VIS = 'oe_visitas';

// ===== RENDER TABLA =====
function renderVisitas(datos) {
  const tbody = document.getElementById('tbody-visitas');
  if (!datos) datos = obtenerDatos(KEY_VIS);
  if (!datos.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No hay registros</td></tr>'; return; }
  tbody.innerHTML = datos.map((v) => `
    <tr>
      <td><span class="folio-tag">${v.folio||'-'}</span></td>
      <td>${formatFecha(v.fecha)}</td>
      <td><strong>${v.grupo||'-'}</strong><br><small style="color:#94a3b8">${v.semestre||''} ${v.especialidad||''}</small></td>
      <td>${v.turno||'-'}</td>
      <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v.tema||'-'}</td>
      <td><small>${v.orientador||'-'}</small></td>
      <td><div class="btn-actions">
        <button class="btn-icon view" title="Ver expediente del grupo" onclick="verExpedienteGrupo('${encodeURIComponent(v.grupo||'')}')"><i class="fas fa-folder-open"></i></button>
        <button class="btn-icon print" title="PDF" onclick="imprimirVisita('${v.id}')"><i class="fas fa-file-pdf"></i></button>
        ${v.pdfUrl?`<a class="btn-icon drive" title="Ver PDF en nube" href="${v.pdfUrl}" target="_blank"><i class="fas fa-cloud-download-alt"></i></a>`:`<button class="btn-icon delete" style="background:#f97316" title="Subir PDF a nube" onclick="window._subirPDFManual('oe_visitas','${v.id}')"><i class="fas fa-cloud-upload-alt"></i></button>`}
        <button class="btn-icon edit" title="Editar" onclick="editarVisita('${v.id}')"><i class="fas fa-edit"></i></button>
        ${esAdmin()?`<button class="btn-icon delete" title="Eliminar" onclick="eliminarVisita('${v.id}')"><i class="fas fa-trash"></i></button>`:''}
      </div></td>
    </tr>`).join('');
}

// ===== FORMULARIO =====
function formularioVisita(datos = {}) {
  return `
    <div class="form-grid">
      <div class="form-group"><label>Fecha *</label>
        <input type="date" id="v-fecha" class="form-control" value="${datos.fecha||fechaHoy()}">
      </div>
      <div class="form-group"><label>Turno</label>
        <select id="v-turno" class="form-control">
          ${['Matutino','Vespertino','Mixto'].map(t=>`<option ${datos.turno===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Semestre</label>
        <select id="v-semestre" class="form-control">
          ${['1°','2°','3°','4°','5°','6°'].map(g=>`<option ${datos.semestre===g?'selected':''}>${g}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Grupo *</label>
        <input type="text" id="v-grupo" class="form-control" value="${datos.grupo||''}" placeholder="Ej: 1AMARH, 3B...">
      </div>
      <div class="form-group form-full"><label>Especialidad</label>
        <input type="text" id="v-especialidad" class="form-control" value="${datos.especialidad||''}" placeholder="Administración, Informática...">
      </div>
      <div class="form-group form-full"><label>Tema Socioemocional tratado *</label>
        <input type="text" id="v-tema" class="form-control" value="${datos.tema||''}" placeholder="Ej: Manejo del estrés, Bullying, Proyecto de vida...">
      </div>
      <div class="form-group form-full"><label>Descripción / Reporte de la visita *</label>
        <textarea id="v-descripcion" class="form-control" rows="5" placeholder="Describe el desarrollo de la sesión, participación de los alumnos, observaciones...">${datos.descripcion||''}</textarea>
      </div>
      <div class="form-group form-full"><label>Acuerdos o seguimiento</label>
        <textarea id="v-acuerdos" class="form-control" rows="2" placeholder="Acuerdos, compromisos o seguimiento a realizar...">${datos.acuerdos||''}</textarea>
      </div>
      <div class="form-group"><label>Foto 1 (opcional)</label>
        <input type="file" id="v-foto1" class="form-control" accept="image/*">
        ${datos.foto1?`<img src="${datos.foto1}" style="margin-top:6px;max-width:100%;max-height:120px;border-radius:6px;border:1px solid #e2e8f0" alt="foto1">`:''}
      </div>
      <div class="form-group"><label>Foto 2 (opcional)</label>
        <input type="file" id="v-foto2" class="form-control" accept="image/*">
        ${datos.foto2?`<img src="${datos.foto2}" style="margin-top:6px;max-width:100%;max-height:120px;border-radius:6px;border:1px solid #e2e8f0" alt="foto2">`:''}
      </div>
      <div class="form-group form-full"><label>Orientador(a)</label>
        <input type="text" id="v-orientador" class="form-control" value="${datos.orientador||getUsuarioActual()?.nombre||''}" readonly style="background:#f8fafc;color:#64748b">
      </div>
    </div>`;
}

function _leerFormVisita(fotoActual1, fotoActual2) {
  return {
    fecha:       document.getElementById('v-fecha').value,
    turno:       document.getElementById('v-turno').value,
    semestre:    document.getElementById('v-semestre').value,
    grupo:       document.getElementById('v-grupo').value.trim().toUpperCase(),
    especialidad:document.getElementById('v-especialidad').value.trim(),
    tema:        document.getElementById('v-tema').value.trim(),
    descripcion: document.getElementById('v-descripcion').value.trim(),
    acuerdos:    document.getElementById('v-acuerdos').value.trim(),
    orientador:  document.getElementById('v-orientador').value.trim(),
    foto1:       fotoActual1 || null,
    foto2:       fotoActual2 || null,
  };
}

function _leerFotos(fotoAnterior1, fotoAnterior2, callback) {
  const f1el = document.getElementById('v-foto1');
  const f2el = document.getElementById('v-foto2');
  let foto1 = fotoAnterior1 || null;
  let foto2 = fotoAnterior2 || null;
  let pending = 0;
  if (f1el.files[0]) pending++;
  if (f2el.files[0]) pending++;
  if (pending === 0) { callback(foto1, foto2); return; }
  const done = () => { pending--; if (pending === 0) callback(foto1, foto2); };
  if (f1el.files[0]) {
    const r = new FileReader();
    r.onload = e => { foto1 = e.target.result; done(); };
    r.readAsDataURL(f1el.files[0]);
  }
  if (f2el.files[0]) {
    const r = new FileReader();
    r.onload = e => { foto2 = e.target.result; done(); };
    r.readAsDataURL(f2el.files[0]);
  }
}

// ===== NUEVO / EDITAR =====
function nuevaVisita() {
  abrirModal('Nueva Visita en el Aula', formularioVisita(), function () {
    const grupo = document.getElementById('v-grupo').value.trim();
    const tema  = document.getElementById('v-tema').value.trim();
    const desc  = document.getElementById('v-descripcion').value.trim();
    if (!grupo || !tema || !desc) { mostrarToast('Completa Grupo, Tema y Descripción','error'); return; }
    const btn = document.getElementById('modal-save');
    btn.disabled = true; btn.textContent = 'Guardando...';
    _leerFotos(null, null, function(foto1, foto2) {
      const nuevo = {
        id: genId(),
        folio: generarFolio(KEY_VIS),
        ..._leerFormVisita(foto1, foto2),
        driveSaved: false,
      };
      const datos = obtenerDatos(KEY_VIS);
      datos.unshift(nuevo);
      guardarDatos(KEY_VIS, datos);
      if (window.sbSync) window.sbSync(KEY_VIS, datos);
      registrarActividad('visita', `Visita ${nuevo.folio} — Grupo ${nuevo.grupo} — ${nuevo.tema}`);
      mostrarToast(`Visita ${nuevo.folio} registrada`);
      renderVisitas();
      cerrarModal();
      autoSubirPDF(_htmlVisita(nuevo), { carpetaRaiz: 'Visitas en el Aula', subcarpeta: nuevo.grupo || 'SIN_GRUPO', folio: nuevo.folio, tipo: 'visita' }, KEY_VIS, nuevo.id);
    });
  });
}

function editarVisita(id) {
  const datos = obtenerDatos(KEY_VIS);
  const v = datos.find(x => x.id === id);
  if (!v) return;
  abrirModal('Editar Visita', formularioVisita(v), function () {
    const grupo = document.getElementById('v-grupo').value.trim();
    const tema  = document.getElementById('v-tema').value.trim();
    const desc  = document.getElementById('v-descripcion').value.trim();
    if (!grupo || !tema || !desc) { mostrarToast('Completa Grupo, Tema y Descripción','error'); return false; }
    const btn = document.getElementById('modal-save');
    btn.disabled = true; btn.textContent = 'Guardando...';
    _leerFotos(v.foto1, v.foto2, function(foto1, foto2) {
      Object.assign(v, _leerFormVisita(foto1, foto2));
      guardarDatos(KEY_VIS, datos);
      if (window.sbSync) window.sbSync(KEY_VIS, [v]);
      mostrarToast('Visita actualizada');
      renderVisitas();
      cerrarModal();
      autoSubirPDF(_htmlVisita(v), { carpetaRaiz: 'Visitas en el Aula', subcarpeta: v.grupo || 'SIN_GRUPO', folio: v.folio, tipo: 'visita' }, KEY_VIS, v.id);
    });
  });
}

function eliminarVisita(id) {
  if (!esAdmin()) { mostrarToast('Solo el administrador puede eliminar registros','error'); return; }
  if (!confirm('¿Eliminar este registro de visita?')) return;
  const datos = obtenerDatos(KEY_VIS).filter(x => x.id !== id);
  guardarDatos(KEY_VIS, datos);
  if (window.sbDelete) window.sbDelete(KEY_VIS, id);
  renderVisitas();
  mostrarToast('Visita eliminada');
}

// ===== HTML DOCUMENTO PARA PDF =====
function _htmlVisita(v) {
  const cfg = obtenerConfig();
  const fotos = [v.foto1, v.foto2].filter(Boolean);
  const fotosHtml = fotos.length ? `
    <div style="display:flex;gap:12px;justify-content:center;margin:12px 0">
      ${fotos.map(f=>`<img src="${f}" style="max-width:48%;max-height:180px;border-radius:6px;border:1px solid #e2e8f0;object-fit:contain">`).join('')}
    </div>` : '';
  return `
    <div class="doc-preview" style="font-family:Arial,sans-serif;font-size:11px;padding:14px 18px">
      ${membreteHeader(cfg)}
      <div style="text-align:center;margin:10px 0 8px">
        <div style="font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1e40af;border-bottom:2px solid #2563eb;padding-bottom:4px">REPORTE DE VISITA EN EL AULA</div>
        <div style="font-size:11px;color:#64748b">Folio: <strong>${v.folio}</strong></div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
        <tr>
          <td style="padding:4px 8px;width:50%"><strong>Fecha:</strong> ${formatFecha(v.fecha)}</td>
          <td style="padding:4px 8px"><strong>Turno:</strong> ${v.turno||'-'}</td>
        </tr>
        <tr style="background:#f8fafc">
          <td style="padding:4px 8px"><strong>Semestre:</strong> ${v.semestre||'-'}</td>
          <td style="padding:4px 8px"><strong>Grupo:</strong> ${v.grupo||'-'}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px" colspan="2"><strong>Especialidad:</strong> ${v.especialidad||'-'}</td>
        </tr>
        <tr style="background:#f8fafc">
          <td style="padding:4px 8px" colspan="2"><strong>Tema tratado:</strong> ${v.tema||'-'}</td>
        </tr>
      </table>
      <div style="margin-bottom:8px">
        <div style="font-weight:700;color:#1e40af;margin-bottom:4px;font-size:11px;text-transform:uppercase">Descripción / Reporte</div>
        <div style="border:1px solid #e2e8f0;border-radius:4px;padding:8px;min-height:60px;background:#fafafa;line-height:1.6">${(v.descripcion||'').replace(/\n/g,'<br>')}</div>
      </div>
      ${v.acuerdos?`<div style="margin-bottom:8px">
        <div style="font-weight:700;color:#1e40af;margin-bottom:4px;font-size:11px;text-transform:uppercase">Acuerdos / Seguimiento</div>
        <div style="border:1px solid #e2e8f0;border-radius:4px;padding:8px;background:#fafafa;line-height:1.6">${v.acuerdos.replace(/\n/g,'<br>')}</div>
      </div>`:''}
      ${fotosHtml}
      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <div style="text-align:center;width:220px">
          <div style="border-bottom:1px solid #374151;margin-bottom:4px;height:30px"></div>
          <div style="font-size:10px"><strong>${v.orientador||'_______________________'}</strong></div>
          <div style="font-size:10px;color:#64748b">Orientador(a) Educativo(a)</div>
        </div>
      </div>
      ${membreteFooter(cfg)}
    </div>`;
}

// ===== IMPRIMIR =====
function imprimirVisita(id) {
  const v = obtenerDatos(KEY_VIS).find(x => x.id === id);
  if (!v) return;
  window._expedienteAlumno = { carpetaRaiz: 'Visitas en el Aula', subcarpeta: v.grupo || 'SIN_GRUPO', folio: v.folio, tipo: 'visita' };
  window._pdfUploadCtx = { modulo: KEY_VIS, id: v.id, folio: v.folio };
  abrirPrint(`Visita ${v.folio}`, _htmlVisita(v));
}

// ===== GUARDAR EN DRIVE =====
async function _driveVisita(id) {
  const v = obtenerDatos(KEY_VIS).find(x => x.id === id);
  if (!v) return;
  if (typeof guardarDocEnDrive !== 'function') return;
  // Carpeta separada: "Visitas en el Aula / GRUPO"
  const expediente = {
    nombre: v.grupo || 'SIN_GRUPO',
    carpetaRaiz: `Visitas en el Aula`,
    subcarpeta: v.grupo || 'SIN_GRUPO',
    tipo: 'VISITA',
    folio: v.folio,
    fecha: v.fecha,
  };
  const ok = await guardarDocEnDrive(_htmlVisita(v), expediente);
  if (ok) {
    const datos = obtenerDatos(KEY_VIS);
    const reg = datos.find(x => x.id === id);
    if (reg) { reg.driveSaved = true; guardarDatos(KEY_VIS, datos); renderVisitas(); }
  }
}

// ===== EXPEDIENTE POR GRUPO =====
function verExpedienteGrupo(grupoEnc) {
  const grupo = decodeURIComponent(grupoEnc);
  const todas = obtenerDatos(KEY_VIS).filter(v => v.grupo === grupo);
  const cfg = obtenerConfig();
  if (!todas.length) { mostrarToast(`Sin registros para el grupo ${grupo}`); return; }
  const html = `
    <div class="doc-preview" style="font-family:Arial,sans-serif;font-size:11px;padding:14px 18px">
      ${membreteHeader(cfg)}
      <div style="text-align:center;margin:10px 0 8px">
        <div style="font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1e40af;border-bottom:2px solid #2563eb;padding-bottom:4px">EXPEDIENTE DE VISITAS EN EL AULA</div>
        <div style="font-size:12px;color:#374151;margin-top:4px"><strong>Grupo: ${grupo}</strong></div>
        <div style="font-size:11px;color:#64748b">${todas.length} visita(s) registrada(s)</div>
      </div>
      ${todas.map((v, i) => `
        <div style="border:1px solid #cbd5e1;border-radius:6px;padding:10px;margin-bottom:12px;page-break-inside:avoid">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-weight:700;color:#2563eb">${i+1}. ${v.folio} — ${formatFecha(v.fecha)}</span>
            <span style="color:#64748b;font-size:10px">${v.orientador||''}</span>
          </div>
          <div><strong>Tema:</strong> ${v.tema||'-'}</div>
          <div style="margin-top:4px"><strong>Descripción:</strong> ${(v.descripcion||'-').replace(/\n/g,'<br>')}</div>
          ${v.acuerdos?`<div style="margin-top:4px"><strong>Acuerdos:</strong> ${v.acuerdos.replace(/\n/g,'<br>')}</div>`:''}
          ${[v.foto1,v.foto2].filter(Boolean).length?`<div style="display:flex;gap:8px;margin-top:8px">
            ${[v.foto1,v.foto2].filter(Boolean).map(f=>`<img src="${f}" style="max-width:48%;max-height:140px;object-fit:contain;border-radius:4px;border:1px solid #e2e8f0">`).join('')}
          </div>`:''}
        </div>`).join('')}
      ${membreteFooter(cfg)}
    </div>`;
  abrirPrint(`Expediente Grupo ${grupo}`, html);
}

// ===== INIT =====
function initVisitas() {
  document.getElementById('btn-nueva-visita').addEventListener('click', nuevaVisita);
  filtrarTabla('search-visitas', 'tbody-visitas');
  renderVisitas();
}
