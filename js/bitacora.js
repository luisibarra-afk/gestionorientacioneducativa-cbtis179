// ===== MÓDULO BITÁCORA DE SEGURIDAD =====

const KEY_BIT = 'bitacora';

const TIPOS_INC = ['Accidente','Atención Médica','Conflicto entre alumnos','Conflicto alumno-docente','Intrusión/persona ajena','Robo o extravío','Daño a instalaciones','Situación de emergencia','Otro'];
const GRAVEDAD_INC = ['Leve','Moderado','Grave','Muy grave'];

function badgeIncidente(tipo) {
  if (!tipo) return 'otro';
  if (tipo.toLowerCase().includes('accidente')) return 'accidente';
  if (tipo.toLowerCase().includes('médica') || tipo.toLowerCase().includes('medica')) return 'medico';
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
  const esMedico = datos.tipo === 'Atención Médica';
  const equipoSi = datos.equipoPrestado === 'Sí';
  return `
    <div class="form-grid">
      <div class="form-group">
        <label>Tipo de Incidente *</label>
        <select id="b-tipo" class="form-control" onchange="document.getElementById('medicos-fields').style.display=this.value==='Atención Médica'?'block':'none'">
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

      <!-- CAMPOS ATENCIÓN MÉDICA -->
      <div class="form-group form-full" id="medicos-fields" style="${esMedico ? '' : 'display:none'}">
        <div style="border-top:2px solid #e2e8f0;margin:4px 0 14px;padding-top:14px">
          <strong style="color:#0f172a;font-size:14px"><i class="fas fa-heartbeat" style="color:#ef4444"></i> Datos de Atención Médica</strong>
        </div>
        <div class="form-grid" style="margin:0">
          <div class="form-group">
            <label>Signos Vitales</label>
            <input type="text" id="b-signosVitales" class="form-control" value="${datos.signosVitales||''}" placeholder="Descripción general">
          </div>
          <div class="form-group">
            <label>Presión Arterial</label>
            <input type="text" id="b-presion" class="form-control" value="${datos.presion||''}" placeholder="120/80 mmHg">
          </div>
          <div class="form-group">
            <label>Temperatura</label>
            <input type="text" id="b-temperatura" class="form-control" value="${datos.temperatura||''}" placeholder="°C">
          </div>
          <div class="form-group">
            <label>Pulso</label>
            <input type="text" id="b-pulso" class="form-control" value="${datos.pulso||''}" placeholder="lpm">
          </div>
          <div class="form-group form-full">
            <label>¿Sufre alergias?</label>
            <input type="text" id="b-alergias" class="form-control" value="${datos.alergias||''}" placeholder="Especificar o escribir 'Ninguna'">
          </div>
          <div class="form-group form-full">
            <label>Medicamento administrado</label>
            <input type="text" id="b-medicamento" class="form-control" value="${datos.medicamento||''}" placeholder="Nombre del medicamento y dosis">
          </div>
          <div class="form-group">
            <label>¿Se prestó equipo?</label>
            <select id="b-equipoPrestado" class="form-control" onchange="document.getElementById('equipo-detalle').style.display=this.value==='Sí'?'contents':'none'">
              <option ${!equipoSi?'selected':''}>No</option>
              <option ${equipoSi?'selected':''}>Sí</option>
            </select>
          </div>
          <div id="equipo-detalle" style="${equipoSi ? 'contents' : 'display:none'}">
            <div class="form-group">
              <label>¿Cuál equipo?</label>
              <input type="text" id="b-equipoCual" class="form-control" value="${datos.equipoCual||''}" placeholder="Descripción del equipo">
            </div>
            <div class="form-group">
              <label>Fecha de entrega</label>
              <input type="date" id="b-equipoEntrega" class="form-control" value="${datos.equipoEntrega||fechaHoy()}">
            </div>
            <div class="form-group">
              <label>Fecha de devolución</label>
              <input type="date" id="b-equipoDevolucion" class="form-control" value="${datos.equipoDevolucion||''}">
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function _leerMedico() {
  if (document.getElementById('b-tipo')?.value !== 'Atención Médica') return {};
  const eq = document.getElementById('b-equipoPrestado')?.value || 'No';
  return {
    signosVitales: document.getElementById('b-signosVitales')?.value.trim() || '',
    presion:       document.getElementById('b-presion')?.value.trim() || '',
    temperatura:   document.getElementById('b-temperatura')?.value.trim() || '',
    pulso:         document.getElementById('b-pulso')?.value.trim() || '',
    alergias:      document.getElementById('b-alergias')?.value.trim() || '',
    medicamento:   document.getElementById('b-medicamento')?.value.trim() || '',
    equipoPrestado: eq,
    equipoCual:      eq === 'Sí' ? (document.getElementById('b-equipoCual')?.value.trim() || '') : '',
    equipoEntrega:   eq === 'Sí' ? (document.getElementById('b-equipoEntrega')?.value || '') : '',
    equipoDevolucion:eq === 'Sí' ? (document.getElementById('b-equipoDevolucion')?.value || '') : ''
  };
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
      seguimiento: document.getElementById('b-seguimiento').value.trim(),
      ..._leerMedico()
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
    Object.assign(item, _leerMedico());
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
      ${b.tipo === 'Atención Médica' ? `
      <tr><td colspan="2" style="padding-top:12px;font-weight:700;color:#ef4444;font-size:13px"><i class="fas fa-heartbeat"></i> Atención Médica</td></tr>
      ${b.signosVitales ? `<tr><td style="font-weight:600;color:#475569;padding:4px 0">Signos vitales:</td><td>${b.signosVitales}</td></tr>` : ''}
      ${b.presion ? `<tr><td style="font-weight:600;color:#475569;padding:4px 0">Presión arterial:</td><td>${b.presion}</td></tr>` : ''}
      ${b.temperatura ? `<tr><td style="font-weight:600;color:#475569;padding:4px 0">Temperatura:</td><td>${b.temperatura}</td></tr>` : ''}
      ${b.pulso ? `<tr><td style="font-weight:600;color:#475569;padding:4px 0">Pulso:</td><td>${b.pulso}</td></tr>` : ''}
      ${b.alergias ? `<tr><td style="font-weight:600;color:#475569;padding:4px 0">Alergias:</td><td>${b.alergias}</td></tr>` : ''}
      ${b.medicamento ? `<tr><td style="font-weight:600;color:#475569;padding:4px 0">Medicamento:</td><td>${b.medicamento}</td></tr>` : ''}
      <tr><td style="font-weight:600;color:#475569;padding:4px 0">Equipo prestado:</td><td>${b.equipoPrestado || 'No'}</td></tr>
      ${b.equipoPrestado === 'Sí' ? `
        ${b.equipoCual ? `<tr><td style="font-weight:600;color:#475569;padding:4px 0">¿Cuál equipo?</td><td>${b.equipoCual}</td></tr>` : ''}
        ${b.equipoEntrega ? `<tr><td style="font-weight:600;color:#475569;padding:4px 0">Fecha de entrega:</td><td>${formatFecha(b.equipoEntrega)}</td></tr>` : ''}
        ${b.equipoDevolucion ? `<tr><td style="font-weight:600;color:#475569;padding:4px 0">Fecha de devolución:</td><td>${formatFecha(b.equipoDevolucion)}</td></tr>` : ''}
      ` : ''}
      ` : ''}
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
        ${b.tipo === 'Atención Médica' ? `
        <hr style="margin:14px 0;border-color:#fca5a5">
        <p style="color:#dc2626;font-weight:700"><i class="fas fa-heartbeat"></i> Atención Médica</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px;line-height:1.8">
          ${b.signosVitales ? `<tr><td style="font-weight:600;width:160px">Signos vitales:</td><td>${b.signosVitales}</td></tr>` : ''}
          ${b.presion ? `<tr><td style="font-weight:600">Presión arterial:</td><td>${b.presion}</td></tr>` : ''}
          ${b.temperatura ? `<tr><td style="font-weight:600">Temperatura:</td><td>${b.temperatura}</td></tr>` : ''}
          ${b.pulso ? `<tr><td style="font-weight:600">Pulso:</td><td>${b.pulso}</td></tr>` : ''}
          ${b.alergias ? `<tr><td style="font-weight:600">Alergias:</td><td>${b.alergias}</td></tr>` : ''}
          ${b.medicamento ? `<tr><td style="font-weight:600">Medicamento:</td><td>${b.medicamento}</td></tr>` : ''}
          <tr><td style="font-weight:600">Equipo prestado:</td><td>${b.equipoPrestado || 'No'}${b.equipoCual ? ' — ' + b.equipoCual : ''}</td></tr>
          ${b.equipoPrestado === 'Sí' && b.equipoEntrega ? `<tr><td style="font-weight:600">Fecha entrega:</td><td>${formatFecha(b.equipoEntrega)}</td></tr>` : ''}
          ${b.equipoPrestado === 'Sí' && b.equipoDevolucion ? `<tr><td style="font-weight:600">Fecha devolución:</td><td>${formatFecha(b.equipoDevolucion)}</td></tr>` : ''}
        </table>` : ''}
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
    'Reportado por': b.reporta || '',
    'Signos Vitales': b.signosVitales || '',
    'Presión': b.presion || '',
    'Temperatura': b.temperatura || '',
    'Pulso': b.pulso || '',
    'Alergias': b.alergias || '',
    'Medicamento': b.medicamento || '',
    'Equipo Prestado': b.equipoPrestado || '',
    'Cuál Equipo': b.equipoCual || '',
    'Fecha Entrega Equipo': b.equipoEntrega ? formatFecha(b.equipoEntrega) : '',
    'Fecha Devolución Equipo': b.equipoDevolucion ? formatFecha(b.equipoDevolucion) : ''
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
