document.addEventListener('DOMContentLoaded', () => {

  /* ── Poblar KPIs desde fuente central ── */
  if (typeof HS_STATS !== 'undefined') {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('kpi-proyectos',         HS_STATS.totalProyectos);
    set('kpi-beneficiarios',     HS_STATS.totalBeneficiarios.toLocaleString('es-MX'));
    set('kpi-beneficiarios-sub', `Hombres ${HS_STATS.beneficiariosHombres.toLocaleString('es-MX')} - Mujeres ${HS_STATS.beneficiariosMujeres.toLocaleString('es-MX')}`);
    set('kpi-lideres',           HS_STATS.lideresActivos);
    set('kpi-zonas',             HS_STATS.zonasIntervencion);
    set('kpi-zonas-sub',         `En ${HS_STATS.zonasIntervencion} zonas`);
    set('kpi-actividades',       HS_STATS.actividades);
  }

  /* ── Poblar select de ODS ── */
  const filterODS = document.getElementById('filterODS');
  if (filterODS && typeof ODS_LIST !== 'undefined') {
    ODS_LIST.forEach(ods => {
      const opt = document.createElement('option');
      opt.value = ods.num;
      opt.textContent = `ODS ${ods.num} — ${ods.nombre}`;
      filterODS.appendChild(opt);
    });
  }

  /* ── Generar chips de ODS presentes en los datos ── */
  const chipsContainer = document.getElementById('odsChipsContainer');
  if (chipsContainer && typeof HS_PROYECTOS !== 'undefined') {
    const uniqueNums = [...new Set(HS_PROYECTOS.map(p => p.ods))].sort((a, b) => a - b);
    chipsContainer.innerHTML = uniqueNums.map(num => {
      const ods = getODS(num);
      return `<button class="filter-chip ods-chip" style="--ods-color:${ods.color};"
        onclick="toggleChipProyectos(this, ${num})" title="${ods.nombre}">ODS ${num}</button>`;
    }).join('');
  }

  /* ── Generar cards desde HS_PROYECTOS ── */
  const grid = document.getElementById('projectsDetailedGrid');
  if (grid && typeof HS_PROYECTOS !== 'undefined') {
    grid.innerHTML = HS_PROYECTOS.map(p => {
      const ods = getODS(p.ods);
      return `
        <div class="proj-card" data-ods="${p.ods}" data-state="${p.zona}"
             style="border-top: 5px solid ${ods.color};">
          <div class="proj-header-flex">
            <h3 class="proj-title">${p.nombre}</h3>
            <span class="badge ods-badge" style="background:${ods.color}18; color:${ods.color}; border:1px solid ${ods.color}40;">
              ODS ${ods.num}
            </span>
          </div>
          <div class="proj-content-flex">
            <div class="proj-info w-100">
              <p class="proj-ods-name" style="color:${ods.color};">${ods.nombre}</p>
              <p class="proj-meta">Líder: ${p.lider}</p>
              <p class="proj-meta">Ubicación: ${p.ubicacion}</p>
              <div class="proj-stats-mt">
                <p class="text-xs">Desempeño del Proyecto: ${p.desempeno}%</p>
                <p class="text-xs">Total Beneficiarios (${p.beneficiarios})</p>
              </div>
            </div>
          </div>
          <div class="proj-footer">
            <button class="btn-orange" onclick="window.location.href='proyecto-detalle.html'">Detalles Completos</button>
            <span class="action-icon"></span>
          </div>
        </div>`;
    }).join('');
  }

  /* ── Limpiar filtros ── */
  const btnLimpiar = document.getElementById('btnLimpiar');
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', clearFiltersProyectos);
  }

});

/* ── Helper: obtener info ODS por número ── */
function getODS(num) {
  if (typeof ODS_LIST === 'undefined') return { num, nombre: 'ODS ' + num, color: '#888780' };
  return ODS_LIST.find(o => o.num === num) || { num, nombre: 'ODS ' + num, color: '#888780' };
}

/* ── Estado de chips activos ── */
const activeChips = new Set();

function toggleChipProyectos(btn, odsNum) {
  if (activeChips.has(odsNum)) {
    activeChips.delete(odsNum);
    btn.classList.remove('active-chip');
  } else {
    activeChips.add(odsNum);
    btn.classList.add('active-chip');
  }
  applyFiltersProyectos();
}

/* ── Aplicar filtros ── */
function applyFiltersProyectos() {
  const odsVal  = (document.getElementById('filterODS')  || {}).value || '';
  const zonaVal = (document.getElementById('filterZona') || {}).value || '';
  const cards   = document.querySelectorAll('#projectsDetailedGrid .proj-card');

  cards.forEach(card => {
    const cardODS  = card.dataset.ods   || '';
    const cardZona = card.dataset.state || '';

    const matchODS  = !odsVal  || cardODS === odsVal;
    const matchZona = !zonaVal || cardZona === zonaVal;
    const matchChip = activeChips.size === 0 || activeChips.has(parseInt(cardODS));

    card.style.display = (matchODS && matchZona && matchChip) ? '' : 'none';
  });
}

/* ── Limpiar filtros ── */
function clearFiltersProyectos() {
  const odsEl  = document.getElementById('filterODS');
  const zonaEl = document.getElementById('filterZona');
  if (odsEl)  odsEl.value  = '';
  if (zonaEl) zonaEl.value = '';

  activeChips.clear();
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active-chip'));

  document.querySelectorAll('#projectsDetailedGrid .proj-card').forEach(c => {
    c.style.display = '';
  });
}
