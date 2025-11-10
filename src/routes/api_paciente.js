const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Importar los modelos
const Persona = require('../models/ModeloPerson.js');
const Paciente = require('../models/ModeloPaciente.js');

/**
 * @route   GET /
 * @desc    Obtener todos los pacientes (con datos de persona)
 * @access  Private
 */
// (Añadido de vuelta para que "cargarPacientes" funcione)
router.get('/', async (req, res) => {
  try {
    // Buscamos pacientes, populamos la 'persona' y ordenamos
    const pacientes = await Paciente.find()
                                  .populate('persona') // <-- Crucial: trae los datos de la Persona
                                  .sort({ fecha_ingreso: -1 }); // Los más nuevos primero
    
    res.status(200).json(pacientes);

  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ msg: 'Error del servidor al obtener pacientes', error: error.message });
  }
});


/**
 * @route   POST /
 * @desc    Crear una nueva Persona y un nuevo Paciente
 * @access  Private
 */
router.post('/', async (req, res) => {
  // Extraer los datos de la persona del cuerpo de la petición
  const { rut, nombres, apellido_pa, apellido_mat, sexo, fecha_nacim } = req.body;

  // Validación básica
  if (!rut || !nombres || !apellido_pa || !sexo || !fecha_nacim) {
    return res.status(400).json({ msg: 'Por favor, incluye todos los campos requeridos (rut, nombre, apellido paterno, sexo, fecha de nacimiento).' });
  }

  // Iniciar una sesión de MongoDB para la transacción
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // --- 1. Crear la Persona ---
    const nuevaPersona = new Persona({
      rut, // <-- Campo añadido
      nombres,
      apellido_pa,
      apellido_mat: apellido_mat || null, // Asegurarse de que sea nulo si está vacío
      sexo,
      fecha_nacim,
      // estado_vital por defecto es 'Vivo' según tu esquema
    });

    // Guardar la persona DENTRO de la transacción
    const personaGuardada = await nuevaPersona.save({ session });

    // --- 2. Crear el Paciente ---
    const nuevoPaciente = new Paciente({
      persona: personaGuardada._id,
      // fecha_ingreso por defecto es Date.now() según tu esquema
    });

    // Guardar el paciente DENTRO de la transacción
    const pacienteGuardado = await nuevoPaciente.save({ session });

    // Si todo fue bien, "cometer" la transacción
    await session.commitTransaction();

    // --- 3. Enviar la respuesta ---
    // Queremos devolver el paciente con los datos de la persona populados
    const pacienteCompleto = await Paciente.findById(pacienteGuardado._id)
                                          .populate('persona')
                                          .session(session); // Opcional, pero bueno si sigues en la sesión

    res.status(201).json(pacienteCompleto);

  } catch (error) {
    // Si algo falló, abortar la transacción
    await session.abortTransaction();
    console.error('Error en la transacción de crear paciente:', error);
    
    // --- CAMBIO SOLICITADO ---
    // Manejar error de clave única (si el paciente ya existe para esa persona)
    if (error.code === 11000) {
        // Comprobar si el error es por el RUT
        if (error.keyPattern && error.keyPattern.rut) {
            return res.status(400).json({ msg: `El RUT '${rut}' ya se encuentra registrado.` });
        }
        // Comprobar si es por la persona (en el modelo Paciente)
        if (error.keyPattern && error.keyPattern.persona) {
             return res.status(400).json({ msg: 'Esta persona ya está registrada como paciente.' });
        }
        // Fallback genérico de duplicado
        return res.status(400).json({ msg: 'Error de clave duplicada. Ya existe un registro con uno de estos datos.' });
    }
    
    res.status(500).json({ msg: 'Error del servidor al crear el paciente.', error: error.message });
  
  } finally {
    // Siempre cerrar la sesión
    session.endSession();
  }
});

module.exports = router;