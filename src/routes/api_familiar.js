const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Familiar = require('../models/ModeloFamiliar'); 
const Relacion = require('../models/ModeloRelacion'); // Asegúrate que la ruta sea correcta

// Ruta POST: /api/familiar/guardar-genograma
router.post('/guardar-genograma', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = req.body; // Recibimos { patient, parents, siblings... }

    // 1. Aplanar todos los arrays en una sola lista para procesarlos
    let todosLosFamiliares = [];
    
    // Agregamos al paciente principal
    if (data.patient) todosLosFamiliares.push({ ...data.patient, rol: 'paciente' });
    
    // Agregamos padres si existen
    if (data.parents && data.parents.father) todosLosFamiliares.push(data.parents.father);
    if (data.parents && data.parents.mother) todosLosFamiliares.push(data.parents.mother);
    
    // Función auxiliar para agregar listas
    const addList = (list) => { 
        if(list && Array.isArray(list)) todosLosFamiliares.push(...list); 
    };
    
    addList(data.partners);
    addList(data.siblings);
    addList(data.children);
    addList(data.grandparents);
    addList(data.greatGrandparents);
    addList(data.grandchildren);
    addList(data.greatGrandchildren);
    addList(data.descendantPartners);

    // 2. Mapa para traducir IDs: { 'id_temporal': 'ObjectId_Real' }
    const idMap = {};
    const familiaresGuardados = [];

    // 3. Guardar cada Familiar en la BD
    for (const f of todosLosFamiliares) {
      if (!f || !f.id) continue; // Saltamos si está vacío

      const nuevoFamiliar = new Familiar({
        nombre: f.nombre,
        apellido: f.apellido,
        edad: f.edad,
        sexo: f.sexo,
        rol: f.rol,
        estado: f.estado,
        salud: f.salud,
        esLgtb: f.lgtb, // Frontend manda 'lgtb', modelo espera 'esLgtb'
        tempIdFrontend: f.id 
      });

      const savedDoc = await nuevoFamiliar.save({ session });
      
      // Guardamos la referencia para usarla en las relaciones
      idMap[f.id] = savedDoc._id; 
      familiaresGuardados.push(savedDoc);
    }

    // 4. Crear las Relaciones (Matrimonios / Parejas)
    const relacionesParaGuardar = [];

    // A. Parejas del Paciente Principal
    if (data.partners) {
      for (const part of data.partners) {
        // Buscamos los IDs reales en el mapa
        const idPacienteReal = idMap[data.patient.id];
        const idParejaReal = idMap[part.id];

        if (idPacienteReal && idParejaReal) {
          relacionesParaGuardar.push({
            miembros: [idPacienteReal, idParejaReal],
            tipo_relacion: part.tipoRelacion || 'matrimonio',
            calidad: 'cercana', // Valor por defecto o agrega campo en frontend
            fecha_inicio: part.relAnioInicio ? new Date(part.relAnioInicio, 0, 1) : null,
            fecha_fin: part.relAnioFin ? new Date(part.relAnioFin, 0, 1) : null
          });
        }
      }
    }

    // B. Parejas de la Descendencia (Hijos/Nietos y sus parejas)
    if (data.descendantPartners) {
      for (const dp of data.descendantPartners) {
        // En frontend: dp.id es la pareja externa, dp.targetId es el familiar biológico
        const idBiologicoReal = idMap[dp.targetId];
        const idParejaExternaReal = idMap[dp.id];

        if (idBiologicoReal && idParejaExternaReal) {
           relacionesParaGuardar.push({
            miembros: [idBiologicoReal, idParejaExternaReal],
            tipo_relacion: dp.tipoRelacion || 'matrimonio',
            fecha_inicio: dp.relAnioInicio ? new Date(dp.relAnioInicio, 0, 1) : null,
            fecha_fin: dp.relAnioFin ? new Date(dp.relAnioFin, 0, 1) : null
          });
        }
      }
    }
    
    // Guardamos todas las relaciones de golpe
    if (relacionesParaGuardar.length > 0) {
      await Relacion.insertMany(relacionesParaGuardar, { session });
    }

    // Si todo salió bien, confirmamos cambios
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      msg: 'Genograma guardado correctamente', 
      familiares: familiaresGuardados.length,
      relaciones: relacionesParaGuardar.length 
    });

  } catch (error) {
    // Si algo falla, deshacemos todo
    await session.abortTransaction();
    session.endSession();
    console.error("Error al guardar genograma:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;