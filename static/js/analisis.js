/* ── Análisis: Chart.js con datos reales de /api/dashboard ── */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res  = await fetch('/api/dashboard');
    const data = await res.json();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('an-proyectos',    data.proyectos_activos);
    set('an-beneficiarios', (data.total_beneficiarios || 0).toLocaleString('es-MX'));
    set('an-actividades',  data.total_actividades);
    set('an-lideres',      data.total_lideres);

    const proyectos = data.proyectos || [];
    const odsData   = data.ods_impactados || [];

    /* Gráfica de barras: beneficiarios por proyecto */
    const ctxBar = document.getElementById('chartBarProyectos');
    if (ctxBar && proyectos.length) {
      new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: proyectos.map(p => p.nombre.length > 20 ? p.nombre.slice(0, 20) + '…' : p.nombre),
          datasets: [{
            label: 'Beneficiarios',
            data:  proyectos.map(p => p.beneficiarios || 0),
            backgroundColor: proyectos.map(p => (p.ods[0] || {}).color || '#185FA5'),
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 11 } } },
            y: { beginAtZero: true },
          },
        },
      });
    }

    /* Gráfica de barras: proyectos por ODS */
    const ctxODS = document.getElementById('chartODS');
    if (ctxODS && odsData.length) {
      new Chart(ctxODS, {
        type: 'bar',
        data: {
          labels: odsData.map(o => `ODS ${o.numero}`),
          datasets: [{
            label: 'Proyectos',
            data:  odsData.map(o => o.count),
            backgroundColor: odsData.map(o => o.color),
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }

    /* Dona: distribución de beneficiarios */
    const ctxDona = document.getElementById('chartDona');
    if (ctxDona && proyectos.length) {
      const conBeneficiarios = proyectos.filter(p => (p.beneficiarios || 0) > 0);
      if (conBeneficiarios.length) {
        new Chart(ctxDona, {
          type: 'doughnut',
          data: {
            labels: conBeneficiarios.map(p => p.nombre.length > 25 ? p.nombre.slice(0, 25) + '…' : p.nombre),
            datasets: [{
              data: conBeneficiarios.map(p => p.beneficiarios),
              backgroundColor: conBeneficiarios.map(p => (p.ods[0] || {}).color || '#185FA5'),
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom', labels: { font: { size: 11 } } },
            },
          },
        });
      }
    }

  } catch (e) {
    console.error('analisis.js', e);
  }

  const btnExportar = document.getElementById('btnExportar');
  if (btnExportar) {
    btnExportar.addEventListener('click', () => {
      alert('Exportación no disponible en esta versión.');
    });
  }
});
