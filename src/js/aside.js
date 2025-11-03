document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DE LA BARRA LATERAL (Toggle) ---
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const pageWrapper = document.querySelector('.page-wrapper');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            pageWrapper.classList.toggle('sidebar-open');
        });
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            pageWrapper.classList.remove('sidebar-open');
        });
    }

    // --- 👇 LÓGICA DE AUTENTICACIÓN Y ROLES ---
    
    // 1. Obtener usuario de localStorage (debería existir gracias al guard)
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const sidebar = document.querySelector('.sidebar');
    
    if (usuario && sidebar) {
        // 2. Actualizar el nombre y rol en la barra
        const userNameEl = sidebar.querySelector('.user-name');
        const userRoleEl = sidebar.querySelector('.user-role');
        if (userNameEl) userNameEl.textContent = `${usuario.nombre} ${usuario.apellido}`;
        if (userRoleEl) userRoleEl.textContent = usuario.rol;

        // 3. Ocultar enlaces si es rol "Usuario"
        if (usuario.rol === 'Usuario') {
            // Ocultamos los enlaces a Home, Usuarios y Auditoría
            const navLinks = sidebar.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href.includes('home.html') || href.includes('usuarios.html') || href.includes('auditoria.html')) {
                    link.parentElement.classList.add('d-none'); // Oculta el <li>
                }
            });
        }
    }
    
    // 4. Lógica de Cerrar Sesión
    const logoutButton = sidebar.querySelector('.btn-logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); // Evita que siga el enlace
            
            // Limpiar los datos del usuario
            localStorage.removeItem('usuario');
            
            // Redirigir al login
            // Asumimos que la ruta desde cualquier página es ../index.html
            window.location.href = '../index.html'; 
        });
    }
});