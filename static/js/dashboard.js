/* ── Dashboard: carga datos reales desde /api/dashboard ── */

let todosProyectos = [];
let activeOdsChips = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res  = await fetch('/api/dashboard');
    const data = await res.json();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-proyectos',     data.proyectos_activos);
    set('stat-beneficiarios', (data.total_beneficiarios || 0).toLocaleString('es-MX'));
    set('stat-lideres',       data.total_lideres);
    set('stat-zonas',         data.zonas_intervencion);
    set('stat-actividades',   data.total_actividades);

    todosProyectos = data.proyectos || [];

    /* ODS select */
    const filterODS = document.getElementById('filterODS');
    if (filterODS) {
      const odsVistos = {};
      todosProyectos.forEach(p => p.ods.forEach(o => { odsVistos[o.numero] = o; }));
      Object.values(odsVistos).sort((a, b) => a.numero - b.numero).forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.numero;
        opt.textContent = `ODS ${o.numero} — ${o.nombre}`;
        filterODS.appendChild(opt);
      });
    }

    /* Zonas */
    const filterState = document.getElementById('filterState');
    if (filterState) {
      const zonas = [...new Set(todosProyectos.map(p => p.ubicacion ? p.ubicacion.split(',')[0].trim() : '').filter(Boolean))];
      zonas.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z; opt.textContent = z;
        filterState.appendChild(opt);
      });
    }

    /* Chips */
    const container = document.getElementById('dashOdsChipsContainer');
    if (container) {
      const odsMap = {};
      todosProyectos.forEach(p => p.ods.forEach(o => { odsMap[o.numero] = o; }));
      container.innerHTML = Object.values(odsMap).sort((a, b) => a.numero - b.numero).map(o =>
        `<button class="filter-chip ods-chip" style="--ods-color:${o.color};"
          onclick="toggleChip(this,${o.numero})" title="${o.nombre}">ODS ${o.numero}</button>`
      ).join('');
    }

    renderCards(todosProyectos);
  } catch (e) {
    console.error('dashboard.js', e);
    const g = document.getElementById('projectsGrid');
    if (g) g.innerHTML = '<p style="color:#888780;font-size:14px;">No se pudo cargar la información.</p>';
  }
});

function renderCards(proyectos) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  if (!proyectos.length) {
    grid.innerHTML = '<p style="color:#888780;font-size:14px;">No hay proyectos.</p>';
    return;
  }
  grid.innerHTML = proyectos.map(p => {
    const ods   = p.ods[0] || {};
    const color = ods.color || '#888780';
    const imgHtml = p.imagen_url
      ? `<img src="${p.imagen_url}" style="width:100%;height:120px;object-fit:cover;border-radius:8px 8px 0 0;" onerror="this.style.display='none'">`
      : `<div class="proj-img" style="background:${color}18;display:flex;align-items:center;justify-content:center;height:80px;">
          <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
            <circle cx="20" cy="20" r="20" fill="${color}18"/>
            <text x="20" y="26" text-anchor="middle" font-size="13" font-weight="600" fill="${color}">${ods.numero || '?'}</text>
          </svg>
        </div>`;
    return `<div class="proj-card" data-ods="${ods.numero || ''}" data-state="${(p.ubicacion || '').split(',')[0].trim()}">
      ${imgHtml}
      <div class="proj-body">
        <div class="proj-top">
          <div class="proj-name">${p.nombre}</div>
          ${ods.numero ? `<span class="proj-badge" style="background:${color}18;color:${color};border:1px solid ${color}40;">ODS ${ods.numero}</span>` : ''}
        </div>
        <div class="proj-meta"><svg viewBox="0 0 16 16" fill="#888780" width="12" height="12"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"/></svg> ${p.lider ? p.lider.nombre : '—'}</div>
        <div class="proj-meta"><svg viewBox="0 0 16 16" fill="#888780" width="12" height="12"><path fill-rule="evenodd" d="M8 1.5a5 5 0 100 10A5 5 0 008 1.5zM1 8a7 7 0 1114 0A7 7 0 011 8zm7-2a1 1 0 00-1 1v2a1 1 0 001 1h1a1 1 0 100-2H9V7a1 1 0 00-1-1z" clip-rule="evenodd"/></svg> ${p.ubicacion || '—'}</div>
        <div class="proj-beneficiarios">Total: ${(p.beneficiarios || 0).toLocaleString('es-MX')} beneficiarios</div>
        <div class="proj-progress">
          <div class="prog-label"><span>Avance</span><span>${p.avance_pct || 0}%</span></div>
          <div class="prog-bar"><div class="prog-fill" style="width:${p.avance_pct || 0}%;background:${color};"></div></div>
        </div>
        <button class="btn-detail" onclick="window.location.href='/proyectos/${p.id}'">Detalles completos</button>
      </div>
    </div>`;
  }).join('');
}

function toggleChip(btn, odsNum) {
  btn.classList.toggle('active-chip');
  activeOdsChips.has(odsNum) ? activeOdsChips.delete(odsNum) : activeOdsChips.add(odsNum);
  applyFilters();
}

function applyFilters() {
  const odsVal  = (document.getElementById('filterODS')   || {}).value || '';
  const zonaVal = (document.getElementById('filterState') || {}).value || '';
  const filtered = todosProyectos.filter(p => {
    const nums = p.ods.map(o => String(o.numero));
    const zona = (p.ubicacion || '').split(',')[0].trim();
    return (!odsVal  || nums.includes(odsVal)) &&
           (!zonaVal || zona === zonaVal) &&
           (activeOdsChips.size === 0 || nums.some(n => activeOdsChips.has(parseInt(n))));
  });
  renderCards(filtered);
}

function clearFilters() {
  const o = document.getElementById('filterODS');   if (o) o.value = '';
  const z = document.getElementById('filterState'); if (z) z.value = '';
  activeOdsChips.clear();
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active-chip'));
  renderCards(todosProyectos);
}
