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
      return `<div class="event-chip" data-actividad='${JSON.stringify(a)}' style="background:${color}22;color:${color};border:1px solid ${color}44;font-size:11px;padding:2px 6px;border-radius:4px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;" onclick="mostrarDetalle(this)">${a.tema}</div>`;
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

function mostrarDetalle(el) {
  const a    = JSON.parse(el.dataset.actividad);
  const card = document.getElementById('eventDetails');
  if (!card) return;
  card.style.opacity = '0.5';
  setTimeout(() => {
    card.innerHTML = `
      <p style="font-weight:600;font-size:14px;margin-bottom:8px;">${a.tema}</p>
      <p style="font-size:13px;color:#5F5E5A;margin-bottom:4px;"><strong>Proyecto:</strong> ${a.proyecto_nombre || '—'}</p>
      <p style="font-size:13px;color:#5F5E5A;margin-bottom:4px;"><strong>Fecha:</strong> ${a.fecha}</p>
      ${a.duracion_minutos ? `<p style="font-size:13px;color:#5F5E5A;margin-bottom:4px;"><strong>Duración:</strong> ${a.duracion_minutos} min</p>` : ''}
      ${a.num_beneficiarios_presentes ? `<p style="font-size:13px;color:#5F5E5A;margin-bottom:4px;"><strong>Asistentes:</strong> ${a.num_beneficiarios_presentes}</p>` : ''}
      ${a.observaciones ? `<p style="font-size:12px;color:#888780;margin-top:8px;">${a.observaciones}</p>` : ''}
    `;
    card.style.opacity = '1';
  }, 150);
}
