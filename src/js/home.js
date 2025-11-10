document.addEventListener('DOMContentLoaded', () => {

    // --- Referencias del DOM ---
    const createPacienteForm = document.getElementById('create-paciente-form');
    const createPacienteModalEl = document.getElementById('createPacienteModal');
    const createPacienteModal = bootstrap.Modal.getInstance(createPacienteModalEl) || new bootstrap.Modal(createPacienteModalEl);
    
    // --- DOM específico de Home ---
    const patientGrid = document.getElementById('patient-grid');
    const auditTableBody = document.getElementById('audit-table-body');
    const addPatientCardContainer = document.getElementById('add-patient-card-container'); // Referencia a la tarjeta "Agregar"

    // URLs de tu API
    const PACIENTES_API_URL = 'http://localhost:3001/api/pacientes';
    const AUDITORIA_API_URL = 'http://localhost:3001/api/auditoria'; // (Ajusta esta URL si es diferente)

    // --- 1. Función de Notificación (Toast) ---
    // (Copiada de pacientes.js)
    const showToast = (icon, title) => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        Toast.fire({ icon, title });
    };
    
    // --- 2. Función para Renderizar UNA tarjeta de paciente (Estilo Home) ---
    // (Versión simplificada para el dashboard)
    const renderSimplePaciente = (paciente) => {
        if (!paciente || !paciente.persona) {
            console.warn('Intento de renderizar paciente inválido:', paciente);
            return;
        }

        const persona = paciente.persona;

        // Creamos la columna
        const colDiv = document.createElement('div');
        colDiv.className = 'col-6 col-md-3 col-lg-2 col-xl-2 dynamic-patient-card'; // Clases del grid de home
        
        // Creamos la tarjeta (estilo simple de home)
        colDiv.innerHTML = `
            <div class="patient-card card text-center h-100">
                <div class="card-body d-flex flex-column justify-content-center align-items-center">
                    <div class="patient-icon mb-2" style="font-size: 2rem;">
                        <i class="bi bi-person-fill text-secondary"></i>
                    </div>
                    <h6 class="card-title mb-0">${persona.nombres}</h6>
                    <p class="card-text text-muted small mb-0">${persona.apellido_pa}</p>
                </div>
                </div>
        `;

        // Añadimos la tarjeta al grid, ANTES del botón "Agregar"
        patientGrid.insertBefore(colDiv, addPatientCardContainer);
    };

    // --- 3. Función para Cargar Pacientes Recientes ---
    const cargarPacientesRecientes = async () => {
        // Limpiamos tarjetas dinámicas previas (por si acaso)
        document.querySelectorAll('.dynamic-patient-card').forEach(card => card.remove());

        try {
            // Pedimos solo los 5 más recientes (puedes ajustar el límite)
            const response = await fetch(`${PACIENTES_API_URL}?limit=5`); 
            if (!response.ok) {
                throw new Error('No se pudieron cargar los pacientes.');
            }
            const pacientes = await response.json();
            
            if (pacientes.length === 0) {
                // (Opcional) Mostrar mensaje si no hay pacientes
            } else {
                pacientes.forEach(renderSimplePaciente); // Usamos el render simple
            }

        } catch (error) {
            console.error('Error al cargar pacientes:', error);
            // No mostramos toast de error aquí para no ser invasivos en el Home
        }
    };

    // --- 4. Función para Cargar Auditoría Reciente ---
    const cargarAuditoriaReciente = async () => {
        try {
            // Pedimos solo el último registro
            const response = await fetch(`${AUDITORIA_API_URL}?limit=1`); 
            if (!response.ok) {
                throw new Error('No se pudo cargar la auditoría.');
            }
            const auditorias = await response.json();

            // Limpiamos la fila de "Cargando..."
            auditTableBody.innerHTML = ''; 

            if (auditorias.length === 0) {
                auditTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay registros de auditoría.</td></tr>';
            } else {
                const log = auditorias[0];
                
                // Formateamos la fecha (puedes mejorar esto con una librería)
                const fecha = new Date(log.timestamp).toLocaleString('es-CL');
                
                // Creamos la fila
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${fecha}</td>
                    <td>${log.usuario ? log.usuario.username : 'N/A'}</td>
                    <td>${log.accion || 'N/A'}</td>
                    <td>${log.paciente ? (log.paciente.persona.nombres + ' ' + log.paciente.persona.apellido_pa) : 'N/A'}</td>
                `;
                auditTableBody.appendChild(row);
            }

        } catch (error) {
            console.error('Error al cargar auditoría:', error);
            auditTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar la auditoría.</td></tr>`;
        }
    };


    // --- 5. Lógica del Formulario de Creación (Copiada de pacientes.js) ---
    if (createPacienteForm) {
        createPacienteForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const pacienteData = {
                rut: document.getElementById('new-rut').value,
                nombres: document.getElementById('new-name').value,
                apellido_pa: document.getElementById('new-lastname1').value,
                apellido_mat: document.getElementById('new-lastname2').value,
                sexo: document.getElementById('new-gender').value,
                fecha_nacim: document.getElementById('new_nacimiento').value
            };

            try {
                const response = await fetch(PACIENTES_API_URL, { // POST
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pacienteData)
                });

                if (!response.ok) {
                    let errorMsg = `Error ${response.status}: ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.msg || JSON.stringify(errorData);
                    } catch (e) { /* Usar statusText */ }
                    throw new Error(errorMsg);
                }

                const nuevoPaciente = await response.json();

                // --- ¡ÉXITO! ---
                showToast('success', '¡Paciente creado exitosamente!');
                
                renderSimplePaciente(nuevoPaciente); 
                
                createPacienteForm.reset();
                createPacienteModal.hide();

                // Opcional: Si se crea un paciente, quizás quieras recargar la auditoría
                cargarAuditoriaReciente();

            } catch (error) {
                console.error('Error al crear paciente:', error);
                showToast('error', `Error: ${error.message}`);
            }
        });
    }

    // --- Carga Inicial ---
    cargarPacientesRecientes();
    cargarAuditoriaReciente();

});