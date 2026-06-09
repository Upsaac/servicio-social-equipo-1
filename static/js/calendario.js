/* ── Calendario: carga actividades desde /api/actividades/calendario ── */

let mesActual = new Date();
let todasActividades = [];

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const COLORES_PROYECTO = ['#185FA5','#1D9E75','#D85A30','#7F77DD','#EF9F27','#C5192D','#4C9F38','#0A97D9'];

document.addEventListener('DOMContentLoaded', () => {
  actualizarLabel();
  cargarActividades();

  document.getElementById('btnPrevMes')?.addEventListener('click', () => {
    mesActual = new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1);
    actualizarLabel();
    cargarActividades();
  });
  document.getElementById('btnNextMes')?.addEventListener('click', () => {
    mesActual = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1);
    actualizarLabel();
    cargarActividades();
  });

  document.getElementById('filterProyecto')?.addEventListener('change', renderCalendario);
});

function actualizarLabel() {
  const el = document.getElementById('mesLabel');
  if (el) el.textContent = `${MESES[mesActual.getMonth()]} ${mesActual.getFullYear()}`;
}

async function cargarActividades() {
  const mes = `${mesActual.getFullYear()}-${String(mesActual.getMonth() + 1).padStart(2, '0')}`;
  try {
    const res = await fetch(`/api/actividades/calendario?mes=${mes}`);
    todasActividades = await res.json();
    renderCalendario();
    renderProximas();
  } catch (e) {
    console.error('calendario.js', e);
  }
}

function renderCalendario() {
  const grid = document.getElementById('calGrid');
  if (!grid) return;

  const proyectoFiltro = (document.getElementById('filterProyecto') || {}).value || '';
  const actividades = proyectoFiltro
    ? todasActividades.filter(a => String(a.proyecto_id) === proyectoFiltro)
    : todasActividades;

  /* Mapa: fecha ISO -> actividades */
  const porFecha = {};
  actividades.forEach(a => {
    if (!porFecha[a.fecha]) porFecha[a.fecha] = [];
    porFecha[a.fecha].push(a);
  });

  const año  = mesActual.getFullYear();
  const mes  = mesActual.getMonth();
  const inicio = new Date(año, mes, 1);
  const fin    = new Date(año, mes + 1, 0);
  const diaSemanaInicio = inicio.getDay();

  let html = '';
  /* Días del mes anterior */
  for (let i = 0; i < diaSemanaInicio; i++) {
    html += `<div class="cal-cell inactive"></div>`;
  }
  /* Días del mes */
  for (let d = 1; d <= fin.getDate(); d++) {
    const fecha = `${año}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const eventos = porFecha[fecha] || [];
    const chips   = eventos.map((a, idx) => {
      const color = COLORES_PROYECTO[a.proyecto_id % COLORES_PROYECTO.length];
      return `<div class="event-chip" data-actividad='${JSON.stringify(a)}' style="background:${color};color:#fff;font-size:11px;padding:3px 7px;border-radius:5px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;font-weight:500;" onmouseenter="mostrarDetalle(event,this)" onmouseleave="cerrarDetalle()">${a.tema}</div>`;
    }).join('');
    html += `<div class="cal-cell"><span style="font-size:12px;font-weight:600;color:#5F5E5A;margin-bottom:4px;">${d}</span>${chips}</div>`;
  }
  grid.innerHTML = html;
}

function renderProximas() {
  const lista = document.getElementById('proximasList');
  if (!lista) return;
  const hoy   = new Date().toISOString().split('T')[0];
  const prox  = todasActividades.filter(a => a.fecha >= hoy).slice(0, 5);
  if (!prox.length) {
    lista.innerHTML = '<li style="color:#888780;font-size:13px;">Sin actividades próximas.</li>';
    return;
  }
  lista.innerHTML = prox.map(a => {
    const color = COLORES_PROYECTO[a.proyecto_id % COLORES_PROYECTO.length];
    return `<li class="milestone-item" style="margin-bottom:10px;">
      <div style="font-size:12px;font-weight:600;color:${color};">${a.fecha}</div>
      <div style="font-size:13px;">${a.tema}</div>
      <div style="font-size:11px;color:#888780;">${a.proyecto_nombre || '—'}</div>
    </li>`;
  }).join('');
}

function mostrarDetalle(e, el) {
  const a     = JSON.parse(el.dataset.actividad);
  const color = COLORES_PROYECTO[a.proyecto_id % COLORES_PROYECTO.length];
  const tip   = document.getElementById('eventTooltip');
  if (!tip) return;

  tip.innerHTML = `
    <div class="tip-title" style="color:${color};border-bottom:2px solid ${color};">${a.tema}</div>
    <div class="tip-row"><span class="tip-label" style="color:${color};">Proyecto</span><span>${a.proyecto_nombre || '—'}</span></div>
    <div class="tip-row"><span class="tip-label" style="color:${color};">Fecha</span><span>${a.fecha}</span></div>
    ${a.duracion_minutos ? `<div class="tip-row"><span class="tip-label" style="color:${color};">Duración</span><span>${a.duracion_minutos} min</span></div>` : ''}
    ${a.num_beneficiarios_presentes ? `<div class="tip-row"><span class="tip-label" style="color:${color};">Asistentes</span><span>${a.num_beneficiarios_presentes}</span></div>` : ''}
    ${a.observaciones ? `<div class="tip-obs">${a.observaciones}</div>` : ''}
  `;

  const rect = el.getBoundingClientRect();
  tip.style.display = 'block';

  /* Posicionar debajo del chip; ajustar si se sale de la pantalla */
  const tipW = 220;
  let left = rect.left;
  if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
  tip.style.left = left + 'px';
  tip.style.top  = (rect.bottom + 6) + 'px';
}

function cerrarDetalle() {
  const tip = document.getElementById('eventTooltip');
  if (tip) tip.style.display = 'none';
}
