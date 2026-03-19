// ===== GOOGLE DRIVE (File System Access API) =====
// No requiere OAuth. El usuario selecciona su carpeta local de Google Drive
// y el app guarda PDFs ahí directamente. Drive Desktop los sube automáticamente.

let _driveHandle = null;

// ---- IndexedDB para persistir el handle entre sesiones ----
function _abrirIDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('orientacion-drive', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('handles');
    req.onsuccess = e => res(e.target.result);
    req.onerror = () => rej(req.error);
  });
}
async function _guardarHandleIDB(handle) {
  const db = await _abrirIDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(handle, 'drive-root');
    tx.oncomplete = res; tx.onerror = rej;
  });
}
async function _recuperarHandleIDB() {
  const db = await _abrirIDB();
  return new Promise(res => {
    const tx = db.transaction('handles', 'readonly');
    const req = tx.objectStore('handles').get('drive-root');
    req.onsuccess = () => res(req.result || null);
    req.onerror = () => res(null);
  });
}

// ---- Seleccionar carpeta ----
async function seleccionarCarpetaDrive() {
  if (!window.showDirectoryPicker) {
    mostrarToast('Tu navegador no soporta esta función. Usa Chrome o Edge.', 'error');
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'desktop' });
    _driveHandle = handle;
    await _guardarHandleIDB(handle);
    actualizarEstadoDrive(true, handle.name);
    mostrarToast(`Carpeta vinculada: "${handle.name}"`);
  } catch (e) {
    if (e.name !== 'AbortError') mostrarToast('No se pudo acceder a la carpeta', 'error');
  }
}

// ---- Verificar / restaurar handle ----
async function iniciarDrive() {
  try {
    const handle = await _recuperarHandleIDB();
    if (!handle) return;
    // Verificar que el permiso sigue activo
    const perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      _driveHandle = handle;
      actualizarEstadoDrive(true, handle.name);
    } else {
      actualizarEstadoDrive(false);
    }
  } catch { actualizarEstadoDrive(false); }
}

// ---- Guardar PDF en carpeta ----
// Estructura: EXPEDIENTES [CICLO] / [SEMESTRE] - [CARRERA] - [TURNO] / [APELLIDO PATERNO APELLIDO MATERNO NOMBRE]
window.guardarPDFEnDrive = async function(blob, alumno) {
  if (!_driveHandle) _driveHandle = await _recuperarHandleIDB();
  if (!_driveHandle) return false;

  try {
    let perm = await _driveHandle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') {
      perm = await _driveHandle.requestPermission({ mode: 'readwrite' });
      if (perm !== 'granted') { mostrarToast('Se necesita permiso para escribir en Drive', 'error'); return false; }
    }

    // Ciclo desde config
    const cfg = typeof obtenerConfig === 'function' ? obtenerConfig() : {};
    const ciclo = cfg.ciclo || '2025-2026';

    // Nombre del alumno: APELLIDO PATERNO APELLIDO MATERNO NOMBRE(S)
    // Buscar en caché para obtener apellidos separados
    const cache = window._alumnosCache || [];
    const aluCompleto = cache.find(a => a.noControl && a.noControl === alumno.noControl) || {};
    const apPat    = (aluCompleto.apellidoPaterno || '').toUpperCase().trim();
    const apMat    = (aluCompleto.apellidoMaterno || '').toUpperCase().trim();
    const nomProp  = (aluCompleto.nombrePropio || '').toUpperCase().trim();
    // Si no hay datos en caché, usar el nombre completo tal cual
    const nombreCarpeta = limpiarNombre(
      [apPat, apMat, nomProp].filter(Boolean).join(' ') || (alumno.nombre || 'SIN-NOMBRE').toUpperCase()
    );

    // Estructura: Expedientes [ciclo] / [NOMBRE ALUMNO]
    const dirRaiz = await _driveHandle.getDirectoryHandle(`Expedientes ${ciclo}`, { create: true });
    const dirAlu  = await dirRaiz.getDirectoryHandle(nombreCarpeta, { create: true });

    // Nombre del archivo: TIPO_FOLIO_FECHA.pdf
    const fecha    = new Date().toISOString().slice(0, 10);
    const tipo     = (alumno.tipo || 'documento').toUpperCase();
    const folio    = alumno.folio || alumno.noControl || 'SN';
    const fileName = `${tipo}_${folio}_${fecha}.pdf`;

    const fileHandle = await dirAlu.getFileHandle(fileName, { create: true });
    const writable   = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    mostrarToast(`Guardado en Drive: ${nombreCarpeta}`);
    return true;
  } catch (e) {
    console.error('Drive error:', e);
    mostrarToast('No se pudo guardar en Drive: ' + e.message, 'error');
    return false;
  }
};

// ---- Guardar cualquier archivo en una carpeta específica (sin subcarpetas) ----
window.guardarArchivoEnDrive = async function(blob, fileName, carpeta) {
  if (!_driveHandle) _driveHandle = await _recuperarHandleIDB();
  if (!_driveHandle) return false;
  try {
    let perm = await _driveHandle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') {
      perm = await _driveHandle.requestPermission({ mode: 'readwrite' });
      if (perm !== 'granted') { mostrarToast('Se necesita permiso para escribir en Drive', 'error'); return false; }
    }
    const dir = await _driveHandle.getDirectoryHandle(limpiarNombre(carpeta), { create: true });
    const fileHandle = await dir.getFileHandle(limpiarNombre(fileName), { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    mostrarToast(`Guardado: ${fileName}`);
    return true;
  } catch(e) {
    console.error('Drive error:', e);
    mostrarToast('No se pudo guardar en Drive: ' + e.message, 'error');
    return false;
  }
};

function limpiarNombre(str) {
  return str.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

// ---- UI de estado ----
function actualizarEstadoDrive(conectado, nombre) {
  const el = document.getElementById('drive-status');
  const txt = document.getElementById('drive-status-text');
  const btnDrive = document.getElementById('btn-guardar-drive');
  if (!el) return;
  if (conectado) {
    el.className = 'status-badge status-on';
    el.innerHTML = '<i class="fab fa-google-drive"></i> <span>Drive</span>';
    if (txt) txt.innerHTML = `<span style="color:#16a34a"><i class="fas fa-check-circle"></i> Vinculada: <strong>${nombre || 'carpeta seleccionada'}</strong></span>`;
    if (btnDrive) btnDrive.style.display = '';
  } else {
    el.className = 'status-badge status-off';
    el.innerHTML = '<i class="fab fa-google-drive"></i> <span>Sin Drive</span>';
    if (txt) txt.innerHTML = `<span style="color:#94a3b8">No vinculada</span>`;
    if (btnDrive) btnDrive.style.display = 'none';
  }
}

// Botón "Guardar en Drive" desde el modal de impresión
window.guardarEnDriveDesdeModal = async function() {
  const el = document.getElementById('doc-to-pdf');
  if (!el) { mostrarToast('No hay documento cargado', 'error'); return; }
  if (!_driveHandle) {
    mostrarToast('Primero vincula tu carpeta de Google Drive en Configuración', 'error');
    return;
  }
  const btn = document.getElementById('btn-guardar-drive');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  try {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#fff', logging: false });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, (canvas.height * pdfW) / canvas.width);
    const blob = pdf.output('blob');
    const alumno = window._expedienteAlumno || {};
    await window.guardarPDFEnDrive(blob, { ...alumno, tipo: _pdfTituloActual.split(' ')[0].toLowerCase() });
  } catch(e) {
    mostrarToast('Error: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fab fa-google-drive"></i> Guardar en Drive';
  }
};

// Auto-iniciar al cargar
document.addEventListener('DOMContentLoaded', iniciarDrive);
