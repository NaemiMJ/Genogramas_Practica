const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Familiar = require('../models/ModeloFamiliar'); // Asegúrate que la ruta sea correcta

/* ==========================================
   RUTA POST: GUARDAR GENOGRAMA
   ========================================== */
router.post('/guardar-genograma', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = req.body;

    // 1. Validar que exista el paciente para usar su ID como identificador del grupo
    if (!data.patient || !data.patient.id) {
        throw new Error("No hay paciente principal definido.");
    }
    const genogramaId = data.patient.id; 

    // 2. Preparar la lista plana (igual que antes)
    let todosLosFamiliares = [];
    const preparar = (p, rol) => ({ ...p, rol, genogramaId }); // Añadimos el genogramaId a todos

    todosLosFamiliares.push(preparar(data.patient, 'paciente'));
    if (data.parents.father) todosLosFamiliares.push(preparar(data.parents.father, 'padre'));
    if (data.parents.mother) todosLosFamiliares.push(preparar(data.parents.mother, 'padre'));
    
    const addList = (list, rol) => { 
        if(Array.isArray(list)) list.forEach(item => todosLosFamiliares.push(preparar(item, rol))); 
    };
    
    // ... Agrega aquí tus otras listas (hijos, nietos, etc.) usando addList ...
    addList(data.partners, 'pareja');
    addList(data.siblings, 'hermano');
    addList(data.children, 'hijo');
    addList(data.grandparents, 'abuelo');
    addList(data.greatGrandparents, 'bisabuelo');
    addList(data.grandchildren, 'nieto');
    addList(data.greatGrandchildren, 'bisnieto');
    addList(data.descendantPartners, 'pareja_descendiente');

    // --- EL PASO CLAVE PARA EVITAR DUPLICADOS ---
    // 3. Borramos TODO lo que pertenezca a este ID antes de guardar lo nuevo
    await Familiar.deleteMany({ genogramaId: genogramaId }, { session });

    // 4. Guardamos la nueva versión limpia
    for (const f of todosLosFamiliares) {
      const nuevo = new Familiar({
        genogramaId: f.genogramaId, // Asegúrate de guardar esto
        nombre: f.nombre,
        apellido: f.apellido,
        edad: f.edad,
        sexo: f.sexo,
        rol: f.rol,
        estado: f.estado,
        salud: f.salud,
        esLgtb: f.lgtb, 
        tempIdFrontend: f.id,
        targetId: f.targetId,
        idPareja: f.idPareja,
        tipoRelacion: f.tipoRelacion,
        tipoHijo: f.tipoHijo,
        relAnioInicio: f.relAnioInicio,
        relAnioFin: f.relAnioFin
      });
      await nuevo.save({ session });
    }

    await session.commitTransaction();
    res.json({ msg: 'Genograma actualizado correctamente', idReferencia: genogramaId });

  } catch (error) {
    await session.abortTransaction();
    console.error("Error al guardar:", error);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

/* ==========================================
   RUTA GET: OBTENER POR NOMBRE Y APELLIDO
   ========================================== */
router.get('/obtener-genograma', async (req, res) => {
    try {
        const { nombre, apellido } = req.query;

        if (!nombre) return res.status(400).json({ msg: "Falta el nombre" });

        // 1. Buscamos al PACIENTE principal por nombre/apellido
        // Usamos una expresión regular para que no importen mayúsculas/minúsculas
        const pacienteEncontrado = await Familiar.findOne({ 
            rol: 'paciente',
            nombre: { $regex: new RegExp(`^${nombre}$`, 'i') },
            apellido: { $regex: new RegExp(`^${apellido || ''}$`, 'i') }
        });

        if (!pacienteEncontrado) {
            return res.status(404).json({ msg: "Paciente no encontrado en DB" });
        }

        // 2. Si existe, buscamos a TODA su familia usando el genogramaId
        const familiaCompleta = await Familiar.find({ 
            genogramaId: pacienteEncontrado.genogramaId 
        });

        // 3. Devolvemos la lista plana para que el frontend la ordene
        res.json(familiaCompleta);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;