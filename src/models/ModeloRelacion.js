const mongoose = require('mongoose');
const { Schema } = mongoose;

const relacionSchema = new Schema({
  miembros: [{
    type: Schema.Types.ObjectId,
    ref: 'Persona',
    required: true
  }],

  tipo_relacion: {
    type: String,
    required: true,
    enum: ['matrimonio', 'union_libre', 'pareja', 'separados', 'divorciados', 'ex_pareja']
  },
  
  calidad: {
    type: String,
    required: false,
    default: null,
    enum: ['cercana', 'violenta', 'muy_estrecha', 'estrecha_violenta', 'hosti', 'distante', 'quiebre', 'muy_buena']
  },
  
  fecha_inicio: Date,
  fecha_fin: Date
}, { timestamps: true });

// Validar que siempre haya exactamente 2 miembros
relacionSchema.path('miembros').validate(
  val => val.length === 2, 
  'Una relación debe tener exactamente dos miembros.'
);

const Relacion = mongoose.model('Relacion', relacionSchema);
module.exports = Relacion;