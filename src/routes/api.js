// routes/api.js
const express = require('express');
const router = express.Router();

// --- Importar los routers específicos ---
const authRoutes = require('./api_auth');
const usuariosRoutes = require('./api_usuario');
//const personasRoutes = require('./api_persona');
const pacientesRoutes = require('./api_paciente');   
//const relacionesRoutes = require('./api_relacion'); 

// --- Definir las rutas base ---
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);     // OK -> /api/usuarios
//router.use('/personas', personasRoutes);     // OK -> /api/personas
router.use('/pacientes', pacientesRoutes);   // OK -> /api/pacientes
//router.use('/relaciones', relacionesRoutes); // OK -> /api/relaciones

module.exports = router;