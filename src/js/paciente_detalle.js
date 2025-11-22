/*
  paciente_detalle.js
  (Versión completa y corregida para usar el servidor backend)
*/
document.addEventListener('DOMContentLoaded', () => {
  
  // --- Notificaciones (Toast) ---
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
  
  // --- 1. Utilidad: Calcular Edad ---
  const calcularEdad = (fechaNacimiento) => {
      if (!fechaNacimiento) return '?';
      const hoy = new Date();
      const cumple = new Date(fechaNacimiento); 
      const anioNac = cumple.getUTCFullYear();
      const mesNac = cumple.getUTCMonth();
      const diaNac = cumple.getUTCDate();
      let edad = hoy.getFullYear() - anioNac;
      const m = hoy.getMonth() - mesNac;
      if (m < 0 || (m === 0 && hoy.getDate() < diaNac)) {
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

  // --- 2. Referencias al DOM ---
  const header = document.querySelector('.content-header');
  const detalleRut = document.getElementById('detalle-rut');
  const detalleSexo = document.getElementById('detalle-sexo');
  const detalleFecNac = document.getElementById('detalle-fec-nac');
  const detalleEdad = document.getElementById('detalle-edad');
  const detalleEstadoVital = document.getElementById('detalle-estado-vital');
  
  // Foto
  const detalleFoto = document.getElementById('detalle-foto');
  const photoInput = document.getElementById('photo-input');

  // Documentos
  const uploadForm = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');
  const uploadButton = document.getElementById('upload-button');
  const listaArchivos = document.getElementById('lista-archivos');
  const noFilesMessage = document.getElementById('no-files-message');

  // --- 3. Obtener ID y URLs de API ---
  const urlParams = new URLSearchParams(window.location.search);
  const PACIENTE_ID = urlParams.get('id');
  
  // === CORRECCIÓN CLAVE ===
  // Definir la URL base de tu API (Backend)
  const API_BASE_URL = 'http://localhost:3001'; 
  const API_URL = `${API_BASE_URL}/api/pacientes`;
  // ========================

  if (!PACIENTE_ID) {
      header.textContent = 'Error: No se especificó paciente';
      window.location.href = '../../pages/pacientes.html';
      return;
  }
  
  // URLs de API específicas
  const API_URL_PACIENTE = `${API_URL}/${PACIENTE_ID}`;
  const API_URL_FOTO = `${API_URL}/${PACIENTE_ID}/foto`;
  const API_URL_DOCUMENTO = `${API_URL}/${PACIENTE_ID}/documento`;

  // --- 4. Cargar Datos Iniciales ---
  const cargarPacienteEspecifico = async () => {
    try {
        const response = await fetch(API_URL_PACIENTE);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo encontrar al paciente.`);
        }
        const paciente = await response.json();
        
        if (!paciente || !paciente.persona) {
            header.textContent = 'Error: Datos de paciente inválidos';
            return;
        }
        const persona = paciente.persona;
        const fechaNac = new Date(persona.fecha_nacim);
        const fechaFormateada = fechaNac.toLocaleDateString('es-CL', {
            day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' 
        });

        header.textContent = `${persona.nombres} ${persona.apellido_pa} ${persona.apellido_mat || ''}`;
        detalleRut.textContent = formatearRut(persona.rut); 
        detalleSexo.textContent = persona.sexo === 'Masc' ? 'Masculino' : 'Femenino';
        detalleFecNac.textContent = fechaFormateada;
        detalleEdad.textContent = `${calcularEdad(persona.fecha_nacim)} años`;
        detalleEstadoVital.textContent = persona.estado_vital || 'N/A';

        // --- Renderizar Foto ---
        if (paciente.foto_url) {
            // === CORRECCIÓN AQUÍ ===
            // Añadir el prefijo del backend
            detalleFoto.src = `${API_BASE_URL}${paciente.foto_url}`; 
        } else {
            // Placeholder si no hay foto
            detalleFoto.src = "https://placehold.co/200x200/6c757d/white?text=Sin+Foto";
        }
        // ========================

        // --- Renderizar Archivos ---
        renderizarListaArchivos(paciente.archivos_adjuntos || []);
        
    } catch (error) {
        console.error('Error al cargar datos del paciente:', error);
        header.textContent = 'Error al cargar paciente';
    }
  };

  // --- 5. Lógica de Subida de FOTO ---
  photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const originalSrc = detalleFoto.src;
    detalleFoto.src = "https://placehold.co/200x200/6c757d/white?text=Cargando...";
    
    const formData = new FormData();
    formData.append('foto', file); 

    try {
      const response = await fetch(API_URL_FOTO, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Error al subir la foto.');
      }
      
      // === CORRECCIÓN AQUÍ ===
      // Añadir el prefijo del backend a la URL que devuelve la API
      detalleFoto.src = `${API_BASE_URL}${result.foto_url}`;
      // ========================
      
      Toast.fire({ icon: 'success', title: 'Foto actualizada.' });
    } catch (error) {
      Toast.fire({ icon: 'error', title: error.message });
      detalleFoto.src = originalSrc; // Revertir si hay error
    } finally {
      photoInput.value = ''; // Limpiar el input
    }
  });

  // --- 6. Lógica de Subida de DOCUMENTOS ---
  uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!fileInput.files || fileInput.files.length === 0) {
          Toast.fire('error', 'Por favor, selecciona un archivo.');
          return;
      }
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('documento', file); 

      uploadButton.disabled = true;
      uploadButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subiendo...`;

      try {
          const response = await fetch(API_URL_DOCUMENTO, {
              method: 'POST',
              body: formData,
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al subir el archivo.');
          }

          const result = await response.json();
          renderArchivo(result.archivo); // Añadir el nuevo archivo a la lista
          Toast.fire({ icon: 'success', title: '¡Archivo subido!' });
          uploadForm.reset(); 

      } catch (error) {
          console.error('Error al subir archivo:', error);
          Toast.fire({ icon: 'error', title: error.message });
      } finally {
          uploadButton.disabled = false;
          uploadButton.innerHTML = `<i class="bi bi-upload"></i> Subir`;
      }
  });

  // --- 7. Funciones Helper para Archivos ---
  const renderizarListaArchivos = (archivos) => {
    listaArchivos.innerHTML = ''; 
    if (archivos.length === 0) {
        // Asegúrate de que no-files-message exista o créalo
        if(noFilesMessage) {
            noFilesMessage.textContent = 'No hay archivos adjuntos.';
            noFilesMessage.style.display = 'block';
        } else {
            listaArchivos.innerHTML = '<li id="no-files-message" class="list-group-item text-muted text-center">No hay archivos adjuntos.</li>';
        }
    } else {
        if(noFilesMessage) noFilesMessage.style.display = 'none';
        archivos.sort((a, b) => new Date(b.fecha_subida) - new Date(a.fecha_subida));
        archivos.forEach(renderArchivo);
    }
  };

  const renderArchivo = (archivo) => {
      if (noFilesMessage) noFilesMessage.style.display = 'none';
      const fechaSubida = new Date(archivo.fecha_subida).toLocaleDateString('es-CL');
      
      const urlArchivo = archivo.url_archivo; // ej: /assets/docs/archivo.pdf
      const icono = archivo.tipo_archivo.includes('pdf') ? 'bi-file-earmark-pdf-fill' : 'bi-file-earmark-word-fill';

      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items.center';
      li.dataset.id = archivo._id; 
      li.innerHTML = `
        <div class="d-flex align-items-center">
          <i class="bi ${icono} fs-4 me-3 text-secondary"></i>
          <div>
            <a href="${API_BASE_URL}${urlArchivo}" target="_blank" class="text-decoration-none fw-bold">${archivo.nombre_archivo}</a>
            <small class="d-block text-muted">Subido el ${fechaSubida}</small>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-danger btn-delete-file" title="Eliminar archivo">
          <i class="bi bi-trash-fill"></i>
        </button>
      `;
      
      li.querySelector('.btn-delete-file').addEventListener('click', () => {
          handleEliminarArchivo(archivo._id, li);
      });
      listaArchivos.prepend(li); 
  };

  // --- 8. Lógica para BORRAR Archivos ---
  const handleEliminarArchivo = async (archivoId, listItemElement) => {
    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Sí, ¡bórralo!'
    });
    if (!confirmacion.isConfirmed) return;

    try {
        const response = await fetch(`${API_URL_DOCUMENTO}/${archivoId}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Error al eliminar.');
        }
        listItemElement.remove(); 
        Toast.fire({ icon: 'success', title: 'Archivo eliminado.' });
        
        const itemsRestantes = listaArchivos.querySelectorAll('li.list-group-item').length;
        if (itemsRestantes === 0 && noFilesMessage) {
             noFilesMessage.style.display = 'block';
        }
        
    } catch (error) {
        Toast.fire({ icon: 'error', title: error.message });
    }
  };


  // --- 9. Carga Inicial ---
  cargarPacienteEspecifico();

});