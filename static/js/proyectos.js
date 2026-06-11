/* ── Proyectos: carga datos reales desde /api/proyectos ── */

let todosProyectos = [];
let activeChips    = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [dashRes, proyRes] = await Promise.all([
      fetch('/api/dashboard'),
      fetch('/api/proyectos'),
    ]);
    const dash      = await dashRes.json();
    const proyectos = await proyRes.json();
    todosProyectos  = proyectos;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('kpi-proyectos',     dash.proyectos_activos);
    set('kpi-beneficiarios', (dash.total_beneficiarios || 0).toLocaleString('es-MX'));
    set('kpi-lideres',       dash.total_lideres);
    set('kpi-zonas',         dash.zonas_intervencion);
    set('kpi-actividades',   dash.total_actividades);

    const odsMap = {};
    proyectos.forEach(p => p.ods.forEach(o => { odsMap[o.numero] = o; }));

    const filterODS = document.getElementById('filterODS');
    if (filterODS) {
      Object.values(odsMap).sort((a, b) => a.numero - b.numero).forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.numero; opt.textContent = `ODS ${o.numero} — ${o.nombre}`;
        filterODS.appendChild(opt);
      });
    }

    const filterZona = document.getElementById('filterZona');
    if (filterZona) {
      const zonas = [...new Set(proyectos.map(p => p.ubicacion ? p.ubicacion.split(',')[0].trim() : '').filter(Boolean))];
      zonas.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z; opt.textContent = z;
        filterZona.appendChild(opt);
      });
    }

    const chips = document.getElementById('odsChipsContainer');
    if (chips) {
      chips.innerHTML = Object.values(odsMap).sort((a, b) => a.numero - b.numero).map(o =>
        `<button class="filter-chip ods-chip" style="--ods-color:${o.color};"
          onclick="toggleChipProyectos(this,${o.numero})" title="${o.nombre}">ODS ${o.numero}</button>`
      ).join('');
    }

    renderGrid(proyectos);
    const btnL = document.getElementById('btnLimpiar');
    if (btnL) btnL.addEventListener('click', clearFiltersProyectos);

  } catch (e) {
    console.error('proyectos.js', e);
    const g = document.getElementById('projectsDetailedGrid');
    if (g) g.innerHTML = '<p style="color:#888780;font-size:14px;">No se pudo cargar la información.</p>';
  }
});

const ESTADO_BADGE  = { borrador:'badge-warning', en_revision:'badge-blue', activo:'badge-success', pausado:'badge-warning', cerrado:'badge-red' };
const ESTADO_LABEL  = { borrador:'Borrador', en_revision:'En revisión', activo:'Activo', pausado:'Pausado', cerrado:'Cerrado' };

function renderGrid(proyectos) {
  const grid = document.getElementById('projectsDetailedGrid');
  if (!grid) return;
  if (!proyectos.length) {
    grid.innerHTML = '<p style="color:#888780;font-size:14px;grid-column:1/-1;">No hay proyectos que coincidan.</p>';
    return;
  }
  grid.innerHTML = proyectos.map(p => {
    const ods   = p.ods[0] || {};
    const color = ods.color || '#888780';
    const imgHtml = p.imagen_url
      ? `<img src="${p.imagen_url}" style="width:100%;height:100px;object-fit:cover;" onerror="this.style.display='none'">`
      : '';
    return `<div class="proj-card" data-ods="${ods.numero || ''}" data-state="${(p.ubicacion || '').split(',')[0].trim()}"
             style="border-top:5px solid ${color};">${imgHtml}
      <div class="proj-header-flex">
        <h3 class="proj-title">${p.nombre}</h3>
        <span class="badge ods-badge" style="background:${color}18;color:${color};border:1px solid ${color}40;">${ods.numero ? `ODS ${ods.numero}` : '—'}</span>
      </div>
      <div class="proj-content-flex">
        <div class="proj-info w-100">
          ${ods.nombre ? `<p class="proj-ods-name" style="color:${color};">${ods.nombre}</p>` : ''}
          <p class="proj-meta">Líder: ${p.lider ? p.lider.nombre : '—'}</p>
          <p class="proj-meta">Ubicación: ${p.ubicacion || '—'}</p>
          <p class="proj-meta" style="font-size:12px;color:#888780;">Última actualización: ${p.ultima_actualizacion || '—'}</p>
          <div class="proj-stats-mt">
            <p class="text-xs">Avance: ${p.avance_pct || 0}%</p>
            <p class="text-xs">Beneficiarios: ${(p.beneficiarios || 0).toLocaleString('es-MX')}</p>
          </div>
        </div>
      </div>
      <div class="proj-footer">
        <button class="btn-orange" onclick="window.location.href='/proyectos/${p.id}'">Detalles Completos</button>
        <span class="badge ${ESTADO_BADGE[p.estado] || 'badge-warning'}">${ESTADO_LABEL[p.estado] || p.estado}</span>
      </div>
    </div>`;
  }).join('');
}

function toggleChipProyectos(btn, odsNum) {
  activeChips.has(odsNum) ? activeChips.delete(odsNum) : activeChips.add(odsNum);
  btn.classList.toggle('active-chip');
  applyFiltersProyectos();
}

function applyFiltersProyectos() {
  const odsVal  = (document.getElementById('filterODS')  || {}).value || '';
  const zonaVal = (document.getElementById('filterZona') || {}).value || '';
  const filtered = todosProyectos.filter(p => {
    const nums = p.ods.map(o => String(o.numero));
    const zona = (p.ubicacion || '').split(',')[0].trim();
    return (!odsVal  || nums.includes(odsVal)) &&
           (!zonaVal || zona.includes(zonaVal)) &&
           (activeChips.size === 0 || nums.some(n => activeChips.has(parseInt(n))));
  });
  renderGrid(filtered);
}

function clearFiltersProyectos() {
  const o = document.getElementById('filterODS');  if (o) o.value = '';
  const z = document.getElementById('filterZona'); if (z) z.value = '';
  activeChips.clear();
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active-chip'));
  renderGrid(todosProyectos);
}

/* ── Exportación CSV de proyectos ── */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnExportarReporte');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const hoy   = new Date().toLocaleDateString('es-MX');
    const lista = todosProyectos.length ? todosProyectos : [];
    const filas = [];

    filas.push(['Reporte de Proyectos — Huella Solidaria']);
    filas.push(['Fecha de generación', hoy]);
    filas.push(['Total de proyectos', lista.length]);
    filas.push([]);
    filas.push(['Nombre','Estado','Líder','ODS','Ubicación','Beneficiarios','Meta','Avance (%)','Modalidad','Fecha inicio','Fecha fin']);

    lista.forEach(p => {
      const odsList = (p.ods || []).map(o => `ODS ${o.numero}`).join(' | ');
      filas.push([
        p.nombre            || '',
        ESTADO_LABEL[p.estado] || p.estado || '',
        p.lider ? p.lider.nombre : '',
        odsList,
        p.ubicacion         || '',
        p.beneficiarios     || 0,
        p.meta_beneficiarios || '',
        p.avance_pct        || 0,
        p.modalidad         || '',
        p.fecha_inicio      || '',
        p.fecha_fin         || '',
      ]);
    });

    const csv = filas.map(fila =>
      fila.map(celda => {
        const s = String(celda == null ? '' : celda);
        return (s.includes(',') || s.includes('"') || s.includes('\n'))
          ? '"' + s.replace(/"/g, '""') + '"'
          : s;
      }).join(',')
    ).join('\r\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `Reporte_Proyectos_${hoy.replace(/\//g,'-')}.csv`; a.click();
    URL.revokeObjectURL(url);
  });
});
