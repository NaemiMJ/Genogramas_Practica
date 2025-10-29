document.addEventListener('DOMContentLoaded', () => {
 
 // -- - LÓGICA PARA CONECTAR CON EL BACKEND ---
        const API_URL = 'http://localhost:3001/api/usuarios';
        const userList = document.getElementById('user-list');
 
 // Formulario de CREAR
        const createUserForm = document.getElementById('create-user-form');
        const createUserModal = new bootstrap.Modal(document.getElementById('createUserModal'));

// ================================================
// Elementos del formulario de BÚSQUEDA
        const searchUserForm = document.getElementById('search-user-form');
        const searchInput = document.getElementById('search-input');
        const searchClearBtn = document.getElementById('search-clear-btn');
// ================================================
//  Elementos del modal de EDITAR
        const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        const editUserForm = document.getElementById('edit-user-form');
// ================================================
 // --- FUNCIONES DE AYUDA PARA EL RUT ---
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
// ================================================

// Función para renderizar los usuarios en la tabla
        const renderizarUsuarios = (usuarios) => {
        userList.innerHTML = '';
        const gridTemplateColumns = '2fr 1fr 1fr 1fr 0.3fr';
        const header = document.querySelector('.user-list-header');
        if (header) {
         header.style.gridTemplateColumns = gridTemplateColumns
        }
        if (usuarios.length === 0) {
            userList.innerHTML = '<p class="text-center text-muted mt-3">No se encontraron usuarios.</p>';
            return;
        }

        usuarios.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'user-list-item';
                userItem.style.gridTemplateColumns = gridTemplateColumns;
                const estadoClass = user.estado === 'Activo' ? 'status-active' : 'status-inactive';


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

 //Funcion pra cargar los usuaros, y con busqueda si es necesarios 
 const cargarUsuarios = async () => {
        try {
            // Leemos el valor actual del input de búsqueda
            const terminoBusqueda = searchInput.value.trim();
            
            let url = API_URL;
            if (terminoBusqueda) {
                // Si hay un término, lo agregamos como query parameter a la URL
                url = `${API_URL}?termino=${encodeURIComponent(terminoBusqueda)}`;
            }

            const response = await fetch(url); // Usamos la URL (con o sin query)
            if (!response.ok) throw new Error('Error al cargar los usuarios');
            const usuarios = await response.json();
            renderizarUsuarios(usuarios);
        } catch (error) {
            console.error(error);
            userList.innerHTML = '<p class="text-center text-danger">No se pudieron cargar los usuarios.</p>';
        }
 };


 // Función para crear un nuevo usuario 
 createUserForm.addEventListener('submit', async (event) => {
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

 searchUserForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Evitamos que la página se recargue
    cargarUsuarios(); // Llamamos a cargarUsuarios, que leerá el input
 });
 searchClearBtn.addEventListener('click', () => {
    searchInput.value = ''; // Limpiamos el input
    cargarUsuarios(); // Volvemos a cargar todos los usuarios
 });
 
 // ================================================
 // Abrir y poblar el modal de edición
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
 // Enviar el formulario de edición (PUT)
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
 // Modificamos el listener de la lista
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
 } else if (editButton) {
 const userId = editButton.dataset.id;
 abrirModalEdicion(userId);
 }
 });

 // Carga inicial de usuarios
 cargarUsuarios();
 });