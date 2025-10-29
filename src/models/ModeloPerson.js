const mongoose = require('mongoose');
const { Schema } = mongoose;

const personaSchema = new Schema({
  nombres: {
    type: String,
    required: true // <-- Requerido
  },
  apellido_pa: {
    type: String,
    required: true // <-- Requerido
  },
  apellido_mat: String, // Este sigue siendo opcional
  sexo: {
    type: String,
    required: true // <-- Requerido
  },
  fecha_nacim: {
    type: Date,
    required: true // <-- Requerido
  },
  relaciones: [
    {
      tipo_relacion: String,
      persona_relacionada: {
        type: Schema.Types.ObjectId,
        ref: 'Persona'
      }
    }
  ]
});
const Persona = mongoose.model('Persona', personaSchema);

module.exports = Persona;