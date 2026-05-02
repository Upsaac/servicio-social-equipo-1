document.addEventListener('DOMContentLoaded', () => {
  
  // Botón Crear Proyecto
  const btnCrear = document.getElementById('btnCrear');
  if(btnCrear) {
    btnCrear.addEventListener('click', () => {
      alert("Abriendo formulario para nuevo proyecto...");
    });
  }

  // Lógica simple para limpiar filtros
  const btnLimpiar = document.getElementById('btnLimpiar');
  const selectFilters = document.querySelectorAll('.filter-select');
  
  if(btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      // Reiniciar selects al primer valor
      selectFilters.forEach(select => {
        select.selectedIndex = 0;
      });
      alert("Filtros limpiados");
    });
  }

  // Interacción visual simple para los chips de filtro (Opcional)
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', function() {
      // Un efecto visual sutil para indicar selección
      this.style.opacity = this.style.opacity === '0.6' ? '1' : '0.6';
    });
  });

});