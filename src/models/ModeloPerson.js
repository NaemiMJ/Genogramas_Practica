
const mongoose = require('mongoose');
const { Schema } = mongoose;

const personaSchema = new Schema({
  rut: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombres: { 
    type: String, 
    required: true 
  },
  apellido_pa: { 
    type: String, 
    required: true 
  },
  apellido_mat: String,
  sexo: { 
    type: String, 
    required: true, 
    enum: ['Masc', 'Fem'] 
  },
  fecha_nacim: { 
    type: Date, 
    required: true 
  },
  
  // --- Relaciones Verticales (Genealogía) ---
  padre: {
    type: Schema.Types.ObjectId,
    ref: 'Persona',
    default: null
  },
  madre: {
    type: Schema.Types.ObjectId,
    ref: 'Persona',
    default: null
  },

  estado_vital: {
    type: String,
    required: true,
    enum: ['Vivo', 'Fallecido'],
    default: 'Vivo'
  },
  fecha_fallecimiento: { 
    type: Date,
    default: null
  },
  notas: {
    type: String,
    default: '' 
  },

});

const Persona = mongoose.model('Persona', personaSchema);
module.exports = Persona;