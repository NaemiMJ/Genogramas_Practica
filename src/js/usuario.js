document.addEventListener('DOMContentLoaded', () => {
      
      // --- LÓGICA PARA CONECTAR CON EL BACKEND ---
      
      const API_URL = 'http://localhost:3001/api/usuarios';
      const userList = document.getElementById('user-list');
      
      // Formulario de CREAR
      const createUserForm = document.getElementById('create-user-form');
      const createUserModal = new bootstrap.Modal(document.getElementById('createUserModal'));

      // ================================================
      // NUEVO: Elementos del modal de EDITAR
      // ================================================
      const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
      const editUserForm = document.getElementById('edit-user-form');


      // --- FUNCIONES DE AYUDA PARA EL RUT ---
      // ... (tus funciones limpiarRut y formatearRut van aquí sin cambios) ...
      const limpiarRut = (rut) => {
        return rut.replace(/[\.\-]/g, '');
      };
      const formatearRut = (rut) => {
        let actual = limpiarRut(rut).toUpperCase();
        let sinDv = actual.slice(0, -1);
        let dv = actual.slice(-1);
        let rutFormateado = '';
        while (sinDv.length > 3) {
            rutFormateado = '.' + sinDv.slice(-3) + rutFormateado;
            sinDv = sinDv.slice(0, -3);
        }
        return sinDv + rutFormateado + '-' + dv;
      };


      // Función para renderizar los usuarios en la tabla
      const renderizarUsuarios = (usuarios) => {
        // ... (toda la primera parte de esta función es igual) ...
        userList.innerHTML = '';
        const gridTemplateColumns = '2fr 1fr 1fr 1fr 0.3fr';
        const header = document.querySelector('.user-list-header');
        if (header) {
            header.style.gridTemplateColumns = gridTemplateColumns;
        }

        usuarios.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-list-item';
            userItem.style.gridTemplateColumns = gridTemplateColumns;
            const estadoClass = user.estado === 'Activo' ? 'status-active' : 'status-inactive';

            // ================================================
            // CAMBIO: Damos una clase 'btn-edit' al botón de editar
            // y le pasamos el data-id, igual que al de borrar.
            // ================================================
            userItem.innerHTML = `
                <span>${user.nombre} ${user.apellido}</span>
                <span>${user.correo}</span>
                <span>${user.rol}</span>
                <span><span class="status-badge ${estadoClass}">${user.estado}</span></span>
                <div>
                    <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${user._id}" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${user._id}" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
                </div>
            `;
            userList.appendChild(userItem);
        });
      };

      // Función para obtener y mostrar los usuarios (sin cambios)
      const cargarUsuarios = async () => {
        // ... (tu código de cargarUsuarios sigue igual) ...
        try {
          const response = await fetch(API_URL);
          if (!response.ok) throw new Error('Error al cargar los usuarios');
          const usuarios = await response.json();
          renderizarUsuarios(usuarios);
        } catch (error) {
          console.error(error);
          userList.innerHTML = '<p class="text-center text-danger">No se pudieron cargar los usuarios.</p>';
        }
      };

      // Función para crear un nuevo usuario (sin cambios)
      createUserForm.addEventListener('submit', async (event) => {
        // ... (tu código de crear usuario sigue igual, con la corrección del correo) ...
        event.preventDefault();
        const rutInput = document.getElementById('new-rut').value;
        const rutLimpio = limpiarRut(rutInput);
        const nuevoUsuario = {
          rut: rutLimpio,
          nombre: document.getElementById('new-name').value,
          apellido: document.getElementById('new-lastname').value,
          rol: document.getElementById('new-role').value,
          password: document.getElementById('new-password').value,
          correo: document.getElementById('new-correo').value
        };
        try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoUsuario)
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear el usuario');
          }
          createUserForm.reset();
          createUserModal.hide();
          cargarUsuarios();
        } catch (error) {
          console.error(error);
          alert(`Error: ${error.message}`);
        }
      });
      
      // ================================================
      // NUEVA FUNCIÓN: Abrir y poblar el modal de edición
      // ================================================
      const abrirModalEdicion = async (id) => {
        try {
          const response = await fetch(`${API_URL}/${id}`);
          if (!response.ok) throw new Error('Error al obtener datos del usuario');
          const user = await response.json();

          // Llenamos el formulario de edición con los datos
          document.getElementById('edit-user-id').value = user._id; // Guardamos el ID
          document.getElementById('edit-rut').value = formatearRut(user.rut); // Formateamos el RUT
          document.getElementById('edit-name').value = user.nombre;
          document.getElementById('edit-lastname').value = user.apellido;
          document.getElementById('edit-correo').value = user.correo;
          document.getElementById('edit-role').value = user.rol;
          document.getElementById('edit-estado').value = user.estado;

          // Mostramos el modal
          editUserModal.show();
        } catch (error) {
          console.error(error);
          alert(error.message);
        }
      };

      // ================================================
      // NUEVA FUNCIÓN: Enviar el formulario de edición (PUT)
      // ================================================
      editUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const userId = document.getElementById('edit-user-id').value;
        const datosActualizados = {
          nombre: document.getElementById('edit-name').value,
          apellido: document.getElementById('edit-lastname').value,
          rol: document.getElementById('edit-role').value,
          estado: document.getElementById('edit-estado').value,
        };

        try {
          const response = await fetch(`${API_URL}/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
         });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar el usuario');
          }

          editUserModal.hide(); // Ocultamos el modal
          cargarUsuarios(); // Recargamos la lista
        } catch (error) {
          console.error(error);
          alert(`Error: ${error.message}`);
        }
      });

      // ================================================
      // CAMBIO: Modificamos el listener de la lista
      // ================================================
      userList.addEventListener('click', async (event) => {
        // Buscamos si se hizo clic en un botón de ELIMINAR
        const deleteButton = event.target.closest('.btn-delete');
        // Buscamos si se hizo clic en un botón de EDITAR
        const editButton = event.target.closest('.btn-edit');

        if (deleteButton) {
          const userId = deleteButton.dataset.id;
          const confirmar = confirm('¿Estás seguro de que quieres eliminar este usuario?');
          if (confirmar) {
            try {
              const response = await fetch(`${API_URL}/${userId}`, { method: 'DELETE' });
              if (!response.ok) throw new Error('Error al eliminar el usuario');
              cargarUsuarios();
            } catch (error) {
              console.error(error);
              alert('Error al eliminar el usuario.');
            }
          }
        } else if (editButton) { // <-- AÑADIMOS ESTA LÓGICA
          const userId = editButton.dataset.id;
          abrirModalEdicion(userId); // Llamamos a la nueva función
        }
      });

      // Carga inicial de usuarios
      cargarUsuarios();
    });