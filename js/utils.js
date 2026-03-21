// ===== UTILIDADES GLOBALES =====

const PREFIJOS = { justificantes: 'JUS', permisos: 'PER', citatorios: 'CIT', reportes: 'REP', bitacora: 'BIT', alumnos: 'ALU' };

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function generarFolio(modulo) {
  const anio = new Date().getFullYear();
  const contadores = JSON.parse(localStorage.getItem('folios') || '{}');
  const key = `${modulo}_${anio}`;
  contadores[key] = (contadores[key] || 0) + 1;
  localStorage.setItem('folios', JSON.stringify(contadores));
  return `${PREFIJOS[modulo]}-${anio}-${String(contadores[key]).padStart(4, '0')}`;
}

function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

function formatFecha(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function mostrarToast(msg, tipo = 'ok') {
  const t = document.getElementById('toast');
  t.querySelector('i').className = tipo === 'ok' ? 'fas fa-check-circle' : 'fas fa-times-circle';
  t.querySelector('i').style.color = tipo === 'ok' ? '#4ade80' : '#f87171';
  document.getElementById('toast-msg').textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3500);
}

function obtenerDatos(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function guardarDatos(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  // Sync en background a Supabase si está conectado
  if (window.sbSync) window.sbSync(key, data);
}

// Modal genérico
function abrirModal(titulo, htmlContent, onSave) {
  document.getElementById('modal-title').textContent = titulo;
  document.getElementById('modal-body').innerHTML = htmlContent;
  document.getElementById('modal-overlay').classList.remove('hidden');
  const btn = document.getElementById('modal-save');
  btn.style.display = onSave ? '' : 'none';
  btn.onclick = onSave;
}

function cerrarModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-save').style.display = '';
  document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.remove());
}

// ======= PDF / IMPRESIÓN =======
let _pdfTituloActual = '';

// Envuelve un documento en media hoja con línea de corte
function _wrapMediaHoja(innerHtml) {
  // Reemplazar el div .doc-preview para que no tenga padding ni centrado que cause espacio
  const inner = innerHtml
    .replace(/\bid="doc-to-pdf"/g, '')
    .replace(/class="doc-preview"[^>]*>/,
      'style="font-family:Times New Roman,serif;width:100%;padding:12px 28px 8px;background:#fff;color:#111;box-sizing:border-box">');
  return `
    <div id="doc-to-pdf" data-halfpage="1"
         style="width:794px;background:#fff;font-family:Arial,sans-serif">
      ${inner}
      <div style="display:flex;align-items:center;gap:6px;padding:4px 10px;margin-top:6px;
                  background:#f8fafc;border-top:2px dashed #94a3b8;border-bottom:2px dashed #94a3b8;
                  color:#94a3b8;font-size:10px;letter-spacing:3px;user-select:none">
        <span style="font-size:13px">✂</span>
        <div style="flex:1;border-top:1px dashed #cbd5e1"></div>
        <span style="white-space:nowrap">RECORTAR</span>
        <div style="flex:1;border-top:1px dashed #cbd5e1"></div>
        <span style="font-size:13px">✂</span>
      </div>
    </div>`;
}

function imprimirVentana() {
  const el = document.getElementById('doc-to-pdf');
  if (!el) return;
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Imprimir</title>
  <style>
    @page { margin: 8mm; }
    *{ box-sizing:border-box; }
    body{ margin:0; padding:0; background:#fff; font-family:'Times New Roman',serif; color:#111; }
    .doc-tipo-titulo{ font-size:18px; font-weight:900; text-transform:uppercase; letter-spacing:3px; text-align:center; color:#1e293b; margin-bottom:2px; }
    .doc-ciclo{ font-size:12px; color:#64748b; text-align:center; margin-bottom:14px; }
    .doc-folio-row{ display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:5px; padding:7px 14px; margin-bottom:18px; font-size:13px; }
    .folio-label{ font-family:'Courier New',monospace; font-size:13px; }
    .folio-fecha{ color:#475569; font-size:12px; }
    .doc-body{ font-size:13px; line-height:1.9; }
    .doc-body p{ margin-bottom:10px; text-align:justify; }
    .doc-highlight{ background:#f0f9ff; border-left:4px solid #2563eb; padding:8px 14px; border-radius:4px; font-size:14px; margin:12px 0; }
    .doc-motivo{ background:#fffbeb; border-left:4px solid #f59e0b; padding:8px 14px; border-radius:4px; font-style:italic; }
    .doc-validation-seal{ display:flex; justify-content:flex-end; margin:20px 0 10px; }
    .seal-box{ border:2px solid #1e293b; border-radius:8px; padding:10px 20px; text-align:center; min-width:220px; background:#f8fafc; }
    .seal-title{ font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:3px; color:#64748b; }
    .seal-name{ font-size:14px; font-weight:bold; color:#1e293b; margin-top:4px; }
    .seal-role{ font-size:11px; color:#64748b; margin-top:2px; }
    .doc-signature{ display:flex; justify-content:space-around; margin-top:24px; flex-wrap:wrap; gap:20px; }
    .signature-box{ text-align:center; min-width:160px; }
    .sig-line{ border-top:1px solid #1e293b; margin-bottom:8px; }
    .signature-box p{ font-size:12px; font-weight:bold; }
    .signature-box small{ font-size:11px; color:#64748b; }
  </style>
  </head><body>${el.outerHTML}</body></html>`);
  win.document.close();
  setTimeout(function(){ win.focus(); win.print(); win.close(); }, 600);
}

function abrirPrint(titulo, htmlContent) {
  _pdfTituloActual = titulo;
  document.getElementById('print-title').textContent = titulo;
  document.getElementById('print-body').innerHTML = htmlContent;
  document.getElementById('print-overlay').classList.remove('hidden');
}

function cerrarPrint() {
  document.getElementById('print-overlay').classList.add('hidden');
}

async function descargarPDFActual() {
  const btn = document.getElementById('btn-descargar-pdf');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
  try {
    const el = document.getElementById('doc-to-pdf');
    if (!el) { mostrarToast('No se encontró el documento', 'error'); return; }
    // Clonar fuera del modal para capturar sin recortes de overflow
    const clone = el.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.top = '-9999px';
    clone.style.left = '0';
    clone.style.width = el.offsetWidth + 'px';
    clone.style.zIndex = '-1';
    document.body.appendChild(clone);
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: clone.offsetWidth,
      height: clone.scrollHeight
    });
    document.body.removeChild(clone);
    const { jsPDF } = window.jspdf;
    const isHalf = el.dataset.halfpage === '1';
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const a4H  = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/png');
    if (isHalf) {
      // Colocar imagen solo en la mitad superior de A4; el resto queda en blanco para recortar
      const imgH = (canvas.height / canvas.width) * pdfW;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, Math.min(imgH, a4H / 2));
    } else {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, a4H);
    }
    const nombre = _pdfTituloActual.replace(/[^a-zA-Z0-9\-_áéíóúÁÉÍÓÚñÑ ]/g, '') || 'documento';
    pdf.save(`${nombre}.pdf`);
    // Guardar en Drive si está conectado
    if (window.guardarPDFEnDrive && window._expedienteAlumno) {
      const blob = pdf.output('blob');
      window.guardarPDFEnDrive(blob, window._expedienteAlumno).catch(() => {});
    }
    mostrarToast('PDF descargado correctamente');
  } catch (e) {
    mostrarToast('Error al generar PDF: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-file-pdf"></i> Descargar PDF';
  }
}

// Actividad reciente
function registrarActividad(tipo, descripcion) {
  const actividad = obtenerDatos('actividad');
  actividad.unshift({ tipo, descripcion, fecha: new Date().toISOString() });
  if (actividad.length > 30) actividad.pop();
  localStorage.setItem('actividad', JSON.stringify(actividad));
}

// Exportar CSV
function exportarCSV(modulo) {
  const datos = obtenerDatos(modulo);
  if (!datos.length) { mostrarToast('No hay datos para exportar', 'error'); return; }
  const enc = Object.keys(datos[0]).join(',');
  const filas = datos.map(r => Object.values(r).map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(','));
  const csv = [enc, ...filas].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${modulo}_${fechaHoy()}.csv`; a.click();
  URL.revokeObjectURL(url);
  mostrarToast('CSV exportado');
}

function exportarTodo() {
  ['justificantes','permisos','citatorios','reportes','bitacora','visitas','alumnos'].forEach((m,i) => setTimeout(() => exportarCSV(m), i*300));
}

function confirmarBorrar() {
  if (confirm('¿Borrar TODOS los datos locales? Esta acción no se puede deshacer.')) {
    ['justificantes','permisos','citatorios','reportes','bitacora','visitas','alumnos','actividad','folios'].forEach(k => localStorage.removeItem(k));
    mostrarToast('Datos borrados');
    setTimeout(() => location.reload(), 1000);
  }
}

// Filtro de tabla
function filtrarTabla(inputId, tbodyId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', function() {
    const q = this.value.toLowerCase();
    document.getElementById(tbodyId).querySelectorAll('tr').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// Selector de orientadores (HTML reutilizable)
function selectOrientadores(id, valorActual = '') {
  const cfg = obtenerConfig();
  const lista = cfg.orientadores || [];
  return `<select id="${id}" class="form-control">
    <option value="">— Seleccionar orientador —</option>
    ${lista.map(o => `<option value="${o}" ${valorActual === o ? 'selected' : ''}>${o}</option>`).join('')}
  </select>`;
}

// ===== MEMBRETE INSTITUCIONAL =====
function membreteHeader(cfg) {
  return `
  <div class="membrete-header">
    <div class="membrete-logo-izq">
      <img src="img/logo-anio.png" alt="" class="membrete-img-anio" onerror="this.style.display='none'">
      <div class="membrete-anio-txt">
        <div class="anio-num">2026</div>
        <div class="anio-sub">AÑO DE</div>
        <div class="anio-nombre">Margarita<br>Maza</div>
      </div>
    </div>
    <div class="membrete-sep-line"></div>
    <div class="membrete-datos">
      <p>${cfg.direccion || 'Calle Adolfo Lugo Verduzco No. 105 Col La Cañada, carretera México-Tuxpan km 144, cp 43615 Tulancingo de Bravo Hgo.'}</p>
      <p>Tel: ${cfg.telefonos || '7757535520 y 7757554420'} &nbsp;|&nbsp; ${cfg.correo || 'cbtis179.dir@uemstis.sems.gob.mx'}</p>
      <p>${cfg.sitio || 'https://www.facebook.com/cbtis179'}</p>
    </div>
  </div>
  <div class="membrete-linea-roja"></div>`;
}

function membreteFooter(cfg) {
  return `
  <div class="membrete-footer">
    <div class="membrete-footer-logos">
      <img src="img/logo-sep.png" alt="SEP" class="membrete-footer-img" onerror="this.style.display='none'" title="SEP">
      <img src="img/logo-dgeti.png" alt="DGETI" class="membrete-footer-img" onerror="this.style.display='none'" title="DGETI">
    </div>
    <div class="membrete-footer-texto">
      <p>Subsecretaría de Educación Media Superior</p>
      <p>Dirección General de Educación Tecnológica Industrial y de Servicios</p>
      <p>Oficina Estatal de la DGETI en el Estado de Hidalgo</p>
      <p><strong>${cfg.plantel || 'Centro de Bachillerato Tecnológico Industrial y de Servicios No. 179'}</strong></p>
      <p><strong>C.C.T. ${cfg.cct || '13DCT0001K'}</strong></p>
    </div>
    <img src="img/mujer-bandera.png" alt="" class="membrete-footer-bandera" onerror="this.style.display='none'">
  </div>`;
}

// ===== AUTO-GUARDAR DOCUMENTO EN DRIVE (sin abrir modal) =====
async function guardarDocEnDrive(htmlContent, expediente) {
  if (!window.guardarPDFEnDrive) return false;
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;';
  tmp.innerHTML = htmlContent;
  document.body.appendChild(tmp);
  try {
    await new Promise(r => setTimeout(r, 100));
    const el = tmp.firstElementChild || tmp;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#fff', logging: false });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const a4H  = pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, a4H);
    return await window.guardarPDFEnDrive(pdf.output('blob'), expediente);
  } catch(e) {
    console.error('Drive auto-save:', e);
    return false;
  } finally {
    document.body.removeChild(tmp);
  }
}

// Advertir al cerrar si hay documentos sin respaldar en Drive
window.addEventListener('beforeunload', function(e) {
  const driveOn = document.getElementById('drive-status')?.classList.contains('status-on');
  if (!driveOn) return;
  const pending = ['justificantes','permisos','citatorios','reportes','visitas']
    .some(k => obtenerDatos(k).some(r => !r.driveSaved));
  if (pending) { e.preventDefault(); e.returnValue = ''; }
});

function copiarSQL() {
  const txt = document.getElementById('sql-content').textContent;
  navigator.clipboard.writeText(txt).then(() => mostrarToast('SQL copiado al portapapeles'));
}
