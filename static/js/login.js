const emailInput = document.getElementById('email');
const roleBadge  = document.getElementById('roleBadge');
const errorMsg   = document.getElementById('errorMsg');
const loginForm  = document.getElementById('loginForm');

emailInput.addEventListener('input', function () {
  const val   = this.value.trim();
  const isTec = (val.includes('@tec.mx') || val.includes('@itesm.mx')) && val.includes('@');

  if (isTec) {
    roleBadge.className = 'role-badge visible user';
    roleBadge.textContent = 'Acceso: Estudiante / Usuario';
  } else if (val.includes('@') && val.length > 5) {
    roleBadge.className = 'role-badge visible admin';
    roleBadge.textContent = 'Verificando acceso...';
  } else {
    roleBadge.className = 'role-badge';
  }
  errorMsg.className = 'error-msg';
});

loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const email    = emailInput.value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) { showError('Por favor completa todos los campos.'); return; }

  const btn = loginForm.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Entrando...';

  try {
    const res  = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.ok) {
      window.location.href = '/dashboard';
    } else {
      showError(data.error || 'Credenciales incorrectas.');
      btn.disabled = false;
      btn.textContent = 'Iniciar sesión';
    }
  } catch {
    showError('Error de conexión. Intenta de nuevo.');
    btn.disabled = false;
    btn.textContent = 'Iniciar sesión';
  }
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.className   = 'error-msg visible';
}
