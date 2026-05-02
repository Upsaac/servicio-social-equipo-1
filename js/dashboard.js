/* ─────────────────────────────────────────
   Verificación de sesión
   (Comentado para poder navegar libremente en el mockup)
───────────────────────────────────────── */
const sessionData = sessionStorage.getItem('hs_user');

// if (!sessionData) {
//   window.location.href = 'login.html';
// }

const currentUser = sessionData ? JSON.parse(sessionData) : null;

/* ─── Muestra los datos del usuario ──────── */
if (currentUser) {
  const nameEl     = document.getElementById('userName');
  const roleEl     = document.getElementById('userRole');
  const avatarEl   = document.getElementById('userAvatar');

  if (nameEl)   nameEl.textContent   = currentUser.name;
  if (roleEl)   roleEl.textContent   = currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
  if (avatarEl) avatarEl.textContent = currentUser.initials;
}

/* ─── Cerrar sesión ──────────────────────── */
const logoutBtn = document.querySelector('.sb-logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function (e) {
    e.preventDefault();
    sessionStorage.removeItem('hs_user');
    window.location.href = 'login.html';
  });
}

/* ─── Sidebar active state ───────────────── 
   (Eliminado: Ya no es necesario prevenir el click,
   cada archivo HTML tiene su propia clase 'active' correcta)
*/

/* ─── Filter chips ───────────────────────── */
const activeChipCategories = new Set();

function toggleChip(btn, category) {
  btn.classList.toggle('active-chip');
  if (activeChipCategories.has(category)) {
    activeChipCategories.delete(category);
  } else {
    activeChipCategories.add(category);
  }
  applyFilters();
}

/* ─── Apply filters ──────────────────────── */
function applyFilters() {
  const catSelect   = document.getElementById('filterCat').value;
  const stateSelect = document.getElementById('filterState').value;
  const cards       = document.querySelectorAll('.proj-card');

  cards.forEach(card => {
    const cardCat   = card.dataset.category || '';
    const cardState = card.dataset.state    || '';

    const matchesCatSelect   = !catSelect   || cardCat.includes(catSelect);
    const matchesStateSelect = !stateSelect || cardState.includes(stateSelect);
    const matchesChips       = activeChipCategories.size === 0 || activeChipCategories.has(cardCat);

    if (matchesCatSelect && matchesStateSelect && matchesChips) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

/* ─── Clear filters ──────────────────────── */
function clearFilters() {
  document.getElementById('filterCat').value   = '';
  document.getElementById('filterState').value = '';

  activeChipCategories.clear();
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.remove('active-chip');
  });

  document.querySelectorAll('.proj-card').forEach(card => {
    card.classList.remove('hidden');
  });
}