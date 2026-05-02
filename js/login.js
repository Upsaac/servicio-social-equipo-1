/* ─────────────────────────────────────────
   Usuarios de prueba (hardcodeados)
   Cuando tengas backend, reemplaza la función
   authenticateUser() con un fetch a tu API.
───────────────────────────────────────── */
const TEST_USERS = [
  {
    email: 'mario@tec.mx',
    password: '1234',
    name: 'Mario González',
    role: 'usuario',
    initials: 'MG',
    redirect: 'dashboard.html'
  },
  {
    email: 'admin@serviciosocial.mx',
    password: 'admin1234',
    name: 'Admin General',
    role: 'admin',
    initials: 'AG',
    redirect: 'dashboard.html'   // Cambia a 'admin.html' cuando lo tengas
  }
];

/* ─── Elementos del DOM ──────────────────── */
const emailInput = document.getElementById('email');
const roleBadge  = document.getElementById('roleBadge');
const errorMsg   = document.getElementById('errorMsg');
const loginForm  = document.getElementById('loginForm');

/* ─── Detecta el rol mientras escribe ───── */
emailInput.addEventListener('input', function () {
  const val     = this.value.trim();
  const isAdmin = val.includes('@serviciosocial') || val.startsWith('admin@');
  const isTec   = (val.includes('@tec.mx') || val.includes('@itesm.mx')) && val.includes('@');

  if (isAdmin) {
    roleBadge.className = 'role-badge visible admin';
    roleBadge.textContent = 'Acceso: Administrador';
  } else if (isTec) {
    roleBadge.className = 'role-badge visible user';
    roleBadge.textContent = 'Acceso: Estudiante / Usuario';
  } else {
    roleBadge.className = 'role-badge';
  }

  errorMsg.className = 'error-msg';
});

/* ─── Autenticación ──────────────────────── */
function authenticateUser(email, password) {
  return TEST_USERS.find(
    u => u.email === email.trim().toLowerCase() && u.password === password
  ) || null;
}

/* ─── Submit ─────────────────────────────── */
loginForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const email    = emailInput.value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showError('Por favor completa todos los campos.');
    return;
  }

  const isTec   = email.includes('@tec.mx') || email.includes('@itesm.mx');
  const isAdmin = email.includes('@serviciosocial') || email.startsWith('admin@');

  if (!isTec && !isAdmin) {
    showError('Solo se permiten correos institucionales (@tec.mx o @itesm.mx).');
    return;
  }

  const user = authenticateUser(email, password);

  if (!user) {
    showError('Correo o contraseña incorrectos.');
    return;
  }

  /* Guarda la sesión en sessionStorage y redirige */
  sessionStorage.setItem('hs_user', JSON.stringify({
    name:     user.name,
    role:     user.role,
    initials: user.initials,
    email:    user.email
  }));

  window.location.href = user.redirect;
});

/* ─── Helpers ────────────────────────────── */
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.className = 'error-msg visible';
}