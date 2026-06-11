/* ── Búsqueda global con dropdown ── */

(function () {
  var timer = null;
  var dropdown = null;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function closeDropdown() {
    if (dropdown) {
      dropdown.classList.remove('search-dropdown-open');
      dropdown.innerHTML = '';
    }
  }

  function renderResults(data) {
    var proyectos   = data.proyectos   || [];
    var lideres     = data.lideres     || [];
    var actividades = data.actividades || [];
    var total = proyectos.length + lideres.length + actividades.length;

    if (total === 0) {
      dropdown.innerHTML = '<div class="search-no-results">Sin resultados</div>';
      dropdown.classList.add('search-dropdown-open');
      return;
    }

    var html = '';

    if (proyectos.length) {
      html += '<div class="search-cat-label">Proyectos</div>';
      var estadoColors = {
        activo: '#1D9E75', en_revision: '#EF9F27',
        pausado: '#888780', borrador: '#b0aaa5', cerrado: '#D85A30'
      };
      proyectos.forEach(function (p) {
        var color = estadoColors[p.estado] || '#888780';
        var meta = p.ubicacion || p.estado;
        html += '<a class="search-result-item" href="/proyectos/' + p.id + '">' +
          '<div class="sri-icon" style="background:' + color + '22;">' +
            '<svg viewBox="0 0 20 20" fill="' + color + '" width="14" height="14">' +
              '<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>' +
            '</svg>' +
          '</div>' +
          '<div>' +
            '<div class="sri-name">' + esc(p.nombre) + '</div>' +
            '<div class="sri-meta">' + esc(meta) + '</div>' +
          '</div>' +
        '</a>';
      });
    }

    if (lideres.length) {
      html += '<div class="search-cat-label">Líderes</div>';
      lideres.forEach(function (u) {
        var parts    = u.nombre.split(' ');
        var initials = parts.slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase();
        html += '<a class="search-result-item" href="/lideres">' +
          '<div class="sri-icon sri-avatar">' + esc(initials) + '</div>' +
          '<div>' +
            '<div class="sri-name">' + esc(u.nombre) + '</div>' +
            '<div class="sri-meta">' + esc(u.email) + '</div>' +
          '</div>' +
        '</a>';
      });
    }

    if (actividades.length) {
      html += '<div class="search-cat-label">Actividades del calendario</div>';
      actividades.forEach(function (a) {
        html += '<a class="search-result-item" href="/calendario">' +
          '<div class="sri-icon" style="background:#185FA522;">' +
            '<svg viewBox="0 0 20 20" fill="#185FA5" width="14" height="14">' +
              '<path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z"/>' +
            '</svg>' +
          '</div>' +
          '<div>' +
            '<div class="sri-name">' + esc(a.tema) + '</div>' +
            '<div class="sri-meta">' + esc(a.fecha) + '</div>' +
          '</div>' +
        '</a>';
      });
    }

    dropdown.innerHTML = html;
    dropdown.classList.add('search-dropdown-open');
  }

  async function buscar(q) {
    try {
      var res  = await fetch('/api/buscar?q=' + encodeURIComponent(q));
      var data = await res.json();
      renderResults(data);
    } catch (e) {
      console.error('search.js', e);
    }
  }

  function initSearch() {
    var input = document.getElementById('globalSearch');
    if (!input) return;

    var box = input.closest('.search-box');
    if (!box) return;

    box.style.position = 'relative';

    dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    box.appendChild(dropdown);

    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = this.value.trim();
      if (q.length < 2) { closeDropdown(); return; }
      timer = setTimeout(function () { buscar(q); }, 280);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDropdown(); this.blur(); }
    });

    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) closeDropdown();
    });
  }

  document.addEventListener('DOMContentLoaded', initSearch);
})();
