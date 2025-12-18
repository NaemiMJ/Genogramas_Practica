const mongoose = require('mongoose');
const { Schema } = mongoose;

const familiarSchema = new Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, default: '' },
  edad: { type: Number, default: 0 },
  sexo: { type: String, enum: ['M', 'F'], required: true },
  
  rol: { type: String },
  estado: { type: String, default: 'vivo' },
  salud: { type: String, default: 'ninguno' },
  esLgtb: { type: Boolean, default: false },

  // IMPORTANTE: ID del objeto en el frontend (para reconstruir el dibujo)
  tempIdFrontend: { type: String }, 

  // IMPORTANTE: Datos de relación para reconstruir la estructura visual
  targetId: { type: String },    // A quién está vinculado (ej. hijo de quién)
  idPareja: { type: String },    // Si es hijo, quién es su otro progenitor
  tipoRelacion: { type: String },
  tipoHijo: { type: String },
  relAnioInicio: { type: Number },
  relAnioFin: { type: Number },

  // CAMPO NUEVO: Identificador único del grupo familiar
  genogramaId: { type: String, required: true, index: true } 

}, { timestamps: true });

module.exports = mongoose.model('Familiar', familiarSchema);