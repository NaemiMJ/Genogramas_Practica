const mongoose = require('mongoose');
const { Schema } = mongoose;

const familiarSchema = new Schema({
  // Datos básicos del formulario
  nombre: { type: String, required: true },
  apellido: { type: String, default: '' },
  edad: { type: Number, default: 0 },
  sexo: { type: String, enum: ['M', 'F'], required: true },
  
  // Datos específicos del Genograma
  rol: { type: String }, // 'paciente', 'padre', 'abuelo', etc.
  estado: { type: String, default: 'vivo' }, // 'fallecido', 'embarazo', etc.
  salud: { type: String, default: 'ninguno' },
  esLgtb: { type: Boolean, default: false },

  // ID temporal del Frontend (CRUCIAL para reconstruir relaciones)
  tempIdFrontend: { type: String }, 

  // Opcional: Si quieres saber a qué paciente principal pertenece este familiar
  // genogramaId: { type: Schema.Types.ObjectId, ref: 'Paciente' } 

}, { timestamps: true });

module.exports = mongoose.model('Familiar', familiarSchema);