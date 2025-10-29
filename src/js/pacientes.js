 document.addEventListener('DOMContentLoaded', () => {
     

      // --- LÓGICA PARA AGREGAR NUEVOS PACIENTES ---
      const patientGrid = document.getElementById('patient-grid');
      const addPatientContainer = document.getElementById('add-patient-card-container');

      const agregarNuevoPaciente = () => {
        const nombrePaciente = prompt("Ingrese el nombre del nuevo paciente:");
        if (nombrePaciente && nombrePaciente.trim() !== '') {
          const nuevaTarjetaHTML = `
            <div class="patient-card card text-center">
              <div class="card-body">
                <div class="patient-icon mb-2"><i class="bi bi-person-fill"></i></div>
                <h6 class="card-title">${nombrePaciente}</h6>
              </div>
            </div>`;
          
          const nuevaColumna = document.createElement('div');
          nuevaColumna.className = 'col-6 col-md-3 col-lg-2 col-xl-2';
          nuevaColumna.innerHTML = nuevaTarjetaHTML;

          patientGrid.insertBefore(nuevaColumna, addPatientContainer);
        }
      };

      if (addPatientContainer) {
        addPatientContainer.addEventListener('click', agregarNuevoPaciente);
      }
    });