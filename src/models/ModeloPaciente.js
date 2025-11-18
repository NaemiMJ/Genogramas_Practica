const mongoose = require('mongoose');
const { Schema } = mongoose;

const pacienteSchema = new Schema({
  // Vínculo 1 a 1 con la Persona
  persona: {
    type: Schema.Types.ObjectId,
    ref: 'Persona',
    required: true,
    unique: true 
  },

  activo: {
    type: Boolean,
    default: true 
  },

  fecha_ingreso: {
    type: Date,
    default: Date.now
  },

  foto_url: {
    type: String,
    default: null 
  },
  archivos_adjuntos: [
    {
      nombre_archivo: { type: String, required: true },
      url_archivo: { type: String, required: true },
      fecha_subida: { type: Date, default: Date.now },
      tipo_archivo: { type: String, required: true },
    }
  ]
});

const Paciente = mongoose.model('Paciente', pacienteSchema);
module.exports = Paciente;