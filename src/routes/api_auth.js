const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Usuario = require('../models/ModeloUsuario'); // Ajusta la ruta

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar un usuario y devolver sus datos
 */
router.post('/login', async (req, res) => {
    const { correo, password } = req.body;

    // --- 👇 AÑADIDO PARA DEPURAR ---
    console.log(`[AUTH] Intento de login para: ${correo}`);
    console.log(`[AUTH] Contraseña recibida: |${password}|`); // Los | ayudan a ver espacios
    // --- -------------------------- ---

    // 1. Validar que el correo y la contraseña vengan
    if (!correo || !password) {
        return res.status(400).json({ message: 'Correo y contraseña son requeridos.' });
    }

    try {
        // 2. Buscar al usuario por su correo (es único)
        const usuario = await Usuario.findOne({ correo: correo });
        if (!usuario) {
            // --- 👇 AÑADIDO PARA DEPURAR ---
            console.log('[AUTH] Error: Usuario no encontrado.');
            // --- ---------------------- ---
            return res.status(404).json({ message: 'Credenciales incorrectas.' }); // Mensaje genérico
        }

        // --- 👇 AÑADIDO PARA DEPURAR ---
        console.log(`[AUTH] Hash en BD: |${usuario.password}|`);
        // --- ---------------------- ---

        // 3. Comparar la contraseña del formulario con la hasheada en la BD
        const match = await bcrypt.compare(password, usuario.password);

        // --- 👇 AÑADIDO PARA DEPURAR ---
        console.log(`[AUTH] Resultado de bcrypt.compare: ${match}`);
        // --- ---------------------- ---

        if (!match) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' }); // Mensaje genérico
        }

        // 4. ¡Éxito! Devolver los datos clave del usuario.
        // NO devuelvas la contraseña.
        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol,
            correo: usuario.correo
        });

    } catch (error) {
        console.log('[AUTH] Error en catch:', error.message); // Log del error
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
});

module.exports = router;