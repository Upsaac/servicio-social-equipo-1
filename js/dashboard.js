/* ─────────────────────────────────────────
   Poblar stats desde fuente central (data.js)
───────────────────────────────────────── */
if (typeof HS_STATS !== 'undefined') {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-proyectos',    HS_STATS.totalProyectos);
  set('stat-beneficiarios', HS_STATS.totalBeneficiarios.toLocaleString('es-MX'));
  set('stat-lideres',      HS_STATS.lideresActivos);
  set('stat-zonas',        HS_STATS.zonasIntervencion);
  set('stat-actividades',  HS_STATS.actividades);
}

/* ─────────────────────────────────────────
   Inicialización: ODS select + chips
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* Poblar select de ODS */
  const filterODS = document.getElementById('filterODS');
  if (filterODS && typeof ODS_LIST !== 'undefined') {
    ODS_LIST.forEach(ods => {
      const opt = document.createElement('option');
      opt.value = ods.num;
      opt.textContent = `ODS ${ods.num} — ${ods.nombre}`;
      filterODS.appendChild(opt);
    });
  }

  /* Generar chips para los ODS presentes en las cards del grid */
  const chipsContainer = document.getElementById('dashOdsChipsContainer');
  if (chipsContainer && typeof ODS_LIST !== 'undefined') {
    const cards = document.querySelectorAll('.proj-card[data-ods]');
    const uniqueNums = [...new Set([...cards].map(c => parseInt(c.dataset.ods)))].sort((a, b) => a - b);
    chipsContainer.innerHTML = uniqueNums.map(num => {
      const ods = ODS_LIST.find(o => o.num === num) || { num, nombre: 'ODS ' + num, color: '#888780' };
      return `<button class="filter-chip ods-chip" style="--ods-color:${ods.color};"
        onclick="toggleChip(this, ${num})" title="${ods.nombre}">ODS ${num}</button>`;
    }).join('');
  }

});

/* ─────────────────────────────────────────
   Verificación de sesión
───────────────────────────────────────── */
const sessionData = sessionStorage.getItem('hs_user');

// if (!sessionData) {
//   window.location.href = 'login.html';
// }

const currentUser = sessionData ? JSON.parse(sessionData) : null;

/* Muestra los datos del usuario */
if (currentUser) {
  const nameEl   = document.getElementById('userName');
  const roleEl   = document.getElementById('userRole');
  const avatarEl = document.getElementById('userAvatar');

  if (nameEl)   nameEl.textContent   = currentUser.name;
  if (roleEl)   roleEl.textContent   = currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
  if (avatarEl) avatarEl.textContent = currentUser.initials;
}

/* Oculta "Nuevo proyecto" si no es admin */
const btnNuevo = document.getElementById('btnNuevoProyecto');
if (btnNuevo) {
  const isAdmin = currentUser && currentUser.role === 'admin';
  if (!isAdmin) btnNuevo.style.display = 'none';
}

/* Cerrar sesión */
const logoutBtn = document.querySelector('.sb-logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function (e) {
    e.preventDefault();
    sessionStorage.removeItem('hs_user');
    window.location.href = 'login.html';
  });
}

/* ─── Filter chips ───────────────────────── */
const activeChipCategories = new Set();

function toggleChip(btn, odsNum) {
  btn.classList.toggle('active-chip');
  if (activeChipCategories.has(odsNum)) {
    activeChipCategories.delete(odsNum);
  } else {
    activeChipCategories.add(odsNum);
  }
  applyFilters();
}

/* ─── Apply filters ──────────────────────── */
function applyFilters() {
  const odsSelect   = document.getElementById('filterODS').value;
  const stateSelect = document.getElementById('filterState').value;
  const cards       = document.querySelectorAll('.proj-card');

  cards.forEach(card => {
    const cardODS   = card.dataset.ods   || '';
    const cardState = card.dataset.state || '';

    const matchesODS   = !odsSelect   || cardODS === odsSelect;
    const matchesState = !stateSelect || cardState.includes(stateSelect);
    const matchesChips = activeChipCategories.size === 0 || activeChipCategories.has(parseInt(cardODS));

    if (matchesODS && matchesState && matchesChips) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

/* ─── Clear filters ──────────────────────── */
function clearFilters() {
  document.getElementById('filterODS').value   = '';
  document.getElementById('filterState').value = '';

  activeChipCategories.clear();
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.remove('active-chip');
  });

  document.querySelectorAll('.proj-card').forEach(card => {
    card.classList.remove('hidden');
  });
}
