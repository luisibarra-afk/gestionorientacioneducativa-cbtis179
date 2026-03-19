// ===== CONFIGURACIÓN DEL PLANTEL =====

const ORIENTADORES_DEFAULT = [
  'María Butrón Venegas',
  'Luis Eduardo Ibarra Hernández',
  'Ivonne Teresa Ortega Alfaro',
  'Alfredo Pérez Torres'
];

function obtenerConfig() {
  return JSON.parse(localStorage.getItem('config') || JSON.stringify({
    plantel: 'Centro de Bachillerato Tecnológico Industrial y de Servicios No. 179',
    cct: '13DCT0001K',
    director: '',
    ciclo: '2025-2026',
    turno: 'Matutino',
    direccion: 'Calle Adolfo Lugo Verduzco No. 105 Col La Cañada, carretera México-Tuxpan km 144, cp 43615 Tulancingo de Bravo Hgo.',
    telefonos: '7757535520 y 7757554420',
    correo: 'cbtis179.dir@uemstis.sems.gob.mx',
    sitio: 'https://www.facebook.com/cbtis179',
    orientadores: ORIENTADORES_DEFAULT
  }));
}

function guardarConfig() {
  const prev = obtenerConfig();
  const cfg = {
    plantel: document.getElementById('cfg-plantel').value.trim() || 'Plantel Educativo',
    cct: document.getElementById('cfg-cct').value.trim(),
    director: document.getElementById('cfg-director').value.trim(),
    ciclo: document.getElementById('cfg-ciclo').value.trim() || '2025-2026',
    turno: document.getElementById('cfg-turno').value,
    direccion: document.getElementById('cfg-direccion').value.trim(),
    telefonos: document.getElementById('cfg-telefonos').value.trim(),
    correo: document.getElementById('cfg-correo').value.trim(),
    sitio: document.getElementById('cfg-sitio').value.trim(),
    orientadores: prev.orientadores || ORIENTADORES_DEFAULT,
    sbUrl: prev.sbUrl || '',
    sbKey: prev.sbKey || ''
  };
  localStorage.setItem('config', JSON.stringify(cfg));
  actualizarBadgeOrientador();
  mostrarToast('Configuración guardada');
}

function guardarConfigSupabase() {
  const cfg = obtenerConfig();
  cfg.sbUrl = document.getElementById('cfg-sb-url').value.trim();
  cfg.sbKey = document.getElementById('cfg-sb-key').value.trim();
  localStorage.setItem('config', JSON.stringify(cfg));
  if (cfg.sbUrl && cfg.sbKey) {
    iniciarSupabase(cfg.sbUrl, cfg.sbKey);
  } else {
    mostrarToast('Introduce URL y Key de Supabase', 'error');
  }
}

function cargarFormConfig() {
  const cfg = obtenerConfig();
  document.getElementById('cfg-plantel').value = cfg.plantel || '';
  document.getElementById('cfg-cct').value = cfg.cct || '';
  document.getElementById('cfg-director').value = cfg.director || '';
  document.getElementById('cfg-ciclo').value = cfg.ciclo || '2025-2026';
  document.getElementById('cfg-turno').value = cfg.turno || 'Matutino';
  document.getElementById('cfg-direccion').value = cfg.direccion || '';
  document.getElementById('cfg-telefonos').value = cfg.telefonos || '';
  document.getElementById('cfg-correo').value = cfg.correo || '';
  document.getElementById('cfg-sitio').value = cfg.sitio || '';
  if (cfg.sbUrl) document.getElementById('cfg-sb-url').value = cfg.sbUrl;
  if (cfg.sbKey) document.getElementById('cfg-sb-key').value = cfg.sbKey;
  renderOrientadoresList();
}

function renderOrientadoresList() {
  const cfg = obtenerConfig();
  const lista = cfg.orientadores || ORIENTADORES_DEFAULT;
  const cont = document.getElementById('orientadores-list');
  if (!cont) return;
  cont.innerHTML = lista.map((o, i) => `
    <div class="orientador-item">
      <span class="orientador-badge"><i class="fas fa-user-tie"></i></span>
      <input type="text" class="form-control" value="${o}" id="ori-${i}" placeholder="Nombre del orientador">
      <button class="btn-icon delete" onclick="eliminarOrientador(${i})" title="Eliminar"><i class="fas fa-times"></i></button>
    </div>`).join('') +
    `<button class="btn btn-outline" style="margin-top:10px" onclick="agregarOrientador()">
      <i class="fas fa-plus"></i> Agregar orientador
    </button>
    <button class="btn btn-primary" style="margin-top:10px;margin-left:8px" onclick="guardarOrientadores()">
      <i class="fas fa-save"></i> Guardar orientadores
    </button>`;
}

function guardarOrientadores() {
  const cfg = obtenerConfig();
  const items = document.querySelectorAll('[id^="ori-"]');
  cfg.orientadores = Array.from(items).map(i => i.value.trim()).filter(Boolean);
  localStorage.setItem('config', JSON.stringify(cfg));
  mostrarToast('Orientadores guardados');
  actualizarBadgeOrientador();
}

function eliminarOrientador(idx) {
  const cfg = obtenerConfig();
  cfg.orientadores.splice(idx, 1);
  localStorage.setItem('config', JSON.stringify(cfg));
  renderOrientadoresList();
}

function agregarOrientador() {
  const cfg = obtenerConfig();
  cfg.orientadores.push('');
  localStorage.setItem('config', JSON.stringify(cfg));
  renderOrientadoresList();
  const last = document.querySelectorAll('[id^="ori-"]');
  if (last.length) last[last.length - 1].focus();
}

function actualizarBadgeOrientador() {
  const usuario = getUsuarioActual();
  const el = document.getElementById('badge-orientador');
  if (el && usuario) el.textContent = usuario.nombre;
}

function guardarPasswords() {
  const campos = { maria: 'pass-maria', luis: 'pass-luis', ivonne: 'pass-ivonne', alfredo: 'pass-alfredo' };
  let cambiados = 0;
  for (const [id, inputId] of Object.entries(campos)) {
    const val = document.getElementById(inputId)?.value.trim();
    if (val) { cambiarPassword(id, val); cambiados++; document.getElementById(inputId).value = ''; }
  }
  if (cambiados > 0) mostrarToast(`${cambiados} contraseña(s) actualizada(s)`);
  else mostrarToast('No se ingresó ninguna contraseña nueva', 'error');
}

function sincronizarManual() {
  if (window.sbPullAll) {
    window.sbPullAll().then(() => mostrarToast('Datos sincronizados desde Supabase'));
  } else {
    mostrarToast('Supabase no está conectado', 'error');
  }
}
