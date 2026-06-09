/* ── Líderes: carga desde /api/lideres ── */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res     = await fetch('/api/lideres');
    const lideres = await res.json();
    const grid    = document.getElementById('lideresGrid');
    if (!grid) return;

    if (!lideres.length) {
      grid.innerHTML = '<p style="color:#888780;font-size:14px;">No hay líderes registrados.</p>';
      return;
    }

    grid.innerHTML = lideres.map(u => {
      const avatarHtml = u.foto_url
        ? `<img src="${u.foto_url}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid #e2e8f0;"
             onerror="this.outerHTML='<div class=\\'avatar-circle\\'>${u.initials}</div>'">`
        : `<div class="avatar-circle">${u.initials}</div>`;
      return `<div class="leader-card">
        <div class="avatar-box">
          ${avatarHtml}
        </div>
        <h3 class="leader-name">${u.nombre}</h3>
        <div class="tags-container">
          ${u.proyectos.map(p => `<span class="tag tag-orange">${p.nombre}</span>`).join('') || '<span class="tag tag-orange">Sin proyectos activos</span>'}
        </div>
        <div class="leader-stats">
          <div class="stat-col"><span class="stat-lbl">Proyectos<br>Activos</span><span class="stat-val">${u.total_proyectos}</span></div>
          <div class="stat-col"><span class="stat-lbl">Correo</span><span class="stat-val" style="font-size:11px;">${u.email}</span></div>
        </div>
        ${u.matricula ? `<p class="active-project">Matrícula: ${u.matricula}</p>` : ''}
      </div>`;
    }).join('');

    /* Búsqueda */
    const search = document.getElementById('searchLideres');
    if (search) {
      search.addEventListener('input', function () {
        const q = this.value.toLowerCase();
        document.querySelectorAll('.leader-card').forEach(card => {
          const texto = card.textContent.toLowerCase();
          card.style.display = texto.includes(q) ? '' : 'none';
        });
      });
    }

  } catch (e) {
    console.error('lideres.js', e);
  }
});
