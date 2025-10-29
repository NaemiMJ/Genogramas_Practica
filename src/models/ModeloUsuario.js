const mongoose = require('mongoose');
const { Schema } = mongoose;

const usuarioSchema = new Schema({
  rut: {
    type: String,
    required: true,
    unique: true // Asegura que no haya RUTs duplicados
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    required: true,
    enum: ['Administrador', 'Usuario'] // Roles permitidos
  },
  password: {
    type: String,
    required: true
  },
  correo: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Formato de correo no válido']
  },
  estado: {
    type: String,
    required: true,
    default: 'Activo',
    enum: ['Activo', 'Inactivo']
  }
}, { timestamps: true }); // Agrega campos createdAt y updatedAt automáticamente

// El primer argumento es el nombre singular del modelo, Mongoose lo pluraliza para la colección.
// 'Usuario' -> colección 'usuarios' en la base de datos.
const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
