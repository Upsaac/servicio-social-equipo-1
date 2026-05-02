document.addEventListener('DOMContentLoaded', () => {
  
  // Botón Crear Proyecto (Topbar)
  const btnCrear = document.getElementById('btnCrear');
  if(btnCrear) {
    btnCrear.addEventListener('click', () => {
      alert("Redirigiendo a la creación de un nuevo proyecto...");
    });
  }

  // Botones de Solicitar Reunión / Colaboración
  const requestButtons = document.querySelectorAll('.btn-request');
  requestButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Obtenemos el nombre del líder buscando en la misma tarjeta
      const card = this.closest('.leader-card');
      const leaderName = card.querySelector('.leader-name').innerText;
      
      alert(`Has solicitado una reunión con ${leaderName}. Se le enviará una notificación.`);
      
      // Opcional: Cambiar el texto del botón temporalmente para dar feedback visual
      const originalText = this.innerText;
      this.innerText = "¡Solicitud Enviada!";
      this.style.background = "#1D9E75"; // Cambia a verde
      
      setTimeout(() => {
        this.innerText = originalText;
        this.style.background = "#EF9F27"; // Regresa a naranja
      }, 3000);
    });
  });

});