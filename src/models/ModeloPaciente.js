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
  
  numero_ficha: {
    type: String,
    required: true,
    unique: true,
  },
  
  fecha_ingreso: {
    type: Date,
    default: Date.now
  },
  historial_medico_resumido: String
});

const Paciente = mongoose.model('Paciente', pacienteSchema);
module.exports = Paciente;