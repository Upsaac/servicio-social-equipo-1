document.addEventListener('DOMContentLoaded', () => {
  
  // Botón superior
  const btnCrear = document.getElementById('btnCrear');
  if(btnCrear) {
    btnCrear.addEventListener('click', () => {
      alert("Redirigiendo al formulario de nuevo proyecto...");
    });
  }

  // Lógica interactiva para los eventos del calendario
  const eventChips = document.querySelectorAll('.event-chip');
  const detName = document.getElementById('detName');
  const detProj = document.getElementById('detProj');
  const detLead = document.getElementById('detLead');
  const detImpact = document.getElementById('detImpact');

  // Base de datos simulada para los eventos
  const eventsData = {
    "1": {
      name: "Event Name: Education Seminar",
      project: "Associated Project: Future Scholars",
      leader: "Leader in Charge: Carlos Sanchez",
      impact: "Expected Impact: 120 Teachers trained"
    },
    "2": {
      name: "Event Name: Reforestation Day",
      project: "Associated Project: Green Harvest",
      leader: "Leader in Charge: Maria Garcia",
      impact: "Expected Impact: 500 Trees planted"
    },
    "3": {
      name: "Event Name: Health Brigade",
      project: "Associated Project: Healthy Communities",
      leader: "Leader in Charge: Ana Lopez",
      impact: "Expected Impact: 200 Medical checkups"
    }
  };

  // Agregar evento clic a cada "burbuja" del calendario
  eventChips.forEach(chip => {
    chip.addEventListener('click', function(e) {
      // Evitar que el clic haga cosas raras
      e.stopPropagation(); 
      
      const eventId = this.getAttribute('data-id');
      const data = eventsData[eventId];

      if(data) {
        // Efecto visual: difuminar un poco la tarjeta y luego actualizar
        const card = document.getElementById('eventDetails');
        card.style.opacity = '0.5';
        
        setTimeout(() => {
          detName.innerText = data.name;
          detProj.innerText = data.project;
          detLead.innerText = data.leader;
          detImpact.innerText = data.impact;
          card.style.opacity = '1';
        }, 200);
      }
    });
  });

});