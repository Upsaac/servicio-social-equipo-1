/* ── Detalle del proyecto: carga desde /api/proyectos/ID ── */

const ESTADOS_LABEL = { borrador:'Borrador', en_revision:'En revisión', activo:'Activo', pausado:'Pausado', cerrado:'Cerrado' };
const ESTADOS_CLASS = { borrador:'badge-warning', en_revision:'badge-blue', activo:'badge-success', pausado:'badge-warning', cerrado:'badge-red' };
const AVATAR_COLORS = ['#E6F1FB', '#E1F5EE', '#FAEEDA', '#EEEDFE', '#FAECE7'];
const AVATAR_TEXT   = ['#185FA5', '#1D9E75', '#EF9F27', '#7F77DD', '#D85A30'];

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof PROYECTO_ID === 'undefined') return;

  /* Tabs */
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      const panel = document.getElementById('panel-' + this.dataset.tab);
      if (panel) panel.classList.add('active');
      if (this.dataset.tab === 'testimonios') cargarTestimonios();
    });
  });

  try {
    const res     = await fetch(`/api/proyectos/${PROYECTO_ID}`);
    const p       = await res.json();
    const isAdmin = window._hsUser && window._hsUser.rol === 'admin';
    const puedeEditar = isAdmin || (typeof ES_LIDER_DUENO !== 'undefined' && ES_LIDER_DUENO);

    /* Header */
    setText('detNombre', p.nombre);
    setText('detUbicacion', `📍 ${p.ubicacion || '—'}`);
    setText('detFecha', p.fecha_inicio ? `Inicio: ${p.fecha_inicio}` : '—');
    setText('detUltimaAct', `Última actualización: ${p.ultima_actualizacion || '—'}`);
    if (p.lider) setText('detLider', `👤 ${p.lider.nombre}`);

    const odsBadge = document.getElementById('detOdsBadge');
    if (odsBadge && p.ods.length) {
      const o = p.ods[0];
      odsBadge.textContent = `ODS ${o.numero}`;
      odsBadge.style.cssText = `background:${o.color}18;color:${o.color};border:1px solid ${o.color}40;`;
    }

    const estadoBadge = document.getElementById('detEstadoBadge');
    if (estadoBadge) {
      estadoBadge.textContent = ESTADOS_LABEL[p.estado] || p.estado;
      estadoBadge.className   = `badge ${ESTADOS_CLASS[p.estado] || 'badge-warning'}`;
    }

    /* Controles de edición */
    if (puedeEditar) {
      const editBtn = document.getElementById('btnEditar');
      if (editBtn) editBtn.style.display = '';
      const accionesPanel = document.getElementById('accionesLider');
      if (accionesPanel) accionesPanel.style.display = '';
    }

    if (isAdmin) {
      const controls   = document.getElementById('estadoControls');
      const selectEl   = document.getElementById('selectEstado');
      const btnCambiar = document.getElementById('btnCambiarEstado');
      if (controls) controls.style.display = 'flex';
      if (selectEl) selectEl.value = p.estado;
      if (btnCambiar) {
        btnCambiar.addEventListener('click', async () => {
          const r = await fetch(`/api/proyectos/${PROYECTO_ID}/estado`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ estado: selectEl.value }),
          });
          if (r.ok && estadoBadge) {
            estadoBadge.textContent = ESTADOS_LABEL[selectEl.value];
            estadoBadge.className   = `badge ${ESTADOS_CLASS[selectEl.value]}`;
          }
        });
      }
    }

    /* KPIs */
    setText('kpiBeneficiarios', (p.beneficiarios || 0).toLocaleString('es-MX'));
    setText('kpiMeta', `Meta: ${p.meta_beneficiarios || '—'} (${p.avance_pct || 0}%)`);
    setText('kpiActividades', p.actividades ? p.actividades.length : 0);
    setText('kpiAvance', `${p.avance_pct || 0}%`);

    /* Actividades */
    renderActividades(p.actividades || [], 'actividadesRecientes', 3);
    renderActividades(p.actividades || [], 'todasActividades', 999);

    /* Tab Información */
    setText('detDescripcion', p.descripcion || 'Sin descripción.');
    const tabla = document.getElementById('detTabla');
    if (tabla) {
      tabla.innerHTML = [
        ['Modalidad', p.modalidad || '—'],
        ['Estado', ESTADOS_LABEL[p.estado] || p.estado],
        ['Fecha de inicio', p.fecha_inicio || '—'],
        ['Fecha de fin', p.fecha_fin || '—'],
        ['Periodo', p.periodo_tipo ? p.periodo_tipo.replace('_', ' ') : '—'],
        ['Meta beneficiarios', p.meta_beneficiarios || '—'],
      ].map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
    }

    /* Equipo */
    renderEquipoDetalle(p);

  } catch (e) {
    console.error('proyecto-detalle.js', e);
  }

  inicializarTestimoniosUI();
});

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

/* ── Renderizado de actividades con métricas ── */
function renderActividades(actividades, containerId, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!actividades.length) {
    container.innerHTML = '<li style="color:#888780;font-size:14px;">Sin actividades registradas.</li>';
    return;
  }
  container.innerHTML = actividades.slice(0, limit).map(a => {
    const metricasHtml = a.metricas && a.metricas.length
      ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:6px;">
          ${a.metricas.map(m => `
            <span style="background:#f1f5f9;border-radius:20px;padding:2px 8px;font-size:11px;color:#5F5E5A;">
              ${m.campo_nombre}: <strong>${m.valor !== null && m.valor !== undefined ? m.valor : '—'}${m.campo_unidad ? ' ' + m.campo_unidad : ''}</strong>
            </span>`).join('')}
        </div>`
      : '';
    return `<li class="activity-item" style="flex-direction:column;align-items:flex-start;gap:4px;">
      <div style="display:flex;justify-content:space-between;width:100%;align-items:flex-start;">
        <div>
          <div class="act-name">${a.tema}</div>
          <div class="act-date">${a.fecha}${a.num_beneficiarios_presentes ? ` · ${a.num_beneficiarios_presentes} asistentes` : ''}${a.duracion_minutos ? ` · ${a.duracion_minutos} min` : ''}${a.observaciones ? ' · ' + a.observaciones : ''}</div>
        </div>
        <span class="badge badge-success" style="flex-shrink:0;">Registrado</span>
      </div>
      ${metricasHtml}
    </li>`;
  }).join('');
}

/* ── Equipo del proyecto ── */
function renderEquipoDetalle(p) {
  const container = document.getElementById('detEquipo');
  if (!container) return;

  const miembros = [];
  if (p.lider) {
    miembros.push({ nombre: p.lider.nombre, rol: 'Líder del proyecto', email: p.lider.email, foto: p.lider.foto_url, initials: p.lider.initials, esLider: true });
  }
  (p.equipo || []).forEach((m, i) => {
    const bg  = AVATAR_COLORS[i % AVATAR_COLORS.length];
    const clr = AVATAR_TEXT[i % AVATAR_TEXT.length];
    miembros.push({ nombre: m.nombre, rol: m.rol, bg, clr, initials: m.nombre.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() });
  });

  container.innerHTML = miembros.map(m => {
    const avatar = m.foto
      ? `<img src="${m.foto}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.outerHTML='<div class=\\'team-avatar\\'>${m.initials}</div>'">`
      : `<div class="team-avatar" style="background:${m.bg || '#E6F1FB'};color:${m.clr || '#185FA5'};">${m.initials}</div>`;
    return `<div class="team-member">
      ${avatar}
      <div>
        <div class="team-name">${m.nombre}</div>
        <div class="team-role">${m.rol}</div>
        ${m.email ? `<div style="font-size:11px;color:#888780;">${m.email}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

/* ── Testimonios persistentes ── */

function inicializarTestimoniosUI() {
  const isAdmin    = window._hsUser && window._hsUser.rol === 'admin';
  const puedeModerar = isAdmin || (typeof ES_LIDER_DUENO !== 'undefined' && ES_LIDER_DUENO);

  const ps = document.getElementById('pendingSection');
  const ss = document.getElementById('submitSection');
  if (ps) ps.style.display = puedeModerar ? '' : 'none';
  if (ss) ss.style.display = puedeModerar ? 'none' : '';

  const form = document.getElementById('testimonialForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const user = window._hsUser || {};
      const payload = {
        nombre_remitente: user.nombre || 'Anónimo',
        rol_remitente: document.getElementById('testRole').value.trim(),
        texto: document.getElementById('testText').value.trim(),
      };
      if (!payload.rol_remitente || !payload.texto) return;
      const res = await fetch(`/api/proyectos/${PROYECTO_ID}/testimonios`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        form.reset();
        alert('¡Gracias! Tu testimonio será revisado.');
        cargarTestimonios();
      }
    });
  }
}

async function cargarTestimonios() {
  try {
    const res  = await fetch(`/api/proyectos/${PROYECTO_ID}/testimonios`);
    const data = await res.json();
    const puedeModerar = (window._hsUser && window._hsUser.rol === 'admin') ||
                         (typeof ES_LIDER_DUENO !== 'undefined' && ES_LIDER_DUENO);
    const pending  = data.filter(t => t.estado === 'pendiente');
    const approved = data.filter(t => t.estado === 'aprobado');

    const fill = (id, items, actions) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = items.map(t => testimonialCardHTML(t, actions)).join('');
    };
    fill('pendingList',  pending,  puedeModerar);
    fill('approvedList', approved, false);

    const ep = document.getElementById('emptyPending');  if (ep) ep.style.display  = pending.length  ? 'none' : 'block';
    const ea = document.getElementById('emptyApproved'); if (ea) ea.style.display  = approved.length ? 'none' : 'block';
    const pp = document.getElementById('pendingPill');   if (pp) pp.textContent    = pending.length;
    const pc = document.getElementById('pendingCount');  if (pc) { pc.textContent = pending.length; pc.style.display = pending.length && puedeModerar ? 'inline-block' : 'none'; }
  } catch(e) {
    console.error('cargarTestimonios', e);
  }
}

function testimonialCardHTML(t, showActions) {
  const colors    = ['', 'green', 'coral', 'purple'];
  const colorClass = ' ' + colors[(t.id || 0) % colors.length];
  const statusClass = t.estado === 'pendiente' ? 'status-pending' : 'status-approved';
  const initials  = t.nombre_remitente.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const actions   = showActions
    ? `<div class="test-actions">
         <button class="btn-approve" onclick="moderarTestimonio(${t.id},'aprobado')">✓ Aprobar</button>
         <button class="btn-reject"  onclick="moderarTestimonio(${t.id},'rechazado')">✕ Rechazar</button>
       </div>` : '';
  return `<div class="test-card">
    <div class="test-avatar${colorClass}">${initials}</div>
    <div class="test-body">
      <div class="test-head">
        <div><div class="test-name">${t.nombre_remitente}</div><div class="test-role">${t.rol_remitente}</div></div>
        <span class="test-status ${statusClass}">${t.estado === 'pendiente' ? 'Pendiente' : 'Publicado'}</span>
      </div>
      <p class="test-text">"${t.texto}"</p>
      <div class="test-meta">${t.fecha}</div>
      ${actions}
    </div>
  </div>`;
}

async function moderarTestimonio(id, estado) {
  if (estado === 'rechazado' && !confirm('¿Rechazar y eliminar este testimonio?')) return;
  const res = await fetch(`/api/testimonios/${id}/estado`, {
    method: 'PUT', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ estado }),
  });
  if (res.ok) cargarTestimonios();
}
