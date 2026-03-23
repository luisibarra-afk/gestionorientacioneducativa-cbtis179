// ===== INTEGRACIÓN SUPABASE =====
// Sincronización en background. localStorage siempre es la fuente local.

let _sb = null; // cliente supabase

const SB_TABLES = {
  justificantes: 'justificantes',
  permisos: 'permisos',
  citatorios: 'citatorios',
  reportes: 'reportes',
  bitacora: 'bitacora',
  alumnos: 'alumnos'
};

// Mapeo de objetos JS (camelCase) a columnas DB (snake_case)
const COLUMN_MAP = {
  justificantes: {
    id:'id', folio:'folio', alumno:'alumno', noControl:'no_control', grado:'grado', grupo:'grupo',
    fechaAusencia:'fecha_ausencia', fechaExpedicion:'fecha_expedicion',
    tutor:'tutor', telefonoTutor:'telefono_tutor', motivo:'motivo',
    observaciones:'observaciones', validador:'validador'
  },
  permisos: {
    id:'id', folio:'folio', alumno:'alumno', noControl:'no_control', grado:'grado', grupo:'grupo',
    fecha:'fecha', hora:'hora', horaRegreso:'hora_regreso',
    persona:'persona', parentesco:'parentesco', telefono:'telefono',
    autoriza:'autoriza', validador:'validador', motivo:'motivo'
  },
  citatorios: {
    id:'id', folio:'folio', alumno:'alumno', noControl:'no_control', grado:'grado', grupo:'grupo',
    tutor:'tutor', telefonoTutor:'telefono_tutor', fechaCita:'fecha_cita',
    horaCita:'hora_cita', emite:'emite', validador:'validador',
    estado:'estado', motivo:'motivo', acuerdos:'acuerdos', fechaCreacion:'fecha_creacion'
  },
  reportes: {
    id:'id', folio:'folio', alumno:'alumno', noControl:'no_control', grado:'grado', grupo:'grupo',
    fecha:'fecha', tipoFalta:'tipo_falta', reporta:'reporta',
    descripcion:'descripcion', medida:'medida', seguimiento:'seguimiento'
  },
  bitacora: {
    id:'id', folio:'folio', tipo:'tipo', gravedad:'gravedad', fecha:'fecha',
    hora:'hora', lugar:'lugar', reporta:'reporta', involucrados:'involucrados',
    descripcion:'descripcion', acciones:'acciones', seguimiento:'seguimiento'
  },
  alumnos: {
    id:'id', noControl:'no_control', nombre:'nombre',
    apellidoPaterno:'apellido_paterno', apellidoMaterno:'apellido_materno',
    grado:'grado', grupo:'grupo', turno:'turno', curp:'curp',
    tutor:'tutor', telefonoTutor:'telefono_tutor'
  }
};

function jsToDb(modulo, obj) {
  const map = COLUMN_MAP[modulo];
  if (!map) return obj;
  const row = {};
  for (const [jsKey, dbCol] of Object.entries(map)) {
    if (obj[jsKey] !== undefined) row[dbCol] = obj[jsKey];
  }
  return row;
}

function dbToJs(modulo, row) {
  const map = COLUMN_MAP[modulo];
  if (!map) return row;
  const obj = {};
  for (const [jsKey, dbCol] of Object.entries(map)) {
    if (row[dbCol] !== undefined) obj[jsKey] = row[dbCol];
  }
  return obj;
}

function iniciarSupabase(url, key) {
  try {
    _sb = window.supabase.createClient(url, key);
    // Prueba de conexión
    _sb.from('justificantes').select('id').limit(1).then(({ error }) => {
      if (error) {
        console.error('Supabase error:', error.message);
        setSupabaseStatus(false, error.message);
        mostrarToast('Error de conexión Supabase: ' + error.message, 'error');
      } else {
        setSupabaseStatus(true);
        mostrarToast('Supabase conectado correctamente');
        // Cargar padrón primero (lo necesita el autocomplete), luego el resto
        sbPullModulo('alumnos').then(() => {
          // Si hay un autocomplete abierto esperando, reintentarlo
          document.querySelectorAll('input[id$="-dropdown"]').forEach(() => {});
          const inputsAC = document.querySelectorAll('.autocomplete-dropdown');
          inputsAC.forEach(dd => {
            if (dd.textContent.includes('Cargando padrón')) {
              const inputId = dd.id.replace('-dropdown', '');
              const inp = document.getElementById(inputId);
              if (inp && inp.value.trim()) inp.dispatchEvent(new Event('input'));
            }
          });
          // Luego el resto de módulos en background
          window.sbPullAll();
        });
      }
    });
  } catch (e) {
    console.error('Supabase init error:', e);
    mostrarToast('Error al iniciar Supabase: ' + e.message, 'error');
  }
}

function setSupabaseStatus(connected, _msg) {
  const el = document.getElementById('supabase-status');
  const info = document.getElementById('supabase-connected-info');
  if (!el) return;
  if (connected) {
    el.className = 'status-badge status-on';
    el.innerHTML = '<i class="fas fa-cloud"></i> <span>BD Activa</span>';
    if (info) info.classList.remove('hidden');
  } else {
    el.className = 'status-badge status-off';
    el.innerHTML = '<i class="fas fa-cloud"></i> <span>Sin BD</span>';
    if (info) info.classList.add('hidden');
  }
}

// Sync: guarda/actualiza un registro en Supabase
async function sbUpsertRegistro(modulo, registro) {
  if (!_sb) return;
  const table = SB_TABLES[modulo];
  if (!table) return;
  const row = jsToDb(modulo, registro);
  const { error } = await _sb.from(table).upsert(row, { onConflict: 'id' });
  if (error) console.error(`Supabase upsert [${modulo}]:`, error.message);
}

// Sync: elimina un registro de Supabase
async function sbDeleteRegistro(modulo, id) {
  if (!_sb) return;
  const table = SB_TABLES[modulo];
  if (!table) return;
  const { error } = await _sb.from(table).delete().eq('id', id);
  if (error) console.error(`Supabase delete [${modulo}]:`, error.message);
}

// Pull: descarga todos los datos de una tabla desde Supabase
async function sbPullModulo(modulo) {
  if (!_sb) return;
  const table = SB_TABLES[modulo];
  if (!table) return;
  const { data, error } = await _sb.from(table).select('*').order('created_at', { ascending: false });
  if (error) { console.error(`Supabase pull [${modulo}]:`, error.message); return; }
  if (data && data.length > 0) {
    const mapped = data.map(row => dbToJs(modulo, row));
    localStorage.setItem(modulo, JSON.stringify(mapped));
    // Re-render si la página está activa
    const renders = {
      justificantes: () => typeof renderJustificantes === 'function' && renderJustificantes(),
      permisos: () => typeof renderPermisos === 'function' && renderPermisos(),
      citatorios: () => typeof renderCitatorios === 'function' && renderCitatorios(),
      reportes: () => typeof renderReportes === 'function' && renderReportes(),
      bitacora: () => typeof renderBitacora === 'function' && renderBitacora(),
      alumnos: () => { if (typeof renderAlumnos === 'function') renderAlumnos(); if (typeof refreshAlumnosCache === 'function') refreshAlumnosCache(); }
    };
    if (renders[modulo]) renders[modulo]();
  }
}

// Exponer sbPullModulo globalmente para que el autocomplete pueda refrescar alumnos
window.sbPullModulo = sbPullModulo;

// Pull: descarga todos los módulos
window.sbPullAll = async function() {
  if (!_sb) return;
  for (const modulo of Object.keys(SB_TABLES)) {
    await sbPullModulo(modulo);
  }
  if (typeof actualizarStats === 'function') actualizarStats();
  if (typeof actualizarActividad === 'function') actualizarActividad();
};

// Función de sync que se llama desde guardarDatos() en utils.js
// Solo sincroniza el registro más reciente (índice 0) o ejecuta upsert de todos
window.sbSync = function(modulo, data) {
  if (!_sb || !SB_TABLES[modulo]) return;
  if (!data || !data.length) return;
  // Upsert del primer elemento (el más reciente modificado)
  sbUpsertRegistro(modulo, data[0]);
};

// Función para eliminar de Supabase (llamada explícita desde los módulos)
window.sbDelete = function(modulo, id) {
  sbDeleteRegistro(modulo, id);
};

// Bulk upsert de alumnos (por lotes de 100)
window.sbBulkUpsertAlumnos = async function(alumnos) {
  if (!_sb) return;
  const batch = 100;
  for (let i = 0; i < alumnos.length; i += batch) {
    const chunk = alumnos.slice(i, i + batch).map(a => jsToDb('alumnos', a));
    const { error } = await _sb.from('alumnos').upsert(chunk, { onConflict: 'no_control' });
    if (error) console.error('Supabase bulk alumnos:', error.message);
  }
};

// Auto-iniciar si ya hay config guardada
(function() {
  const cfg = JSON.parse(localStorage.getItem('config') || '{}');
  if (cfg.sbUrl && cfg.sbKey) {
    // Esperar a que el DOM esté listo
    setTimeout(() => iniciarSupabase(cfg.sbUrl, cfg.sbKey), 500);
  }
})();
