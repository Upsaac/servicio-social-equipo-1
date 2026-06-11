/* ── Análisis: Chart.js con datos reales de /api/dashboard ── */

function _descargarCSV(filas, nombreArchivo) {
  const csv = filas.map(fila =>
    fila.map(celda => {
      const s = String(celda == null ? '' : celda);
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? '"' + s.replace(/"/g, '""') + '"'
        : s;
    }).join(',')
  ).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = nombreArchivo; a.click();
  URL.revokeObjectURL(url);
}

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

    /* ── Métricas globales ── */
    const metGlobales = (data.metricas_globales || []).filter(m => m.tipo === 'numero');
    if (metGlobales.length) {
      const section  = document.getElementById('metricasGlobalesSection');
      const kpiGrid  = document.getElementById('metricasGlobalesKpi');
      const chartsEl = document.getElementById('metricasGlobalesCharts');
      if (section) section.style.display = '';

      const KPI_PALETTES = [
        { bg: '#E6F1FB', color: '#185FA5', iconBg: 'icon-blue-light' },
        { bg: '#E1F5EE', color: '#1D9E75', iconBg: 'icon-green-light' },
        { bg: '#FAEEDA', color: '#EF9F27', iconBg: 'icon-yellow-light' },
        { bg: '#EEEDFE', color: '#7F77DD', iconBg: 'icon-purple-light' },
      ];

      /* KPI cards */
      if (kpiGrid) {
        kpiGrid.innerHTML = metGlobales.map((m, i) => {
          const pal   = KPI_PALETTES[i % KPI_PALETTES.length];
          const total = m.total_global !== null && m.total_global !== undefined
            ? m.total_global.toLocaleString('es-MX') + (m.unidad ? ' ' + m.unidad : '')
            : '—';
          return `<div class="kpi-card-simple">
            <p class="kpi-title">${m.nombre}</p>
            <h3 class="kpi-val-large" style="color:${pal.color};">${total}</h3>
            <p class="kpi-sub" style="color:${pal.color};">total global</p>
            <div class="kpi-icon-bottom ${pal.iconBg}">
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
            </div>
          </div>`;
        }).join('');
      }

      /* Gráficas dinámicas por métrica */
      if (chartsEl) {
        metGlobales.forEach(m => {
          const conValor = (m.valores_por_proyecto || []).filter(v => v.valor !== null && v.valor !== undefined);
          if (!conValor.length) return;

          /* Barra: distribución por proyecto */
          const boxBar = document.createElement('div');
          boxBar.className = 'chart-box';
          const canvasBar = document.createElement('canvas');
          canvasBar.style.maxHeight = '280px';
          boxBar.innerHTML = `<h4 class="chart-title">Distribución de ${m.nombre} por proyecto${m.unidad ? ' (' + m.unidad + ')' : ''}</h4>`;
          boxBar.appendChild(canvasBar);
          chartsEl.appendChild(boxBar);

          new Chart(canvasBar, {
            type: 'bar',
            data: {
              labels: conValor.map(v => v.proyecto_nombre.length > 20 ? v.proyecto_nombre.slice(0, 20) + '…' : v.proyecto_nombre),
              datasets: [{
                label: m.nombre,
                data:  conValor.map(v => v.valor),
                backgroundColor: conValor.map(v => v.color || '#185FA5'),
                borderRadius: 6,
              }],
            },
            options: {
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            },
          });

          /* Dona: distribución porcentual si ≥3 proyectos con valor */
          if (conValor.length >= 3) {
            const boxDona = document.createElement('div');
            boxDona.className = 'chart-box';
            const canvasDona = document.createElement('canvas');
            canvasDona.style.cssText = 'max-height:280px;max-width:280px;margin:0 auto;display:block;';
            boxDona.innerHTML = `<h4 class="chart-title">${m.nombre} por proyecto (%)</h4>`;
            boxDona.appendChild(canvasDona);
            chartsEl.appendChild(boxDona);

            new Chart(canvasDona, {
              type: 'doughnut',
              data: {
                labels: conValor.map(v => v.proyecto_nombre.length > 22 ? v.proyecto_nombre.slice(0, 22) + '…' : v.proyecto_nombre),
                datasets: [{
                  data:            conValor.map(v => v.valor),
                  backgroundColor: conValor.map(v => v.color || '#185FA5'),
                }],
              },
              options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
              },
            });
          }
        });
      }
    }

    /* Exportar reporte global */
    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) {
      btnExportar.addEventListener('click', () => {
        const hoy    = new Date().toLocaleDateString('es-MX');
        const filas  = [];

        filas.push(['Reporte Global — Huella Solidaria']);
        filas.push(['Fecha de generación', hoy]);
        filas.push([]);
        filas.push(['RESUMEN GENERAL']);
        filas.push(['Proyectos activos',   data.proyectos_activos   || 0]);
        filas.push(['Total beneficiarios', data.total_beneficiarios || 0]);
        filas.push(['Total actividades',   data.total_actividades   || 0]);
        filas.push(['Líderes activos',     data.total_lideres       || 0]);
        filas.push(['Zonas de intervención', data.zonas_intervencion || 0]);
        filas.push([]);
        filas.push(['PROYECTOS']);
        filas.push(['Nombre','Estado','ODS','Ubicación','Beneficiarios','Meta','Avance (%)','Actividades']);

        (data.proyectos || []).forEach(p => {
          const odsList = (p.ods || []).map(o => `ODS ${o.numero}`).join(' | ');
          filas.push([
            p.nombre       || '',
            p.estado       || '',
            odsList,
            p.ubicacion    || '',
            p.beneficiarios || 0,
            p.meta_beneficiarios || '',
            p.avance_pct   || 0,
            (p.actividades || []).length,
          ]);
        });

        if ((data.metricas_globales || []).some(m => m.tipo === 'numero')) {
          filas.push([]);
          filas.push(['MÉTRICAS GLOBALES']);
          filas.push(['Métrica','Unidad','Total global']);
          (data.metricas_globales || []).filter(m => m.tipo === 'numero').forEach(m => {
            filas.push([m.nombre, m.unidad || '', m.total_global ?? '—']);
          });
        }

        _descargarCSV(filas, `Reporte_Global_Huella_Solidaria_${hoy.replace(/\//g,'-')}.csv`);
      });
    }

  } catch (e) {
    console.error('analisis.js', e);
  }
});
