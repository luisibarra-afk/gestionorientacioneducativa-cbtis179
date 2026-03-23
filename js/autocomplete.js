// ===== AUTOCOMPLETE DE ALUMNOS =====
// Función reutilizable para todos los módulos

function initAlumnoAutocomplete(inputId, onSelect) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Eliminar dropdown anterior si existía (re-inicialización al editar)
  const old = document.getElementById(inputId + '-dropdown');
  if (old) old.remove();

  const dropdown = document.createElement('ul');
  dropdown.className = 'autocomplete-dropdown';
  dropdown.id = inputId + '-dropdown';
  dropdown.style.cssText = 'position:fixed;z-index:10000;';
  document.body.appendChild(dropdown);

  let seleccionIdx = -1;

  function posicionar() {
    const rect = input.getBoundingClientRect();
    dropdown.style.left  = rect.left + 'px';
    dropdown.style.top   = (rect.bottom + 2) + 'px';
    dropdown.style.width = rect.width + 'px';
  }

  function cerrar() {
    dropdown.innerHTML = '';
    seleccionIdx = -1;
  }

  input.addEventListener('input', function () {
    const q = this.value.trim().toLowerCase();
    cerrar();
    if (q.length < 1) return;

    // Leer siempre fresco: el cache puede estar vacío si Supabase no terminó aún
    const lista = (window._alumnosCache && window._alumnosCache.length > 0)
      ? window._alumnosCache
      : obtenerDatos('alumnos');
    const matches = lista.filter(a => {
      const nombre    = (a.nombre || '').toLowerCase();
      const noCtrl    = (a.noControl || '').toLowerCase();
      const ap        = (a.apellidoPaterno || '').toLowerCase();
      const am        = (a.apellidoMaterno || '').toLowerCase();
      const np        = (a.nombrePropio || '').toLowerCase();
      const completo  = [ap, am, np].filter(Boolean).join(' ');
      return nombre.includes(q) || noCtrl.includes(q) || ap.includes(q)
          || am.includes(q) || np.includes(q) || completo.includes(q);
    }).slice(0, 10);

    if (!matches.length) {
      if (lista.length === 0) {
        posicionar();
        dropdown.innerHTML = '<li style="padding:8px 12px;color:#64748b;font-size:13px">' +
          '<i class="fas fa-spinner fa-spin" style="margin-right:6px"></i>Cargando padrón, espera un momento...</li>';
      }
      return;
    }
    posicionar();

    matches.forEach((alumno) => {
      const li = document.createElement('li');
      li.className = 'autocomplete-item';
      const nombreMostrar = alumno.nombre ||
        [alumno.apellidoPaterno, alumno.apellidoMaterno, alumno.nombrePropio].filter(Boolean).join(' ');
      li.innerHTML = `<span class="ac-nombre">${nombreMostrar}</span>
        <span class="ac-info">${alumno.noControl || ''} · ${alumno.grado || ''} ${alumno.grupo || ''}</span>`;
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        onSelect(alumno);
        input.value = nombreMostrar;
        cerrar();
      });
      dropdown.appendChild(li);
    });
  });

  input.addEventListener('keydown', function (e) {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      seleccionIdx = Math.min(seleccionIdx + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      seleccionIdx = Math.max(seleccionIdx - 1, 0);
    } else if (e.key === 'Enter' && seleccionIdx >= 0) {
      e.preventDefault();
      items[seleccionIdx].dispatchEvent(new MouseEvent('mousedown'));
      return;
    } else if (e.key === 'Escape') {
      cerrar();
      return;
    }
    items.forEach((it, i) => it.classList.toggle('active', i === seleccionIdx));
  });

  input.addEventListener('blur', () => {
    setTimeout(() => cerrar(), 180);
  });
}
