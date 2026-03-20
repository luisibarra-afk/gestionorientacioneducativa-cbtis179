// ===== APLICACIÓN PRINCIPAL =====

document.addEventListener('DOMContentLoaded', function () {

  // ---- VERIFICAR SESIÓN ----
  const usuario = checkAuth();
  if (!usuario) return; // checkAuth redirige si no hay sesión

  // ---- CONFIGURAR INTERFAZ SEGÚN ROL ----
  const badges = { 'av-1': '#2563eb', 'av-2': '#6366f1', 'av-3': '#ec4899', 'av-4': '#f59e0b' };
  const avatarEl = document.getElementById('user-avatar-sm');
  if (avatarEl) {
    avatarEl.textContent = usuario.iniciales || '?';
    avatarEl.style.background = badges[usuario.avatar] || '#64748b';
  }
  const badgeEl = document.getElementById('badge-orientador');
  if (badgeEl) badgeEl.textContent = usuario.nombre || 'Orientador(a)';

  // Mostrar corona si es admin
  if (usuario.rol === 'admin') {
    const crown = document.getElementById('admin-crown-badge');
    if (crown) crown.classList.remove('hidden');
    // Mostrar menú configuración solo para admin
    const menuCfg = document.getElementById('menu-config');
    if (menuCfg) menuCfg.classList.remove('hidden');
  }

  // Botón logout
  document.getElementById('btn-logout').addEventListener('click', function () {
    if (confirm('¿Cerrar sesión?')) logout();
  });

  // Fecha en sidebar
  const now = new Date();
  document.getElementById('current-date').textContent =
    now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Inicializar módulos
  initJustificantes();
  initPermisos();
  initCitatorios();
  initReportes();
  initBitacora();
  initVisitas();
  initAlumnos();
  if (usuario.rol === 'admin') cargarFormConfig();
  actualizarStats();
  actualizarActividad();

  // Navegación
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = this.dataset.page;
      // Bloquear configuración para no-admins
      if (page === 'configuracion' && !esAdmin()) {
        mostrarToast('Solo el administrador puede acceder a Configuración', 'error');
        return;
      }
      navegarA(page);
    });
  });

  // Stat cards clickeables
  document.querySelectorAll('.stat-card[data-page]').forEach(card => {
    card.addEventListener('click', function () { navegarA(this.dataset.page); });
  });

  // Toggle sidebar
  document.getElementById('toggle-sidebar').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('main-content').classList.toggle('expanded');
  });

  // Cerrar modales
  document.getElementById('modal-close').addEventListener('click', cerrarModal);
  document.getElementById('modal-cancel').addEventListener('click', cerrarModal);
  document.getElementById('print-close').addEventListener('click', cerrarPrint);
  document.getElementById('print-cancel').addEventListener('click', cerrarPrint);

  // Solo cerrar si mousedown Y mouseup ocurrieron sobre el overlay (no al soltar después de seleccionar texto)
  let _mdModal = false, _mdPrint = false;
  document.getElementById('modal-overlay').addEventListener('mousedown', function (e) { _mdModal = e.target === this; });
  document.getElementById('modal-overlay').addEventListener('mouseup',   function (e) { if (_mdModal && e.target === this) cerrarModal(); _mdModal = false; });
  document.getElementById('print-overlay').addEventListener('mousedown', function (e) { _mdPrint = e.target === this; });
  document.getElementById('print-overlay').addEventListener('mouseup',   function (e) { if (_mdPrint && e.target === this) cerrarPrint(); _mdPrint = false; });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { cerrarModal(); cerrarPrint(); }
  });
});

const PAGE_TITLES = {
  dashboard: 'Panel Principal',
  justificantes: 'Justificantes',
  permisos: 'Permisos de Salida',
  citatorios: 'Citatorios',
  reportes: 'Reportes de Indisciplina',
  bitacora: 'Bitácora de Seguridad',
  visitas: 'Visitas en el Aula',
  alumnos: 'Alumnos / Padrón',
  expediente: 'Expediente del Alumno',
  configuracion: 'Configuración'
};

function navegarA(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  const link = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (link) link.classList.add('active');
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;
  if (page === 'dashboard') { actualizarStats(); actualizarActividad(); }
  if (page === 'configuracion') cargarFormConfig();
}

function actualizarStats() {
  document.getElementById('stat-justificantes').textContent = obtenerDatos('justificantes').length;
  document.getElementById('stat-permisos').textContent = obtenerDatos('permisos').length;
  document.getElementById('stat-citatorios').textContent = obtenerDatos('citatorios').length;
  document.getElementById('stat-reportes').textContent = obtenerDatos('reportes').length;
  document.getElementById('stat-bitacora').textContent = obtenerDatos('bitacora').length;
}

const ACTIVITY_ICONS = {
  justificante: { icon: 'fa-file-medical', cls: 'justificante' },
  permiso: { icon: 'fa-door-open', cls: 'permiso' },
  citatorio: { icon: 'fa-envelope-open-text', cls: 'citatorio' },
  reporte: { icon: 'fa-exclamation-triangle', cls: 'reporte' },
  incidente: { icon: 'fa-shield-alt', cls: 'incidente' }
};

function actualizarActividad() {
  const lista = obtenerDatos('actividad');
  const cont = document.getElementById('recent-list');
  if (!lista.length) {
    cont.innerHTML = '<p class="empty-msg">No hay registros recientes.</p>';
    return;
  }
  cont.innerHTML = lista.slice(0, 12).map(a => {
    const info = ACTIVITY_ICONS[a.tipo] || { icon: 'fa-circle', cls: '' };
    return `
      <div class="activity-item ${info.cls}">
        <div class="activity-icon"><i class="fas ${info.icon}"></i></div>
        <div class="activity-text">${a.descripcion}</div>
        <div class="activity-time">${tiempoRelativo(new Date(a.fecha))}</div>
      </div>`;
  }).join('');
}

function tiempoRelativo(dt) {
  const diff = Math.floor((Date.now() - dt.getTime()) / 1000);
  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return dt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}
