/* ─────────────────────────────────────────
   Verificación de sesión
───────────────────────────────────────── */
const sessionData = sessionStorage.getItem('hs_user');

if (!sessionData) {
  window.location.href = 'login.html';
}

const currentUser = sessionData ? JSON.parse(sessionData) : null;
const isAdmin = currentUser && currentUser.role === 'admin';

/* Datos del usuario en el sidebar */
if (currentUser) {
  const nameEl   = document.getElementById('userName');
  const roleEl   = document.getElementById('userRole');
  const avatarEl = document.getElementById('userAvatar');
  if (nameEl)   nameEl.textContent   = currentUser.name;
  if (roleEl)   roleEl.textContent   = isAdmin ? 'Administrador' : 'Usuario';
  if (avatarEl) avatarEl.textContent = currentUser.initials;
}

/* Mostrar / ocultar elementos según rol */
document.querySelectorAll('.admin-only').forEach(el => {
  if (!isAdmin) el.classList.add('hidden');
});
document.querySelectorAll('.user-only').forEach(el => {
  if (isAdmin) el.classList.add('hidden');
});

/* Cerrar sesión */
const logoutBtn = document.querySelector('.sb-logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function (e) {
    e.preventDefault();
    sessionStorage.removeItem('hs_user');
    window.location.href = 'login.html';
  });
}

/* ─── Tabs ───────────────────────────────── */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    this.classList.add('active');
    const panel = document.getElementById('panel-' + this.dataset.tab);
    if (panel) panel.classList.add('active');
  });
});

/* ─────────────────────────────────────────
   Testimonios (datos de ejemplo)
   En producción esto vendría de tu API.
───────────────────────────────────────── */
let testimonials = [
  {
    id: 1,
    name:    'Roberto Luna',
    initials:'RL',
    role:    'Beneficiario · Puebla',
    text:    'Gracias a los talleres de matemáticas, mi hijo mejoró sus calificaciones y ahora le encanta ir a la escuela. El equipo cambió nuestra perspectiva.',
    date:    'Enviado hace 2 días',
    status:  'pending',
    color:   ''
  },
  {
    id: 2,
    name:    'Carmen Mendoza',
    initials:'CM',
    role:    'Madre de familia',
    text:    'Las reuniones con padres nos enseñaron herramientas para apoyar la educación de nuestros hijos en casa. Estoy muy agradecida con el proyecto.',
    date:    'Enviado hace 4 días',
    status:  'pending',
    color:   'coral'
  },
  {
    id: 3,
    name:    'Ana Torres',
    initials:'AT',
    role:    'Maestra colaboradora',
    text:    'Ver el progreso de los niños en cada taller es lo más gratificante. Selelios ha transformado la forma en que enseñamos en la comunidad.',
    date:    'Aprobado el 20 abril 2026',
    status:  'approved',
    color:   'green'
  },
  {
    id: 4,
    name:    'Luis Fernández',
    initials:'LF',
    role:    'Voluntario',
    text:    'Ser parte de Selelios me dio una nueva perspectiva sobre el impacto que podemos tener cuando trabajamos juntos por la educación.',
    date:    'Aprobado el 15 abril 2026',
    status:  'approved',
    color:   'purple'
  }
];

/* ─── Render testimonios ─────────────────── */
function renderTestimonials() {
  const pendingList   = document.getElementById('pendingList');
  const approvedList  = document.getElementById('approvedList');
  const emptyPending  = document.getElementById('emptyPending');
  const emptyApproved = document.getElementById('emptyApproved');
  const pendingPill   = document.getElementById('pendingPill');
  const pendingCount  = document.getElementById('pendingCount');

  const pending  = testimonials.filter(t => t.status === 'pending');
  const approved = testimonials.filter(t => t.status === 'approved');

  /* Pendientes (admin) */
  if (pendingList) {
    pendingList.innerHTML = pending.map(t => testimonialCardHTML(t, true)).join('');
    emptyPending.style.display = pending.length === 0 ? 'block' : 'none';
  }

  /* Aprobados */
  if (approvedList) {
    approvedList.innerHTML = approved.map(t => testimonialCardHTML(t, false)).join('');
    emptyApproved.style.display = approved.length === 0 ? 'block' : 'none';
  }

  /* Contadores */
  if (pendingPill)  pendingPill.textContent  = pending.length;
  if (pendingCount) {
    pendingCount.textContent = pending.length;
    pendingCount.style.display = pending.length > 0 && isAdmin ? 'inline-block' : 'none';
  }
}

/* HTML para una tarjeta de testimonio */
function testimonialCardHTML(t, showActions) {
  const statusClass = t.status === 'pending' ? 'status-pending' : 'status-approved';
  const statusText  = t.status === 'pending' ? 'Pendiente' : 'Publicado';
  const colorClass  = t.color ? ' ' + t.color : '';

  const actions = showActions
    ? `<div class="test-actions">
         <button class="btn-approve" onclick="approveTestimonial(${t.id})">✓ Aprobar</button>
         <button class="btn-reject" onclick="rejectTestimonial(${t.id})">✕ Rechazar</button>
       </div>`
    : '';

  return `
    <div class="test-card">
      <div class="test-avatar${colorClass}">${t.initials}</div>
      <div class="test-body">
        <div class="test-head">
          <div>
            <div class="test-name">${t.name}</div>
            <div class="test-role">${t.role}</div>
          </div>
          <span class="test-status ${statusClass}">${statusText}</span>
        </div>
        <p class="test-text">"${t.text}"</p>
        <div class="test-meta">${t.date}</div>
        ${actions}
      </div>
    </div>
  `;
}

/* ─── Acciones admin ─────────────────────── */
function approveTestimonial(id) {
  const t = testimonials.find(x => x.id === id);
  if (t) {
    t.status = 'approved';
    t.date   = 'Aprobado hoy';
    renderTestimonials();
  }
}

function rejectTestimonial(id) {
  if (confirm('¿Estás seguro de rechazar este testimonio?')) {
    testimonials = testimonials.filter(x => x.id !== id);
    renderTestimonials();
  }
}

/* ─── Formulario (usuario) ───────────────── */
const submitForm = document.getElementById('testimonialForm');
if (submitForm) {
  submitForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const role = document.getElementById('testRole').value.trim();
    const text = document.getElementById('testText').value.trim();

    if (!role || !text) return;

    const initials = currentUser.initials || 'US';
    const colors   = ['', 'green', 'coral', 'purple'];

    testimonials.push({
      id: Date.now(),
      name:     currentUser.name,
      initials: initials,
      role:     role,
      text:     text,
      date:     'Enviado recién',
      status:   'pending',
      color:    colors[Math.floor(Math.random() * colors.length)]
    });

    submitForm.reset();
    alert('¡Gracias! Tu testimonio fue enviado y será revisado por un administrador.');
    renderTestimonials();
  });
}

/* Render inicial */
renderTestimonials();