/* ── Sidebar: carga usuario desde Flask session via /api/me ── */
(async function () {
  try {
    const res = await fetch('/api/me');
    if (res.status === 401) {
      // Solo las páginas de escritura redirigen al login
      const RUTAS_PROTEGIDAS = ['/crear-proyecto', '/editar-proyecto', '/registrar-actividad',
                                 '/reporte-beneficiarios', '/perfil', '/configuracion'];
      const esProtegida = RUTAS_PROTEGIDAS.some(r => window.location.pathname.startsWith(r));
      if (esProtegida) {
        window.location.href = '/login';
        return;
      }

      // Modo visitante: mostrar estado sin sesión en el sidebar
      const avatarEl = document.getElementById('userAvatar');
      const nameEl   = document.getElementById('userName');
      const roleEl   = document.getElementById('userRole');
      if (avatarEl) avatarEl.textContent = '?';
      if (nameEl)   nameEl.textContent   = 'Visitante';
      if (roleEl)   roleEl.textContent   = 'Sin sesión';

      // El click en avatar/nombre lleva a /login en vez de /perfil
      const sbUserLink = document.querySelector('.sb-user a');
      if (sbUserLink) sbUserLink.href = '/login';

      // Ocultar logout y botones de escritura
      const logoutBtn = document.querySelector('.sb-logout');
      if (logoutBtn) logoutBtn.style.display = 'none';
      const btnNuevo = document.getElementById('btnNuevoProyecto');
      if (btnNuevo) btnNuevo.style.display = 'none';
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
      return;
    }
    const user = await res.json();

    const nameEl   = document.getElementById('userName');
    const roleEl   = document.getElementById('userRole');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl)   nameEl.textContent   = user.nombre;
    if (roleEl)   roleEl.textContent   = user.rol === 'admin' ? 'Administrador' : 'Usuario';
    if (avatarEl) avatarEl.textContent = user.initials;

    window._hsUser = user;

    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = user.rol === 'admin' ? '' : 'none';
    });
    document.querySelectorAll('.user-only').forEach(el => {
      el.style.display = user.rol === 'admin' ? 'none' : '';
    });

    const btnNuevo = document.getElementById('btnNuevoProyecto');
    if (btnNuevo && user.rol !== 'admin') btnNuevo.style.display = 'none';

    /* Si es líder, añadir "Mis proyectos" al sidebar */
    if (user.rol === 'lider') {
      cargarMisProyectos();
    }

  } catch (e) {
    console.error('sidebar.js: error cargando usuario', e);
  }
})();

async function cargarMisProyectos() {
  try {
    const res  = await fetch('/api/proyectos');
    const todos = await res.json();
    const mios  = todos.filter(p => p.lider && window._hsUser && p.lider.id === window._hsUser.id);
    if (!mios.length) return;

    const nav = document.querySelector('.sb-nav');
    if (!nav) return;

    const seccion = document.createElement('div');
    seccion.style.cssText = 'padding:8px 0 0; border-top:1px solid rgba(255,255,255,0.12); margin-top:8px;';
    seccion.innerHTML = `
      <div style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.5);padding:4px 16px 6px;letter-spacing:.06em;text-transform:uppercase;">
        Mis proyectos
      </div>
      ${mios.map(p => `
        <a href="/proyectos/${p.id}" class="sb-item" style="${window.location.pathname === '/proyectos/'+p.id ? 'background:rgba(255,255,255,0.12);' : ''}">
          <svg class="sb-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" clip-rule="evenodd"/>
          </svg>
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${p.nombre}</span>
        </a>`).join('')}
    `;
    nav.appendChild(seccion);
  } catch (e) {
    console.error('sidebar.js: error cargando mis proyectos', e);
  }
}
