const express = require('express');
const router = express.Router();

const authRoutes = require('./api_auth');
const usuariosRoutes = require('./api_usuario');
const pacientesRoutes = require('./api_paciente'); 
// Nueva importación
const familiarRoutes = require('./api_familiar'); 

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);     
router.use('/pacientes', pacientesRoutes);   

// Aquí enlazamos la ruta. 
// Como en el HTML haces fetch a '/api/guardar-genograma',
// y aquí estamos en '/api', usamos '/' para que coincida.
router.use('/', familiarRoutes); 

module.exports = router;