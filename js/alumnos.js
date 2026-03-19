// ===== MÓDULO ALUMNOS + EXPEDIENTE =====

const KEY_ALU = 'alumnos';

// Alias de columnas para importación CSV (case-insensitive)
const CSV_ALIASES = {
  noControl:      ['no_control','numero_control','num_control','control','matricula','no control','num control','número de control','no. control'],
  nombre:         ['nombre','name','nombres','nombre completo','nombre_completo'],
  apellidoPaterno:['apellido_paterno','paterno','primer apellido','ape_pat','apellido paterno','a_paterno'],
  apellidoMaterno:['apellido_materno','materno','segundo apellido','ape_mat','apellido materno','a_materno'],
  grado:          ['grado','grade','año','year','grado escolar','semestre','sem','semester','periodo'],
  grupo:          ['grupo','group','seccion','sección','section','salon'],
  especialidad:   ['especialidad','carrera','especialidad técnica','esp','especialization','area'],
  tutor:          ['tutor','padre','madre','nombre_tutor','nombre tutor','tutor/a','responsable'],
  telefonoTutor:  ['telefono','telefono_tutor','tel','phone','celular','cel','tel. tutor','teléfono'],
  curp:           ['curp'],
  emailTutor:     ['email','correo','email_tutor','correo tutor','correo_tutor'],
  turno:          ['turno','turn','shift']
};

// ===== RENDER =====
function renderAlumnos(datos) {
  const tbody = document.getElementById('tbody-alumnos');
  if (!datos) datos = obtenerDatos(KEY_ALU);
  if (!datos.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No hay alumnos registrados. Importa un CSV o agrega manualmente.</td></tr>';
    return;
  }
  tbody.innerHTML = datos.map((a) => {
    const nombre = a.nombre || [a.apellidoPaterno, a.apellidoMaterno].filter(Boolean).join(' ');
    return `<tr>
      <td><span class="folio-tag">${a.noControl || '-'}</span></td>
      <td><strong>${nombre}</strong></td>
      <td>${a.grado || ''} ${a.grupo || ''}${a.especialidad?'<br><small style="color:#64748b">'+a.especialidad+'</small>':''}</td>
      <td>${a.turno || '-'}</td>
      <td>${a.tutor || '-'}</td>
      <td>${a.telefonoTutor || '-'}</td>
      <td>
        <div class="btn-actions">
          <button class="btn-icon view" title="Ver Expediente" onclick="verExpediente('${a.id}')"><i class="fas fa-folder-open"></i></button>
          <button class="btn-icon edit" title="Editar" onclick="editarAlumno('${a.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete" title="Eliminar" onclick="eliminarAlumno('${a.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ===== FORMULARIO =====
function formularioAlumno(d = {}) {
  return `
    <div class="form-grid">
      <div class="form-group">
        <label>Número de Control *</label>
        <input type="text" id="a-control" class="form-control" value="${d.noControl || ''}" placeholder="Ej: 2026001">
      </div>
      <div class="form-group">
        <label>Nombre(s) *</label>
        <input type="text" id="a-nombre" class="form-control" value="${d.nombre || ''}" placeholder="Nombre(s) del alumno">
      </div>
      <div class="form-group">
        <label>Apellido Paterno</label>
        <input type="text" id="a-paterno" class="form-control" value="${d.apellidoPaterno || ''}">
      </div>
      <div class="form-group">
        <label>Apellido Materno</label>
        <input type="text" id="a-materno" class="form-control" value="${d.apellidoMaterno || ''}">
      </div>
      <div class="form-group">
        <label>Semestre</label>
        <select id="a-grado" class="form-control">
          ${['1°','2°','3°','4°','5°','6°'].map(g=>`<option ${d.grado===g?'selected':''}>${g}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Grupo</label>
        <input type="text" id="a-grupo" class="form-control" value="${d.grupo || ''}" placeholder="2AMARH, 3B...">
      </div>
      <div class="form-group">
        <label>Turno</label>
        <select id="a-turno" class="form-control">
          ${['Matutino','Vespertino','Nocturno'].map(t=>`<option ${d.turno===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Especialidad</label>
        <input type="text" id="a-especialidad" class="form-control" value="${d.especialidad || ''}" placeholder="Ej: Administración, Informática...">
      </div>
      <div class="form-group">
        <label>CURP</label>
        <input type="text" id="a-curp" class="form-control" value="${d.curp || ''}" placeholder="CURP del alumno" style="text-transform:uppercase">
      </div>
      <div class="form-group">
        <label>Padre / Madre / Tutor</label>
        <input type="text" id="a-tutor" class="form-control" value="${d.tutor || ''}" placeholder="Nombre completo">
      </div>
      <div class="form-group">
        <label>Teléfono del Tutor</label>
        <input type="tel" id="a-telefono" class="form-control" value="${d.telefonoTutor || ''}" placeholder="10 dígitos">
      </div>
      <div class="form-group">
        <label>Correo del Tutor</label>
        <input type="email" id="a-email" class="form-control" value="${d.emailTutor || ''}" placeholder="correo@ejemplo.com">
      </div>
    </div>`;
}

function _leerFormAlumno(item = {}) {
  const nombre = document.getElementById('a-nombre').value.trim();
  const paterno = document.getElementById('a-paterno').value.trim();
  const materno = document.getElementById('a-materno').value.trim();
  // Nombre completo para búsqueda: Paterno Materno Nombre(s)
  const nombreCompleto = [paterno, materno, nombre].filter(Boolean).join(' ');
  return {
    ...item,
    noControl: document.getElementById('a-control').value.trim(),
    nombre: nombreCompleto || nombre,
    nombrePropio: nombre,
    apellidoPaterno: paterno,
    apellidoMaterno: materno,
    grado: document.getElementById('a-grado').value,
    grupo: document.getElementById('a-grupo').value.trim().toUpperCase(),
    turno: document.getElementById('a-turno').value,
    especialidad: document.getElementById('a-especialidad').value.trim(),
    curp: document.getElementById('a-curp').value.trim().toUpperCase(),
    tutor: document.getElementById('a-tutor').value.trim(),
    telefonoTutor: document.getElementById('a-telefono').value.trim(),
    emailTutor: document.getElementById('a-email').value.trim()
  };
}

// ===== CRUD =====
function nuevoAlumno() {
  abrirModal('Nuevo Alumno', formularioAlumno(), function() {
    const noControl = document.getElementById('a-control').value.trim();
    const nombre = document.getElementById('a-nombre').value.trim();
    if (!noControl || !nombre) { mostrarToast('Número de control y nombre son obligatorios', 'error'); return; }
    const datos = obtenerDatos(KEY_ALU);
    if (datos.find(a => a.noControl === noControl)) { mostrarToast('Ese número de control ya existe', 'error'); return; }
    const nuevo = { id: genId(), ..._leerFormAlumno() };
    datos.unshift(nuevo);
    guardarDatos(KEY_ALU, datos);
    refreshAlumnosCache();
    if (window.sbSync) window.sbSync(KEY_ALU, datos);
    cerrarModal();
    renderAlumnos();
    actualizarStats();
    mostrarToast('Alumno registrado');
  });
}

function editarAlumno(id) {
  const datos = obtenerDatos(KEY_ALU);
  const item = datos.find(x => x.id === id);
  if (!item) return;
  abrirModal('Editar Alumno', formularioAlumno(item), function() {
    const noControl = document.getElementById('a-control').value.trim();
    if (!noControl) { mostrarToast('Número de control obligatorio', 'error'); return; }
    // Check duplicate control (except itself)
    const dup = datos.find(a => a.noControl === noControl && a.id !== id);
    if (dup) { mostrarToast('Ese número de control ya existe', 'error'); return; }
    Object.assign(item, _leerFormAlumno(item));
    guardarDatos(KEY_ALU, datos);
    refreshAlumnosCache();
    if (window.sbSync) window.sbSync(KEY_ALU, [item]);
    cerrarModal();
    renderAlumnos();
    mostrarToast('Alumno actualizado');
  });
}

function eliminarAlumno(id) {
  if (!confirm('¿Eliminar este alumno? No se eliminarán sus documentos existentes.')) return;
  guardarDatos(KEY_ALU, obtenerDatos(KEY_ALU).filter(x => x.id !== id));
  if (window.sbDelete) window.sbDelete(KEY_ALU, id);
  refreshAlumnosCache();
  renderAlumnos();
  actualizarStats();
  mostrarToast('Alumno eliminado');
}

// ===== IMPORTAR CSV =====
function importarCSVAlumnos() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.txt';
  input.onchange = async function() {
    const file = this.files[0];
    if (!file) return;
    mostrarToast('Leyendo archivo...');
    const text = await file.text();
    const resultado = parsearCSV(text);
    if (!resultado.length) { mostrarToast('No se encontraron datos válidos en el CSV', 'error'); return; }
    previsualizarImportacion(resultado);
  };
  input.click();
}

function parsearCSV(text) {
  // Detectar delimitador
  const lineas = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lineas.length < 2) return [];
  const firstLine = lineas[0];
  const delim = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

  // Parsear cabecera
  const headers = parsearLineaCSV(firstLine, delim).map(h => h.toLowerCase().trim());

  // Mapear cabeceras a campos
  const fieldMap = {};
  for (const [field, aliases] of Object.entries(CSV_ALIASES)) {
    for (const alias of aliases) {
      const idx = headers.indexOf(alias);
      if (idx >= 0) { fieldMap[field] = idx; break; }
    }
  }

  // Si no hay no_control ni nombre, intentar por posición
  if (fieldMap.noControl === undefined && fieldMap.nombre === undefined) {
    mostrarToast('No se reconocieron las columnas. Asegúrate que el CSV tenga encabezados como: no_control, nombre, grado, grupo, tutor, telefono', 'error');
    return [];
  }

  // Parsear filas
  const resultado = [];
  for (let i = 1; i < lineas.length; i++) {
    const cols = parsearLineaCSV(lineas[i], delim);
    if (cols.every(c => !c.trim())) continue;
    const obj = {};
    for (const [field, idx] of Object.entries(fieldMap)) {
      obj[field] = (cols[idx] || '').trim();
    }
    // Normalizar grado (1 -> 1°, etc.)
    if (obj.grado && !obj.grado.includes('°')) {
      obj.grado = obj.grado.replace(/[°ºo]/g, '').trim() + '°';
    }
    obj.grupo = (obj.grupo || '').toUpperCase();
    obj.curp = (obj.curp || '').toUpperCase();
    // Nombre completo
    if (!obj.nombre) {
      obj.nombre = [obj.apellidoPaterno, obj.apellidoMaterno].filter(Boolean).join(' ');
    }
    if (obj.noControl || obj.nombre) resultado.push(obj);
  }
  return resultado;
}

function parsearLineaCSV(linea, delim) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function previsualizarImportacion(registros) {
  const muestra = registros.slice(0, 5);
  const html = `
    <div style="font-size:13px;margin-bottom:14px">
      <strong>${registros.length}</strong> alumnos encontrados en el archivo. Vista previa de los primeros 5:
    </div>
    <div style="overflow-x:auto">
      <table class="data-table" style="font-size:12px">
        <thead><tr><th>No. Control</th><th>Nombre</th><th>Grado</th><th>Grupo</th><th>Tutor</th><th>Tel.</th></tr></thead>
        <tbody>
          ${muestra.map(a => `<tr>
            <td>${a.noControl||'-'}</td>
            <td>${a.nombre||'-'}</td>
            <td>${a.grado||'-'}</td>
            <td>${a.grupo||'-'}</td>
            <td>${a.tutor||'-'}</td>
            <td>${a.telefonoTutor||'-'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p style="margin-top:14px;font-size:12px;color:#64748b">Los registros existentes (mismo número de control) serán actualizados.</p>`;

  abrirModal(`Importar ${registros.length} alumnos`, html, function() {
    ejecutarImportacion(registros);
  });
  document.getElementById('modal-save').textContent = `Importar ${registros.length} alumnos`;
}

function ejecutarImportacion(registros) {
  const existentes = obtenerDatos(KEY_ALU);
  const mapaExistentes = {};
  existentes.forEach(a => { if (a.noControl) mapaExistentes[a.noControl] = a; });

  let nuevos = 0, actualizados = 0;
  registros.forEach(r => {
    if (mapaExistentes[r.noControl]) {
      Object.assign(mapaExistentes[r.noControl], r);
      actualizados++;
    } else {
      existentes.push({ id: genId(), ...r });
      nuevos++;
    }
  });

  guardarDatos(KEY_ALU, existentes);
  refreshAlumnosCache();

  // Sync a Supabase en lotes de 100
  if (window.sbBulkUpsertAlumnos) window.sbBulkUpsertAlumnos(existentes);

  cerrarModal();
  renderAlumnos();
  actualizarStats();
  mostrarToast(`✓ ${nuevos} nuevos, ${actualizados} actualizados`);
}

// ===== CACHE PARA AUTOCOMPLETE =====
function refreshAlumnosCache() {
  window._alumnosCache = obtenerDatos(KEY_ALU);
}

// ===== EXPEDIENTE =====
function verExpediente(alumnoId) {
  const alumnos = obtenerDatos(KEY_ALU);
  const a = alumnos.find(x => x.id === alumnoId);
  if (!a) return;

  const nombreAlu = a.nombre || [a.apellidoPaterno, a.apellidoMaterno].filter(Boolean).join(' ');

  function buscarEnModulo(modulo) {
    return obtenerDatos(modulo).filter(r =>
      (r.noControl && r.noControl === a.noControl) ||
      (r.alumno && r.alumno === nombreAlu) ||
      (r.alumno && r.alumno.toLowerCase().includes(nombreAlu.toLowerCase().split(' ')[0]))
    );
  }

  const just = buscarEnModulo('justificantes');
  const perm = buscarEnModulo('permisos');
  const cit  = buscarEnModulo('citatorios');
  const rep  = buscarEnModulo('reportes');

  const cfg = obtenerConfig();

  // Guardar referencia para PDF
  window._expedienteAlumno = { noControl: a.noControl, nombre: nombreAlu, grado: a.grado, grupo: a.grupo };

  const htmlExp = `
    <div id="expediente-doc" style="font-family:'Segoe UI',system-ui,sans-serif">
      <!-- Encabezado del expediente -->
      <div class="exp-header">
        <div class="exp-school">${cfg.plantel}</div>
        <div class="exp-title">EXPEDIENTE DEL ALUMNO</div>
        <div class="exp-ciclo">Ciclo Escolar ${cfg.ciclo} &nbsp;|&nbsp; Turno: ${cfg.turno}</div>
      </div>

      <!-- Ficha del alumno -->
      <div class="exp-ficha">
        <div class="exp-avatar">${(nombreAlu[0]||'A').toUpperCase()}</div>
        <div class="exp-ficha-datos">
          <h2>${nombreAlu}</h2>
          <div class="exp-ficha-grid">
            <span><i class="fas fa-id-card"></i> No. Control: <strong>${a.noControl || '-'}</strong></span>
            <span><i class="fas fa-graduation-cap"></i> Grado: <strong>${a.grado || '-'} ${a.grupo || ''}</strong></span>
            <span><i class="fas fa-clock"></i> Turno: <strong>${a.turno || '-'}</strong></span>
            ${a.curp ? `<span><i class="fas fa-fingerprint"></i> CURP: <strong>${a.curp}</strong></span>` : ''}
            ${a.tutor ? `<span><i class="fas fa-user-friends"></i> Tutor: <strong>${a.tutor}</strong></span>` : ''}
            ${a.telefonoTutor ? `<span><i class="fas fa-phone"></i> Tel: <strong>${a.telefonoTutor}</strong></span>` : ''}
          </div>
        </div>
        <div class="exp-counters">
          <div class="exp-count" style="border-color:#2563eb"><span>${just.length}</span><small>Justificantes</small></div>
          <div class="exp-count" style="border-color:#16a34a"><span>${perm.length}</span><small>Permisos</small></div>
          <div class="exp-count" style="border-color:#ea580c"><span>${cit.length}</span><small>Citatorios</small></div>
          <div class="exp-count" style="border-color:#dc2626"><span>${rep.length}</span><small>Reportes</small></div>
        </div>
      </div>

      ${seccionExpediente('Justificantes de Inasistencia', 'fa-file-medical', '#2563eb', just, [
        {k:'folio',l:'Folio'}, {k:'fechaAusencia',l:'Fecha',f:'fecha'}, {k:'motivo',l:'Motivo'}, {k:'validador',l:'Validó'}
      ])}
      ${seccionExpediente('Permisos de Salida', 'fa-door-open', '#16a34a', perm, [
        {k:'folio',l:'Folio'}, {k:'fecha',l:'Fecha',f:'fecha'}, {k:'hora',l:'Hora'}, {k:'motivo',l:'Motivo'}, {k:'validador',l:'Validó'}
      ])}
      ${seccionExpediente('Citatorios', 'fa-envelope-open-text', '#ea580c', cit, [
        {k:'folio',l:'Folio'}, {k:'fechaCita',l:'Cita',f:'fecha'}, {k:'motivo',l:'Motivo'},
        {k:'estado',l:'Estado'}, {k:'validador',l:'Validó'}
      ])}
      ${seccionExpediente('Reportes de Indisciplina', 'fa-exclamation-triangle', '#dc2626', rep, [
        {k:'folio',l:'Folio'}, {k:'fecha',l:'Fecha',f:'fecha'}, {k:'tipoFalta',l:'Tipo'},
        {k:'descripcion',l:'Descripción'}, {k:'medida',l:'Medida'}
      ])}
    </div>`;

  document.getElementById('exp-body').innerHTML = htmlExp;
  document.getElementById('exp-titulo').textContent = `Expediente — ${nombreAlu}`;
  PAGE_TITLES['expediente'] = `Expediente — ${nombreAlu}`;
  navegarA('expediente');
}

function seccionExpediente(titulo, icono, color, registros, columnas) {
  if (!registros.length) return `
    <div class="exp-seccion">
      <div class="exp-seccion-header" style="border-left:4px solid ${color}">
        <i class="fas ${icono}" style="color:${color}"></i> ${titulo}
      </div>
      <p class="exp-empty">Sin registros</p>
    </div>`;

  const thead = columnas.map(c => `<th>${c.l}</th>`).join('');
  const tbody = registros.map(r => `<tr>${columnas.map(c => {
    let val = r[c.k] || '-';
    if (c.f === 'fecha') val = formatFecha(r[c.k]);
    if (typeof val === 'string' && val.length > 50) val = val.slice(0,50) + '…';
    return `<td>${val}</td>`;
  }).join('')}</tr>`).join('');

  return `
    <div class="exp-seccion">
      <div class="exp-seccion-header" style="border-left:4px solid ${color}">
        <i class="fas ${icono}" style="color:${color}"></i> ${titulo}
        <span class="exp-badge" style="background:${color}">${registros.length}</span>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table" style="font-size:12px">
          <thead><tr>${thead}</tr></thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>
    </div>`;
}

async function generarExpedientePDF() {
  const el = document.getElementById('expediente-doc');
  if (!el) { mostrarToast('No hay expediente cargado', 'error'); return; }
  const btn = document.getElementById('btn-exp-pdf');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...'; }
  try {
    const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', logging: false });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pdfW) / canvas.width;
    let posY = 0;
    let pagina = 0;
    while (posY < imgH) {
      if (pagina > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -posY, pdfW, imgH);
      posY += pdfH;
      pagina++;
    }
    const a = window._expedienteAlumno || {};
    const nombre = `Expediente-${a.noControl || 'alumno'}-${(a.nombre || 'desconocido').replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9 ]/g,'').trim()}`;
    const blob = pdf.output('blob');
    pdf.save(`${nombre}.pdf`);

    // Intentar guardar en Drive si está vinculado
    if (window.guardarPDFEnDrive) {
      await window.guardarPDFEnDrive(blob, { ...a, tipo: 'expediente' });
    }
    mostrarToast('Expediente PDF generado');
  } catch(e) {
    mostrarToast('Error al generar PDF: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-pdf"></i> Descargar PDF'; }
  }
}

// ===== INIT =====
function initAlumnos() {
  document.getElementById('btn-nuevo-alumno').addEventListener('click', nuevoAlumno);
  document.getElementById('btn-importar-csv').addEventListener('click', importarCSVAlumnos);
  filtrarTabla('search-alumnos', 'tbody-alumnos');
  renderAlumnos();
  refreshAlumnosCache();
}
