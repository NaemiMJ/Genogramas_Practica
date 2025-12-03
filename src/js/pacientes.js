document.addEventListener('DOMContentLoaded', () => {
    
    const createPacienteForm = document.getElementById('create-paciente-form');
    const patientListContainer = document.getElementById('patient-list-container');
    const createPacienteModalEl = document.getElementById('createPacienteModal');
    const createPacienteModal = bootstrap.Modal.getInstance(createPacienteModalEl) || new bootstrap.Modal(createPacienteModalEl);
    
    const searchForm = document.getElementById('search-user-form'); 
    const searchInput = document.getElementById('search-input'); 
    const searchClearBtn = document.getElementById('search-clear-btn');

    const API_URL = 'http://localhost:3001/api/pacientes';
    let todosLosPacientes = []; 

    // ==========================================
    // 1. DETECCIÓN DE ROL (Segura)
    // ==========================================
    const getUserRole = () => {
        // Busca 'rol' o 'role' directo
        let rol = localStorage.getItem('rol') || localStorage.getItem('role');
        
        // Si no, busca dentro de un objeto 'usuario' o 'user'
        if (!rol) {
            const usuarioGuardado = localStorage.getItem('usuario') || localStorage.getItem('user');
            if (usuarioGuardado) {
                try {
                    const usuarioObj = JSON.parse(usuarioGuardado);
                    rol = usuarioObj.rol || usuarioObj.role || usuarioObj.tipo;
                } catch (e) {
                    console.warn("Error leyendo usuario de localStorage", e);
                }
            }
        }
        return rol || 'Usuario'; 
    };

    // Comprobamos si es Administrador (ajusta el string según tu BD)
    const rolDetectado = getUserRole();
    const esAdmin = rolDetectado === 'Administrador' || rolDetectado === 'admin';
    console.log("Rol:", rolDetectado, "| Admin:", esAdmin);

    // --- Utilerías ---

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
    
   const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return '?';
        const hoy = new Date();
        const cumple = new Date(fechaNacimiento); 
        let edad = hoy.getFullYear() - cumple.getUTCFullYear();
        const m = hoy.getMonth() - cumple.getUTCMonth(); 
        if (m < 0 || (m === 0 && hoy.getDate() < cumple.getUTCDate())) {
            edad--;
        }
        return edad;
    };

    const formatearRut = (rut) => {
        if (!rut) return 'N/A';
        let valor = rut.toString().replace(/[^0-9kK]/g, '');
        if (valor.length < 2) return rut;
        
        let cuerpo = valor.slice(0, -1);
        let dv = valor.slice(-1).toUpperCase();
        cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${cuerpo}-${dv}`;
    };

    // ==========================================
    // 2. RENDERIZADO DE TARJETAS
    // ==========================================
    const renderPaciente = (paciente) => {
        if (!paciente || !paciente.persona) return;

        const persona = paciente.persona;
        const edad = calcularEdad(persona.fecha_nacim);
        const rutFormateado = formatearRut(persona.rut);

        const iconoSexo = persona.sexo === 'Masc' 
            ? '<i class="bi bi-gender-male text-primary"></i>' 
            : '<i class="bi bi-gender-female text-danger"></i>';

        // Lógica Visual: Activo / Inactivo
        const estaActivo = paciente.activo !== false; 
        const opacityStyle = estaActivo ? '' : 'opacity: 0.6; filter: grayscale(100%);';
        const badgeEstado = estaActivo ? '' : '<span class="badge bg-secondary position-absolute top-0 start-0 m-2" style="z-index: 5;">Inactivo</span>';

        const colDiv = document.createElement('div');
        colDiv.className = 'col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 dynamic-patient-card';
        colDiv.id = `paciente-card-${paciente._id}`; 
        
        // Botón Admin (Solo si es Admin)
        let botonGestion = '';
        if (esAdmin) {
            botonGestion = `
            <button class="btn btn-sm btn-danger btn-gestionar-paciente" 
                    title="Gestionar"
                    style="position: absolute; top: 5px; right: 5px; z-index: 100; border-radius: 50%; width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center;">
                <i class="bi bi-gear-fill" style="font-size: 0.9rem;"></i>
            </button>`;
        }

        colDiv.innerHTML = `
        <div class="patient-card card h-100 w-100 position-relative" style="${opacityStyle}">
            ${badgeEstado}
            ${botonGestion}
            <div class="card-body patient-card-body text-center" style="cursor: pointer;">
                <div class="patient-avatar mb-2">
                    ${paciente.foto_url 
                        ? `<img src="${paciente.foto_url}" class="rounded-circle" style="width:50px; height:50px; object-fit:cover;">` 
                        : `<i class="bi bi-person-circle text-secondary" style="font-size: 2rem;"></i>`
                    }
                </div>
                <h6 class="card-title mb-1">${persona.nombres}</h6>
                <p class="card-text text-muted small mb-0">${persona.apellido_pa} ${persona.apellido_mat || ''}</p>
                <p class="card-text text-muted small mb-1">RUT: ${rutFormateado}</p>
                <p class="card-text text-muted small">${edad} años ${iconoSexo}</p>
            </div>
        </div>
        `;
        
        patientListContainer.insertBefore(colDiv, document.getElementById('add-patient-card-container'));

        // Click en tarjeta -> Ver detalle
        colDiv.querySelector('.patient-card-body').addEventListener('click', () => {
            window.location.href = `../../pages/paciente_especifico.html?id=${paciente._id}`;
        });

        // Click en engranaje -> Gestionar (Solo Admin)
        if (esAdmin) {
            const btn = colDiv.querySelector('.btn-gestionar-paciente');
            if(btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    handleGestionarPaciente(paciente); 
                });
            }
        }
    };

    const renderListaPacientes = (listaPacientes) => {
        document.querySelectorAll('.dynamic-patient-card').forEach(card => card.remove());
        listaPacientes.forEach(renderPaciente); 
    };

    const cargarPacientes = async () => {
        try {
            const response = await fetch(API_URL); 
            if (!response.ok) throw new Error('Error al cargar');
            todosLosPacientes = await response.json();
            renderListaPacientes(todosLosPacientes);
        } catch (error) {
            console.error(error);
            showToast('error', 'Error al cargar pacientes');
        }
    };

    // ==========================================
    // 3. BÚSQUEDA INTELIGENTE
    // ==========================================
   if (searchForm) {
        const noResultsMessage = document.getElementById('no-results-message');

        const toggleClearButton = (show) => {
            if (show) {
                searchClearBtn.classList.remove('d-none');
            } else {
                searchClearBtn.classList.add('d-none');
            }
        };

        const filtrarPacientes = () => {
        const terminoInput = searchInput.value.toLowerCase().trim();
        
        // 1. Manejo del botón 'X' de limpiar
        if (terminoInput.length > 0) {
            searchClearBtn.classList.remove('d-none');
        } else {
            searchClearBtn.classList.add('d-none');
        }

        // 2. Si no hay nada escrito, mostrar todos
        if (terminoInput === '') {
            renderListaPacientes(todosLosPacientes);
            if (document.getElementById('no-results-message')) {
                document.getElementById('no-results-message').classList.add('d-none');
            }
            return;
        }

        // 3. Preparar términos de búsqueda
        // A) Término limpio para RUT (solo números y k)
        const terminoRut = terminoInput.replace(/[^0-9kK]/g, ''); 
        
        const pacientesFiltrados = todosLosPacientes.filter(paciente => {
            const p = paciente.persona;
            if (!p) return false;

            // --- BÚSQUEDA POR NOMBRE Y APELLIDO ---
            // Creamos una sola cadena con todo: "Juan Andres Perez Gonzalez"
            const nombreCompleto = `${p.nombres || ''} ${p.apellido_pa || ''} ${p.apellido_mat || ''}`.toLowerCase();
            
            // Verificamos si lo que escribiste está contenido en esa cadena
            const coincideNombre = nombreCompleto.includes(terminoInput);

            // --- BÚSQUEDA POR RUT ---
            let coincideRut = false;
            if (p.rut) {
                const rutPacienteLimpio = p.rut.replace(/[^0-9kK]/g, '').toLowerCase();
                
                // Solo buscamos por RUT si el usuario escribió algún número o 'k'
                if (terminoRut.length > 0) {
                    coincideRut = rutPacienteLimpio.includes(terminoRut);
                }
                // También permitimos buscar por el formato exacto (ej: 12.345)
                if (p.rut.toLowerCase().includes(terminoInput)) {
                    coincideRut = true;
                }
            }

            // Si coincide el nombre O coincide el RUT, devuelve verdadero
            return coincideNombre || coincideRut;
        });

        // 4. Renderizar resultados
        renderListaPacientes(pacientesFiltrados);

        // 5. Mostrar mensaje si no hay resultados
        const noResultsMessage = document.getElementById('no-results-message');
        if (noResultsMessage) {
            if (pacientesFiltrados.length === 0) {
                noResultsMessage.classList.remove('d-none');
            } else {
                noResultsMessage.classList.add('d-none');
            }
        }
    };
        // Event Listeners
        searchForm.addEventListener('submit', (e) => { 
            e.preventDefault(); 
            filtrarPacientes(); 
        });

        searchClearBtn.addEventListener('click', () => { 
            searchInput.value = ''; 
            filtrarPacientes(); 
            searchInput.focus(); // Devolver el foco al input
        });

        searchInput.addEventListener('input', filtrarPacientes);
    }

    // ==========================================
    // 4. GESTIÓN ADMIN (Eliminar / Desactivar)
    // ==========================================
    const handleGestionarPaciente = async (paciente) => {
        const estaActivo = paciente.activo !== false;
        
        const result = await Swal.fire({
            title: 'Gestión de Paciente',
            text: `Acciones para ${paciente.persona.nombres}`,
            icon: 'question',
            showDenyButton: true,       
            showCancelButton: true,     
            confirmButtonText: 'Eliminar Permanentemente', 
            confirmButtonColor: '#d33',
            denyButtonText: estaActivo ? "Desactivar" : "Activar",                   
            denyButtonColor: estaActivo ? "#f0ad4e" : "#198754",
            cancelButtonText: 'Cancelar'
        });

        // A. Hard Delete (Borrar BD)
        if (result.isConfirmed) {
            const confirmDelete = await Swal.fire({
                title: '¿Seguro?',
                text: "Se borrarán todos los datos y archivos permanentemente.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar'
            });

            if (confirmDelete.isConfirmed) {
                try {
                    const res = await fetch(`${API_URL}/${paciente._id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Error al eliminar');
                    
                    showToast('success', 'Paciente eliminado');
                    todosLosPacientes = todosLosPacientes.filter(p => p._id !== paciente._id);
                    document.getElementById(`paciente-card-${paciente._id}`).remove();
                } catch (err) {
                    showToast('error', err.message);
                }
            }
        } 
        // B. Soft Delete (Activar/Desactivar)
        else if (result.isDenied) {
            try {
                const res = await fetch(`${API_URL}/${paciente._id}/estado`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ activo: !estaActivo })
                });

                if (!res.ok) throw new Error('Error al cambiar estado');
                const data = await res.json();
                
                showToast('success', data.msg);
                
                // Actualizar localmente
                const index = todosLosPacientes.findIndex(p => p._id === paciente._id);
                if (index !== -1) {
                    todosLosPacientes[index] = data.paciente;
                    renderListaPacientes(todosLosPacientes); 
                }
            } catch (err) {
                showToast('error', err.message);
            }
        }
    };

    // ==========================================
    // 5. CREAR PACIENTE (CORREGIDO)
    // ==========================================
    if (createPacienteForm) {
        createPacienteForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Capturar datos usando FormData (Requiere name="..." en HTML)
            const formData = new FormData(createPacienteForm);

            // 2. Construir objeto PLANO para enviar al Backend
            const pacienteData = {
                rut: formData.get('rut'),
                nombres: formData.get('nombres'),
                apellido_pa: formData.get('apellido_pa'),
                apellido_mat: formData.get('apellido_mat'),
                sexo: formData.get('sexo'),
                fecha_nacim: formData.get('fecha_nacim'),
                // Si agregas más campos, ponlos aquí directos
            };

            // Validación simple
            if (!pacienteData.rut || !pacienteData.nombres || !pacienteData.apellido_pa || !pacienteData.sexo || !pacienteData.fecha_nacim) {
                showToast('warning', 'Por favor completa los campos obligatorios.');
                return;
            }

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pacienteData) // Enviamos el objeto plano
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'Error al crear paciente');
                }

                const nuevoPaciente = await response.json();
                showToast('success', 'Paciente creado exitosamente');
                
                todosLosPacientes.push(nuevoPaciente);
                renderPaciente(nuevoPaciente);
                
                createPacienteForm.reset();
                createPacienteModal.hide();

            } catch (error) {
                console.error(error);
                showToast('error', error.message);
            }
        });
    }

    cargarPacientes();
});