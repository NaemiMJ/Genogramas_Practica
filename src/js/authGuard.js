// Este script se debe cargar en TODAS las páginas MENOS en index.html

// 1. Obtener el usuario de localStorage
const usuario = JSON.parse(localStorage.getItem('usuario'));

// 2. Definir las páginas solo para Administradores
const adminPages = [
    '/home.html',
    '/usuarios.html',
    '/auditoria.html'
];

// 3. Obtener la página actual
const currentPage = window.location.pathname;

// 4. Lógica de Redirección
if (!usuario) {
    // Si NO hay usuario logueado, fuera a index.html
    if (currentPage !== '/index.html') {
        window.location.href = '../index.html'; // Ajusta la ruta si es necesario
    }
} else {
    // Si SÍ hay usuario...
    // 5. ¿Es un usuario normal en una página de admin?
    if (usuario.rol === 'Usuario' && adminPages.some(page => currentPage.includes(page))) {
        // ¡Fuera! Lo mandamos a la única página que puede ver.
        window.location.href = './pacientes.html';
    }
}