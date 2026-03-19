// ===== AUTOCOMPLETE DE ALUMNOS =====
// Función reutilizable para todos los módulos

function initAlumnoAutocomplete(inputId, onSelect) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Crear dropdown
  let dropdown = document.createElement('ul');
  dropdown.className = 'autocomplete-dropdown';
  dropdown.id = inputId + '-dropdown';
  const wrapper = input.parentNode;
  if (!wrapper.style.position) wrapper.style.position = 'relative';
  wrapper.appendChild(dropdown);

  let seleccionIdx = -1;

  input.addEventListener('input', function () {
    const q = this.value.trim().toLowerCase();
    dropdown.innerHTML = '';
    seleccionIdx = -1;
    if (q.length < 1) return;

    const cache = window._alumnosCache || obtenerDatos('alumnos');
    const matches = cache.filter(a => {
      const nombreComp = (a.nombre || '').toLowerCase();
      const noCtrl = (a.noControl || '').toLowerCase();
      const ap = (a.apellidoPaterno || '').toLowerCase();
      const am = (a.apellidoMaterno || '').toLowerCase();
      return nombreComp.includes(q) || noCtrl.includes(q) || ap.includes(q) || am.includes(q);
    }).slice(0, 8);

    if (!matches.length) return;

    matches.forEach((alumno, i) => {
      const li = document.createElement('li');
      li.className = 'autocomplete-item';
      li.dataset.idx = i;
      const nombreMostrar = alumno.nombre ||
        [alumno.apellidoPaterno, alumno.apellidoMaterno, alumno.nombrePropio].filter(Boolean).join(' ');
      li.innerHTML = `<span class="ac-nombre">${nombreMostrar}</span>
        <span class="ac-info">${alumno.noControl || ''} · ${alumno.grado || ''} ${alumno.grupo || ''}</span>`;
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        onSelect(alumno);
        input.value = nombreMostrar;
        dropdown.innerHTML = '';
      });
      dropdown.appendChild(li);
    });
  });

  // Navegación con teclado
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
      dropdown.innerHTML = '';
      return;
    }
    items.forEach((it, i) => it.classList.toggle('active', i === seleccionIdx));
  });

  input.addEventListener('blur', () => {
    setTimeout(() => { dropdown.innerHTML = ''; seleccionIdx = -1; }, 180);
  });
}
