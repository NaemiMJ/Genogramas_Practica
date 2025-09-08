const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  nombres: String,
  apellido_pa: String,
  apellido_mat: String,
  sexo: String,
  fecha_nacim: Date,
  relacion: {
    tipo_relacion: String,
    persona_relacionada: {
      nombres: String,
      apellido_pa: String,
      apellido_mat: String,
      sexo: String,
      fecha_nacim: Date
    }
  }
});

module.exports = mongoose.model('Persona', personaSchema);