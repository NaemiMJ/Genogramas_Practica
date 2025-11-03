const express = require('express');
const router = express.Router(); // <-- ¡IMPORTANTE!
const bcrypt = require('bcrypt');
const Usuario = require('../models/ModeloUsuario'); // <-- Importa el modelo
const { encrypt, decrypt } = require('../utils/crypto'); // <-- Importa crypto
const saltRounds = 10;

// [GET] Obtener todos los usuarios
// Ruta final: GET /api/usuarios
router.get('/', async (req, res) => { // <-- Usa router.get
  try {
    const { termino } = req.query; 
    let query = {};
    if (termino) {
      const regex = { $regex: termino, $options: 'i' }; 
      query = { $or: [ { nombre: regex }, { apellido: regex } ] };
    }
    const usuariosCifrados = await Usuario.find(query);
    const usuariosDescifrados = usuariosCifrados.map(user => {
        const userObject = user.toObject();
        userObject.rut = decrypt(user.rut);
        return userObject;
    });
    res.json(usuariosDescifrados);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los usuarios', error: err.message });
  }
});

// [POST] Crear un nuevo usuario
// Ruta final: POST /api/usuarios
router.post('/', async (req, res) => { // <-- Usa router.post
  const { rut, nombre, apellido, rol, password, correo } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const rutCifrado = encrypt(rut);
    const nuevoUsuario = new Usuario({
      rut: rutCifrado,
      nombre,
      apellido,
      rol,
      password: passwordHash,
      correo,
      estado: 'Activo'
    });
    const usuarioGuardado = await nuevoUsuario.save();
    res.status(201).json(usuarioGuardado);
  } catch (err) {
    if (err.code === 11000) {
        return res.status(409).json({ message: 'Error: El RUT o Correo ya están registrados.', error: err.message });
    }
    res.status(400).json({ message: 'Error del servidor', error: err.message });
  }
});

// [DELETE] Eliminar un usuario
// Ruta final: DELETE /api/usuarios/:id
router.delete('/:id', async (req, res) => { // <-- Usa router.delete
  try {
    const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuarioEliminado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el usuario', error: err.message });
  }
});

// [GET] Obtener un usuario por ID
// Ruta final: GET /api/usuarios/:id
router.get('/:id', async (req, res) => { // <-- Usa router.get
  try {
    const usuarioCifrado = await Usuario.findById(req.params.id);
    if (!usuarioCifrado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const usuarioDescifrado = usuarioCifrado.toObject();
    usuarioDescifrado.rut = decrypt(usuarioCifrado.rut);
    res.json(usuarioDescifrado);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el usuario', error: err.message });
  }
});

// [PUT] Modificar usuario
// Ruta final: PUT /api/usuarios/:id
router.put('/:id', async (req, res) => { // <-- Usa router.put
  const { nombre, apellido, rol, estado } = req.body;
  if (!nombre || !apellido || !rol || !estado) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }
  try {
    const datosActualizados = { nombre, apellido, rol, estado };
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id, 
      datosActualizados, 
      { new: true, runValidators: true }
    );
    if (!usuarioActualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(usuarioActualizado);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar el usuario', error: err.message });
  }
});

module.exports = router; // <-- ¡MUY IMPORTANTE!