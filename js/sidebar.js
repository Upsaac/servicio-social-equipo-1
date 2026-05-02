/* ── Shared sidebar: session user display + logout ── */
(function () {
  const sessionData = sessionStorage.getItem('hs_user');
  const currentUser = sessionData ? JSON.parse(sessionData) : null;

  const nameEl   = document.getElementById('userName');
  const roleEl   = document.getElementById('userRole');
  const avatarEl = document.getElementById('userAvatar');

  if (currentUser) {
    if (nameEl)   nameEl.textContent   = currentUser.name;
    if (roleEl)   roleEl.textContent   = currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
    if (avatarEl) avatarEl.textContent = currentUser.initials;
  }

  const logoutBtn = document.querySelector('.sb-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      sessionStorage.removeItem('hs_user');
      window.location.href = 'login.html';
    });
  }

  const btnNuevo = document.getElementById('btnNuevoProyecto');
  if (btnNuevo) {
    const isAdmin = currentUser && currentUser.role === 'admin';
    if (!isAdmin) btnNuevo.style.display = 'none';
  }
})();
