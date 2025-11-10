document.addEventListener('DOMContentLoaded', () => {
    
    const createPacienteForm = document.getElementById('create-paciente-form');
    const patientListContainer = document.getElementById('patient-list-container');
    const createPacienteModalEl = document.getElementById('createPacienteModal');
    const createPacienteModal = bootstrap.Modal.getInstance(createPacienteModalEl) || new bootstrap.Modal(createPacienteModalEl);
    const searchForm = document.getElementById('search-user-form'); 
    const searchInput = document.getElementById('search-input'); 
    const searchClearBtn = document.getElementById('search-clear-btn');

    // URL de tu API (asegúrate que el puerto 3001 sea correcto)
    const API_URL = 'http://localhost:3001/api/pacientes';

    let todosLosPacientes = []; // Almacen de Pacientes

    // --- 1. Función de Notificación (Toast) ---
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
    
    // --- 2. Función para Calcular Edad (Utilidad) ---
    const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return '?';
        const hoy = new Date();
        const cumple = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - cumple.getFullYear();
        const m = hoy.getMonth() - cumple.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
            edad--;
        }
        return edad;
    };

    // --- 3. Función para Renderizar UNA tarjeta de paciente ---
    const renderPaciente = (paciente) => {
        if (!paciente || !paciente.persona) {
            console.warn('Intento de renderizar paciente inválido:', paciente);
            return;
        }

        const persona = paciente.persona;
        const edad = calcularEdad(persona.fecha_nacim);
        const iconoSexo = persona.sexo === 'Masc' 
            ? '<i class="bi bi-gender-male text-primary"></i>' 
            : '<i class="bi bi-gender-female text-danger"></i>';

        // Creamos la columna
        const colDiv = document.createElement('div');
        colDiv.className = 'col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 dynamic-patient-card';
        
        // Creamos la tarjeta
        colDiv.innerHTML = `
        <div class="patient-card card h-100 w-100">
            <div class="card-body patient-card-body text-center">
                <div class="patient-avatar mb-2">
                    <i class="bi bi-person-circle text-secondary"></i>
                </div>
                <h6 class="card-title mb-1">${persona.nombres}</h6>
                <p class="card-text text-muted small mb-0">${persona.apellido_pa} ${persona.apellido_mat || ''}</p>
                <p class="card-text text-muted small mb-1">RUT: ${persona.rut || 'N/A'}</p>
                <p class="card-text text-muted small">${edad} años ${iconoSexo}</p>
            </div>
            </div>
        `;
        patientListContainer.insertBefore(colDiv, document.getElementById('add-patient-card-container'));
    };

    const renderListaPacientes = (listaPacientes) => {
        document.querySelectorAll('.dynamic-patient-card').forEach(card => card.remove());

        if (listaPacientes.length === 0) {
            console.log("No se encontraron pacientes.");
        } else {
            listaPacientes.forEach(renderPaciente); 
        }
    };

    // --- 4. Función para Cargar TODOS los pacientes ---
    const cargarPacientes = async () => {
        try {
            const response = await fetch(API_URL); 
            if (!response.ok) {
                throw new Error('No se pudieron cargar los pacientes.');
            }
            const pacientes = await response.json();
            
            todosLosPacientes = pacientes; 
            renderListaPacientes(todosLosPacientes);

        } catch (error) {
            console.error('Error al cargar pacientes:', error);
            showToast('error', error.message);
        }
    };

    // --- 5. Lógica de Búsqueda  ---
    if (searchForm) {
        
        const filtrarPacientes = () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                renderListaPacientes(todosLosPacientes);
                return;
            }

            const pacientesFiltrados = todosLosPacientes.filter(paciente => {
                const persona = paciente.persona;
                if (!persona) return false;

                const nombreCompleto = `${persona.nombres} ${persona.apellido_pa} ${persona.apellido_mat || ''}`.toLowerCase();
                const rut = (persona.rut || '').toLowerCase(); // Buscamos también por RUT

                return nombreCompleto.includes(searchTerm) || rut.includes(searchTerm);
            });

            renderListaPacientes(pacientesFiltrados);
        };

        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            filtrarPacientes();
        });

        searchClearBtn.addEventListener('click', () => {
            searchInput.value = ''; 
            renderListaPacientes(todosLosPacientes); 
        });
    }


    // --- Lógica del Formulario de Creación ---
    if (createPacienteForm) {
        createPacienteForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const pacienteData = {
                rut: document.getElementById('new-rut').value, // <-- AÑADIDO
                nombres: document.getElementById('new-name').value,
                apellido_pa: document.getElementById('new-lastname1').value,
                apellido_mat: document.getElementById('new-lastname2').value,
                sexo: document.getElementById('new-gender').value,
                fecha_nacim: document.getElementById('new_nacimiento').value
            };

            try {
                const response = await fetch(API_URL, { // POST
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
                
                renderPaciente(nuevoPaciente); // <-- Añadimos la tarjeta dinámicamente
                
                createPacienteForm.reset();
                createPacienteModal.hide();

            } catch (error) {
                console.error('Error al crear paciente:', error);
                showToast('error', `Error: ${error.message}`); // <-- Notificación de error
            }
        });
    }

    // --- Carga Inicial ---
    // Carga todos los pacientes cuando la página esté lista
    cargarPacientes();

});