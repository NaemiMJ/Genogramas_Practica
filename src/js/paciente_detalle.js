document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Utilidad: Calcular Edad (copiada de pacientes.js) ---
    const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return '?';
        const hoy = new Date();
        const cumple = new Date(fechaNacimiento); 

        const anioNac = cumple.getUTCFullYear();
        const mesNac = cumple.getUTCMonth(); // 0-11
        const diaNac = cumple.getUTCDate(); // 1-31

        let edad = hoy.getFullYear() - anioNac;
        const m = hoy.getMonth() - mesNac;

        if (m < 0 || (m === 0 && hoy.getDate() < diaNac)) {
            edad--;
        }
        return edad;
    };

    // --- 2. Referencias a la API y al DOM ---
    const API_URL = 'http://localhost:3001/api/pacientes';
    const header = document.querySelector('.content-header');
    
    // Referencias a los <span> que creamos en el HTML
    const detalleRut = document.getElementById('detalle-rut');
    const detalleSexo = document.getElementById('detalle-sexo');
    const detalleFecNac = document.getElementById('detalle-fec-nac');
    const detalleEdad = document.getElementById('detalle-edad');
    const detalleEstadoVital = document.getElementById('detalle-estado-vital');

    // --- 3. Obtener ID de la URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const pacienteId = urlParams.get('id');

    if (!pacienteId) {
        header.textContent = 'Error: No se especificó paciente';
        console.error('No se proporcionó ID de paciente en la URL.');
        // Opcional: Redirigir de vuelta a la lista si no hay ID
        window.location.href = '../../pages/pacientes.html';
        return;
    }

    // --- 4. Función para renderizar los datos en la página ---
    const renderDatosPaciente = (paciente) => {
        if (!paciente || !paciente.persona) {
            header.textContent = 'Error: Datos de paciente inválidos';
            return;
        }
        
        const persona = paciente.persona;
        
        // Formatear la fecha de nacimiento
        const fechaNac = new Date(persona.fecha_nacim);
        const fechaFormateada = fechaNac.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'UTC' 
        });

        // Poblar los campos
        header.textContent = `Ficha de: ${persona.nombres} ${persona.apellido_pa} ${persona.apellido_mat || ''}`;
        
        detalleRut.textContent = persona.rut || 'N/A';
        detalleSexo.textContent = persona.sexo === 'Masc' ? 'Masculino' : 'Femenino';
        detalleFecNac.textContent = fechaFormateada;
        detalleEdad.textContent = `${calcularEdad(persona.fecha_nacim)} años`;
        detalleEstadoVital.textContent = persona.estado_vital || 'N/A';
        
        // (Aquí podrías seguir poblando más campos si los añades al HTML)
    };

    // --- 5. Función para Cargar Datos del Paciente Específico ---
    const cargarPacienteEspecifico = async () => {
        try {
            // Asumimos que tu API responde a: GET /api/pacientes/:id
            const response = await fetch(`${API_URL}/${pacienteId}`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo encontrar al paciente.`);
            }
            
            const paciente = await response.json();
            renderDatosPaciente(paciente); // Llamamos a la función de renderizado

        } catch (error) {
            console.error('Error al cargar datos del paciente:', error);
            header.textContent = 'Error al cargar paciente';
            if (detalleRut) detalleRut.textContent = error.message;
        }
    };

    // --- 6. Carga Inicial ---
    // Inicia la carga de datos en cuanto la página esté lista
    cargarPacienteEspecifico();

});