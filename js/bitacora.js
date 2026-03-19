// ===== MÓDULO BITÁCORA DE SEGURIDAD =====

const KEY_BIT = 'bitacora';

const TIPOS_INC = ['Accidente','Conflicto entre alumnos','Conflicto alumno-docente','Intrusión/persona ajena','Robo o extravío','Daño a instalaciones','Situación de emergencia','Otro'];
const GRAVEDAD_INC = ['Leve','Moderado','Grave','Muy grave'];

function badgeIncidente(tipo) {
  if (!tipo) return 'otro';
  if (tipo.toLowerCase().includes('accidente')) return 'accidente';
  if (tipo.toLowerCase().includes('conflicto')) return 'conflicto';
  return 'otro';
}

function renderBitacora(datos) {
  const tbody = document.getElementById('tbody-bitacora');
  if (!datos) datos = obtenerDatos(KEY_BIT);
  if (!datos.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No hay registros</td></tr>';
    return;
  }
  tbody.innerHTML = datos.map((b) => `
    <tr>
      <td><span class="folio-tag">${b.folio || '-'}</span></td>
      <td><span class="badge badge-${badgeIncidente(b.tipo)}">${b.tipo}</span></td>
      <td title="${b.involucrados}">${b.involucrados.length > 25 ? b.involucrados.slice(0,25)+'…' : b.involucrados}</td>
      <td>${b.lugar || '-'}</td>
      <td>${formatFecha(b.fecha)} ${b.hora || ''}</td>
      <td title="${b.descripcion}">${b.descripcion.length > 35 ? b.descripcion.slice(0,35)+'…' : b.descripcion}</td>
      <td title="${b.acciones}">${b.acciones.length > 30 ? b.acciones.slice(0,30)+'…' : b.acciones}</td>
      <td>
        <div class="btn-actions">
          <button class="btn-icon view" title="Ver detalle" onclick="verIncidente('${b.id}')"><i class="fas fa-eye"></i></button>
          <button class="btn-icon print" title="Vista previa / PDF" onclick="imprimirIncidente('${b.id}')"><i class="fas fa-file-pdf"></i></button>
          <button class="btn-icon ${b.driveSaved?'drive':'drive-pend'}" title="${b.driveSaved?'Guardado en Drive':'Guardar PDF en Drive'}" onclick="_driveBitPDF('${b.id}')"><i class="fab fa-google-drive"></i></button>
          <button class="btn-icon edit" title="Editar" onclick="editarIncidente('${b.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete" title="Eliminar" onclick="eliminarIncidente('${b.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

function formularioIncidente(datos = {}) {
  return `
    <div class="form-grid">
      <div class="form-group">
        <label>Tipo de Incidente *</label>
        <select id="b-tipo" class="form-control">
          ${TIPOS_INC.map(t => `<option ${datos.tipo===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Gravedad</label>
        <select id="b-gravedad" class="form-control">
          ${GRAVEDAD_INC.map(g => `<option ${datos.gravedad===g?'selected':''}>${g}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Fecha del Incidente *</label>
        <input type="date" id="b-fecha" class="form-control" value="${datos.fecha || fechaHoy()}">
      </div>
      <div class="form-group">
        <label>Hora</label>
        <input type="time" id="b-hora" class="form-control" value="${datos.hora || ''}">
      </div>
      <div class="form-group">
        <label>Lugar</label>
        <input type="text" id="b-lugar" class="form-control" value="${datos.lugar || ''}" placeholder="Ej: Patio, Aula 12...">
      </div>
      <div class="form-group">
        <label>Reportado por</label>
        <input type="text" id="b-reporta" class="form-control" value="${datos.reporta || ''}" placeholder="Nombre de quien reporta">
      </div>
      <div class="form-group form-full">
        <label>Personas Involucradas *</label>
        <textarea id="b-involucrados" class="form-control" placeholder="Nombres de alumnos, docentes u otras personas">${datos.involucrados || ''}</textarea>
      </div>
      <div class="form-group form-full">
        <label>Descripción del Incidente *</label>
        <textarea id="b-descripcion" class="form-control" placeholder="Describa detalladamente lo sucedido...">${datos.descripcion || ''}</textarea>
      </div>
      <div class="form-group form-full">
        <label>Acciones Tomadas *</label>
        <textarea id="b-acciones" class="form-control" placeholder="Primeros auxilios, llamada a padres, intervención de autoridades...">${datos.acciones || ''}</textarea>
      </div>
      <div class="form-group form-full">
        <label>Seguimiento / Observaciones</label>
        <textarea id="b-seguimiento" class="form-control">${datos.seguimiento || ''}</textarea>
      </div>
    </div>`;
}

function nuevoIncidente() {
  abrirModal('Registrar Incidente de Seguridad', formularioIncidente(), function() {
    const involucrados = document.getElementById('b-involucrados').value.trim();
    const descripcion = document.getElementById('b-descripcion').value.trim();
    const acciones = document.getElementById('b-acciones').value.trim();
    if (!involucrados || !descripcion || !acciones) { mostrarToast('Involucrados, descripción y acciones son obligatorios', 'error'); return; }
    const datos = obtenerDatos(KEY_BIT);
    const nuevo = {
      id: genId(),
      folio: generarFolio(KEY_BIT),
      tipo: document.getElementById('b-tipo').value,
      gravedad: document.getElementById('b-gravedad').value,
      fecha: document.getElementById('b-fecha').value,
      hora: document.getElementById('b-hora').value,
      lugar: document.getElementById('b-lugar').value.trim(),
      reporta: document.getElementById('b-reporta').value.trim(),
      involucrados,
      descripcion,
      acciones,
      seguimiento: document.getElementById('b-seguimiento').value.trim()
    };
    datos.unshift(nuevo);
    guardarDatos(KEY_BIT, datos);
    if (window.sbSync) window.sbSync(KEY_BIT, datos);
    registrarActividad('incidente', `Incidente ${nuevo.folio} — ${nuevo.tipo} (${nuevo.gravedad})`);
    cerrarModal();
    renderBitacora();
    actualizarStats();
    actualizarActividad();
    mostrarToast(`Incidente ${nuevo.folio} registrado en bitácora`);
    _driveBitPDF(nuevo.id);
  });
}

function editarIncidente(id) {
  const datos = obtenerDatos(KEY_BIT);
  const item = datos.find(x => x.id === id);
  if (!item) return;
  abrirModal('Editar Incidente', formularioIncidente(item), function() {
    item.tipo = document.getElementById('b-tipo').value;
    item.gravedad = document.getElementById('b-gravedad').value;
    item.fecha = document.getElementById('b-fecha').value;
    item.hora = document.getElementById('b-hora').value;
    item.lugar = document.getElementById('b-lugar').value.trim();
    item.reporta = document.getElementById('b-reporta').value.trim();
    item.involucrados = document.getElementById('b-involucrados').value.trim();
    item.descripcion = document.getElementById('b-descripcion').value.trim();
    item.acciones = document.getElementById('b-acciones').value.trim();
    item.seguimiento = document.getElementById('b-seguimiento').value.trim();
    guardarDatos(KEY_BIT, datos);
    if (window.sbSync) window.sbSync(KEY_BIT, [item]);
    cerrarModal();
    renderBitacora();
    mostrarToast('Incidente actualizado');
    _driveBitPDF(item.id);
  });
}

function verIncidente(id) {
  const b = obtenerDatos(KEY_BIT).find(x => x.id === id);
  if (!b) return;
  const html = `
    <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.9">
      <tr><td style="font-weight:600;color:#475569;width:140px;padding:4px 0">Folio:</td><td>${b.folio || '-'}</td></tr>
      <tr><td style="font-weight:600;color:#475569;padding:4px 0">Tipo:</td><td>${b.tipo}</td></tr>
      <tr><td style="font-weight:600;color:#475569;padding:4px 0">Gravedad:</td><td>${b.gravedad}</td></tr>
      <tr><td style="font-weight:600;color:#475569;padding:4px 0">Fecha / Hora:</td><td>${formatFecha(b.fecha)} ${b.hora || ''}</td></tr>
      <tr><td style="font-weight:600;color:#475569;padding:4px 0">Lugar:</td><td>${b.lugar || '-'}</td></tr>
      <tr><td style="font-weight:600;color:#475569;padding:4px 0;vertical-align:top">Involucrados:</td><td>${b.involucrados}</td></tr>
      <tr><td style="font-weight:600;color:#475569;padding:4px 0">Reportado por:</td><td>${b.reporta || '-'}</td></tr>
      <tr><td style="font-weight:600;color:#475569;padding:4px 0;vertical-align:top">Descripción:</td><td>${b.descripcion}</td></tr>
      <tr><td style="font-weight:600;color:#475569;padding:4px 0;vertical-align:top">Acciones:</td><td>${b.acciones}</td></tr>
      ${b.seguimiento ? `<tr><td style="font-weight:600;color:#475569;padding:4px 0;vertical-align:top">Seguimiento:</td><td>${b.seguimiento}</td></tr>` : ''}
    </table>`;
  abrirModal(`${b.folio || 'Incidente'} — ${b.tipo}`, html, null);
}

function eliminarIncidente(id) {
  if (!confirm('¿Eliminar este registro de la bitácora?')) return;
  guardarDatos(KEY_BIT, obtenerDatos(KEY_BIT).filter(x => x.id !== id));
  if (window.sbDelete) window.sbDelete(KEY_BIT, id);
  renderBitacora();
  actualizarStats();
  mostrarToast('Registro eliminado de la bitácora');
}

function _htmlDocBit(b, cfg) {
  return `
    <div class="doc-preview" id="doc-to-pdf">
      ${membreteHeader(cfg)}
      <div class="doc-tipo-titulo">Bitácora de Seguridad — Registro de Incidente</div>
      <div class="doc-ciclo">Ciclo Escolar ${cfg.ciclo}</div>
      <div class="doc-folio-row">
        <span class="folio-label">FOLIO: <strong>${b.folio || b.id.toUpperCase()}</strong></span>
        <span class="folio-fecha">Fecha: ${formatFecha(b.fecha)} ${b.hora || ''}</span>
      </div>
      <div class="doc-body">
        <p><strong>Tipo de incidente:</strong> ${b.tipo} &nbsp;&nbsp; <strong>Gravedad:</strong> ${b.gravedad}</p>
        <p><strong>Lugar:</strong> ${b.lugar || 'No especificado'}</p>
        <p><strong>Personas involucradas:</strong> ${b.involucrados}</p>
        <p><strong>Descripción del incidente:</strong></p>
        <p style="padding-left:20px;font-style:italic">${b.descripcion}</p>
        <p><strong>Acciones tomadas:</strong></p>
        <p style="padding-left:20px">${b.acciones}</p>
        ${b.seguimiento ? `<p><strong>Seguimiento:</strong></p><p style="padding-left:20px">${b.seguimiento}</p>` : ''}
        <p><strong>Reportado por:</strong> ${b.reporta || '________________________'}</p>
      </div>
      <div class="doc-signature">
        <div class="signature-box"><div class="sig-line"></div><p>${b.reporta || cfg.orientadores?.[0] || 'Orientador(a)'}</p><small>Quien reporta</small></div>
        <div class="signature-box"><div class="sig-line"></div><p>${cfg.director || 'Director(a)'}</p><small>Visto bueno Dirección</small></div>
      </div>
      ${membreteFooter(cfg)}
    </div>`;
}

function imprimirIncidente(id) {
  const b = obtenerDatos(KEY_BIT).find(x => x.id === id);
  if (!b) return;
  const cfg = obtenerConfig();
  abrirPrint(`Incidente ${b.folio || b.id}`, _htmlDocBit(b, cfg));
}

async function _driveBitPDF(id) {
  const datos = obtenerDatos(KEY_BIT);
  const b = datos.find(x => x.id === id);
  if (!b || !window.guardarArchivoEnDrive) return;
  const cfg = obtenerConfig();
  const ciclo = cfg.ciclo || '2025-2026';
  const carpeta = `Bitácora de Seguridad ${ciclo}`;
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;';
  tmp.innerHTML = _htmlDocBit(b, cfg);
  document.body.appendChild(tmp);
  try {
    await new Promise(r => setTimeout(r, 100));
    const canvas = await html2canvas(tmp.firstElementChild || tmp, { scale: 2, useCORS: true, backgroundColor: '#fff', logging: false });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const a4H  = pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, a4H);
    const fileName = `${b.folio || b.id}_${b.tipo.replace(/[\s\/]/g,'-')}_${b.fecha}.pdf`;
    const ok = await window.guardarArchivoEnDrive(pdf.output('blob'), fileName, carpeta);
    if (ok) {
      b.driveSaved = true;
      guardarDatos(KEY_BIT, datos);
      renderBitacora();
    }
  } catch(e) {
    mostrarToast('Error al generar PDF: ' + e.message, 'error');
  } finally {
    document.body.removeChild(tmp);
  }
}

async function _driveBitExcel() {
  if (!window.guardarArchivoEnDrive) { mostrarToast('Drive no vinculado', 'error'); return; }
  const datos = obtenerDatos(KEY_BIT);
  if (!datos.length) { mostrarToast('No hay registros en la bitácora', 'error'); return; }
  const cfg = obtenerConfig();
  const ciclo = cfg.ciclo || '2025-2026';
  const filas = datos.map(b => ({
    'Folio': b.folio || '-',
    'Tipo': b.tipo,
    'Gravedad': b.gravedad,
    'Fecha': formatFecha(b.fecha),
    'Hora': b.hora || '',
    'Lugar': b.lugar || '',
    'Involucrados': b.involucrados,
    'Descripción': b.descripcion,
    'Acciones Tomadas': b.acciones,
    'Seguimiento': b.seguimiento || '',
    'Reportado por': b.reporta || ''
  }));
  const ws = XLSX.utils.json_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bitácora');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `Bitacora_Seguridad_${fechaHoy()}.xlsx`;
  await window.guardarArchivoEnDrive(blob, fileName, `Bitácora de Seguridad ${ciclo}`);
}

function initBitacora() {
  document.getElementById('btn-nuevo-incidente').addEventListener('click', nuevoIncidente);
  filtrarTabla('search-bitacora', 'tbody-bitacora');
  renderBitacora();
}
