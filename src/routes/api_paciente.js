/*
  api_paciente.js
*/

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// --- Importa tus modelos (ajusta la ruta si es necesario) ---
const Paciente = require('../models/ModeloPaciente');
const Persona = require('../models/ModeloPerson'); 

const router = express.Router();

// === Configuración de Multer para FOTOS ===
const fotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'assets', 'imgs');
    fs.mkdirSync(dir, { recursive: true }); 
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const idPaciente = req.params.pacienteId;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${idPaciente}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadFoto = multer({ 
  storage: fotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: Solo se permiten archivos de imagen (jpeg, jpg, png, gif).'));
  }
});

// === Configuración de Multer para DOCUMENTOS ===
const documentoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'assets', 'docs');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const idPaciente = req.params.pacienteId;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${idPaciente}-${uniqueSuffix}-${file.originalname}`);
  }
});

const uploadDocumento = multer({
  storage: documentoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  fileFilter: (req, file, cb) => {
    const msword = file.mimetype === 'application/msword';
    const mswordx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const pdf = file.mimetype === 'application/pdf';

    if (pdf || msword || mswordx) {
      return cb(null, true);
    }
    cb(new Error('Error: Solo se permiten archivos (PDF, DOC, DOCX).'));
  }
});


// === RUTAS API ===

/**
 * 1. OBTENER TODOS LOS PACIENTES (GET /)
 * Ruta: GET /api/pacientes
 */
router.get('/', async (req, res) => {
  try {
    const pacientes = await Paciente.find().populate('persona');
    res.status(200).json(pacientes);
  } catch (error) {
    console.error('Error en GET /api/pacientes', error);
    res.status(500).json({ message: 'Error al obtener pacientes.', error: error.message });
  }
});

/**
 * 2. OBTENER UN PACIENTE (GET /:pacienteId)
 * Ruta: GET /api/pacientes/:pacienteId
 */
router.get('/:pacienteId', async (req, res) => {
  try {
    const { pacienteId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({ message: 'ID de paciente no válido' });
    }
    const paciente = await Paciente.findById(pacienteId).populate('persona');
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    res.status(200).json(paciente);
  } catch (error) {
    console.error(`Error en GET /api/pacientes/${req.params.pacienteId}`, error);
    res.status(500).json({ message: 'Error al obtener el paciente.', error: error.message });
  }
});

/**
 * 3. CREAR PACIENTE (POST /)
 * Ruta: POST /api/pacientes
 * (CORREGIDA para que coincida con el formulario de pacientes.js)
 */
router.post('/', async (req, res) => {
    try {
        // 1. Recibimos los datos del formulario (de pacientes.js)
        const { rut, nombres, apellido_pa, apellido_mat, sexo, fecha_nacim } = req.body;

        if (!rut || !nombres || !apellido_pa || !sexo || !fecha_nacim) {
            return res.status(400).json({ msg: 'Faltan datos obligatorios (rut, nombres, apellido_pa, sexo, fecha_nacim).' });
        }

        // 2. (Opcional pero recomendado) Validar si la persona ya existe
        const rutLimpio = rut.replace(/[^0-9kK]/g, '').toLowerCase(); // Limpiar RUT
        const existePersona = await Persona.findOne({ rut: rutLimpio });
        if (existePersona) {
             return res.status(409).json({ msg: 'El RUT ya se encuentra registrado.' });
        }

        // 3. Crear la nueva Persona
        const nuevaPersona = new Persona({
            rut: rutLimpio,
            nombres,
            apellido_pa,
            apellido_mat,
            sexo,
            fecha_nacim
        });
        await nuevaPersona.save();

        // 4. Crear el nuevo Paciente, enlazando la Persona recién creada
        const nuevoPaciente = new Paciente({
            persona: nuevaPersona._id
            // (otros campos específicos de Paciente pueden ir aquí)
        });
        await nuevoPaciente.save();

        // 5. Devolver el paciente completo (con 'populate' para el frontend)
        // El frontend (renderPaciente) espera el objeto con la persona "poblada"
        const pacienteCreado = await Paciente.findById(nuevoPaciente._id).populate('persona');

        res.status(201).json(pacienteCreado); // <-- Devolvemos el objeto completo

    } catch (error) {
        console.error('Error en POST /api/pacientes', error);
        // Manejo de error de duplicado (si el RUT es 'unique' en el modelo)
        if (error.code === 11000) {
            return res.status(409).json({ msg: 'El RUT ya se encuentra registrado.' });
        }
        res.status(500).json({ msg: 'Error al crear el paciente.', error: error.message });
    }
});


/**
 * 4. SUBIR/ACTUALIZAR FOTO (POST /:pacienteId/foto)
 * Ruta: POST /api/pacientes/:pacienteId/foto
 */
router.post('/:pacienteId/foto', 
  uploadFoto.single('foto'), 
  async (req, res) => {
    try {
      const { pacienteId } = req.params;
      
      const paciente = await Paciente.findById(pacienteId);
      if (!paciente) {
          return res.status(404).json({ message: 'Paciente no encontrado.' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo de imagen.' });
      }
      
      // Borrar foto antigua si existe
      if (paciente.foto_url) {
          try {
            const rootDir = path.join(__dirname, '..', '..'); 
            const relativeUrl = paciente.foto_url.startsWith('/') ? paciente.foto_url.substring(1) : paciente.foto_url;
            const oldFilePath = path.join(rootDir, relativeUrl);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
          } catch (err) {
              console.warn(`No se pudo borrar la foto antigua: ${paciente.foto_url}`, err.message);
          }
      }

      // URL Relativa para la Base de Datos
      const urlArchivo = path.join('/assets', 'imgs', req.file.filename).replace(/\\/g, '/');
      
      paciente.foto_url = urlArchivo;
      await paciente.save();

      res.status(201).json({ 
        message: 'Foto actualizada correctamente.',
        foto_url: paciente.foto_url
      });

    } catch (error) {
      console.error(`Error en POST /api/pacientes/${req.params.pacienteId}/foto`, error);
      res.status(500).json({ message: 'Error al procesar la foto.', error: error.message });
    }
  }
);


/**
 * 5. SUBIR DOCUMENTO (POST /:pacienteId/documento)
 * Ruta: POST /api/pacientes/:pacienteId/documento
 */
router.post('/:pacienteId/documento',
  uploadDocumento.single('documento'), 
  async (req, res) => {
    try {
      const { pacienteId } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo (PDF o Word).' });
      }
      
      const urlArchivo = path.join('/assets', 'docs', req.file.filename).replace(/\\/g, '/');

      const nuevoAdjunto = {
        nombre_archivo: req.file.originalname,
        url_archivo: urlArchivo,
        tipo_archivo: req.file.mimetype,
        fecha_subida: new Date()
      };

      const pacienteActualizado = await Paciente.findByIdAndUpdate(
        pacienteId,
        { $push: { archivos_adjuntos: nuevoAdjunto } },
        { new: true, upsert: true }
      );
      
      const adjuntoRecienAgregado = pacienteActualizado.archivos_adjuntos[pacienteActualizado.archivos_adjuntos.length - 1];
      
      res.status(201).json({
        message: 'Documento subido correctamente.',
        archivo: adjuntoRecienAgregado
      });
    } catch (error) {
      console.error(`Error en POST /api/pacientes/${req.params.pacienteId}/documento`, error);
      res.status(500).json({ message: 'Error al procesar el documento.', error: error.message });
    }
  }
);


/**
 * 6. BORRAR DOCUMENTO (DELETE /:pacienteId/documento/:archivoId)
 * Ruta: DELETE /api/pacientes/:pacienteId/documento/:archivoId
 */
router.delete('/:pacienteId/documento/:archivoId', async (req, res) => {
    try {
        const { pacienteId, archivoId } = req.params;
        const paciente = await Paciente.findById(pacienteId);
        if (!paciente) {
          return res.status(404).json({ message: 'Paciente no encontrado' });
        }
        const archivo = paciente.archivos_adjuntos.id(archivoId);
        if (!archivo) {
          return res.status(404).json({ message: 'Archivo no encontrado' });
        }
        
        const rootDir = path.join(__dirname, '..', '..'); 
        const relativeUrl = archivo.url_archivo.startsWith('/') ? archivo.url_archivo.substring(1) : archivo.url_archivo;
        const filePath = path.join(rootDir, relativeUrl);

        // Borrar el archivo físico
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
            console.warn(`Se intentó borrar un archivo que no existe: ${filePath}`);
        }
        
        // Sacar la referencia de la Base de Datos
        await Paciente.findByIdAndUpdate(pacienteId, {
            $pull: { archivos_adjuntos: { _id: archivoId } }
        });
        
        res.status(200).json({ message: 'Archivo eliminado correctamente.' });
    } catch (error) {
        console.error(`Error en DELETE /api/pacientes/${req.params.pacienteId}/documento/${req.params.archivoId}`, error);
        res.status(500).json({ message: 'Error al eliminar el archivo.', error: error.message });
    }
});


/**
 * 7. BORRAR PACIENTE COMPLETO (DELETE /:pacienteId)
 * Ruta: DELETE /api/pacientes/:pacienteId
 * (AÑADIDA PARA QUE COINCIDA CON EL FRONTEND)
 */
router.delete('/:pacienteId', async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
            return res.status(400).json({ msg: 'ID de paciente no válido' });
        }

        // 1. Encontrar al paciente
        const paciente = await Paciente.findById(pacienteId);
        if (!paciente) {
            return res.status(404).json({ msg: 'Paciente no encontrado' });
        }

        const personaId = paciente.persona;
        const rootDir = path.join(__dirname, '..', '..'); // Raíz del proyecto

        // 2. Borrar archivos físicos (Foto)
        if (paciente.foto_url) {
            try {
                const relativeUrl = paciente.foto_url.startsWith('/') ? paciente.foto_url.substring(1) : paciente.foto_url;
                const oldFilePath = path.join(rootDir, relativeUrl);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            } catch (err) {
                console.warn(`No se pudo borrar la foto del paciente: ${paciente.foto_url}`, err.message);
            }
        }

        // 3. Borrar archivos físicos (Documentos)
        if (paciente.archivos_adjuntos && paciente.archivos_adjuntos.length > 0) {
            paciente.archivos_adjuntos.forEach(archivo => {
                try {
                    const relativeUrl = archivo.url_archivo.startsWith('/') ? archivo.url_archivo.substring(1) : archivo.url_archivo;
                    const filePath = path.join(rootDir, relativeUrl);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (err) {
                    console.warn(`No se pudo borrar el documento: ${archivo.url_archivo}`, err.message);
                }
            });
        }

        // 4. Borrar los registros de la Base de Datos
        await Paciente.findByIdAndDelete(pacienteId);
        
        // 5. Borrar la Persona asociada (si existe)
        if (personaId) {
            await Persona.findByIdAndDelete(personaId);
        }
        
        res.status(200).json({ msg: 'Paciente, persona y archivos asociados eliminados correctamente.' });

    } catch (error) {
        console.error(`Error en DELETE /api/pacientes/${req.params.pacienteId}`, error);
        res.status(500).json({ msg: 'Error al eliminar el paciente.', error: error.message });
    }
});

/**
 * 8. CAMBIAR ESTADO (DESACTIVAR/ACTIVAR) (PUT /:pacienteId/estado)
 * Ruta: PUT /api/pacientes/:pacienteId/estado
 */
router.put('/:pacienteId/estado', async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { activo } = req.body; // Esperamos true o false

        if (typeof activo !== 'boolean') {
            return res.status(400).json({ msg: 'El campo "activo" debe ser booleano.' });
        }

        const pacienteActualizado = await Paciente.findByIdAndUpdate(
            pacienteId,
            { activo: activo },
            { new: true } // Devuelve el documento actualizado
        ).populate('persona');

        if (!pacienteActualizado) {
            return res.status(404).json({ msg: 'Paciente no encontrado' });
        }

        const estadoStr = activo ? 'activado' : 'desactivado';
        res.status(200).json({ 
            msg: `Paciente ${estadoStr} correctamente.`, 
            paciente: pacienteActualizado 
        });

    } catch (error) {
        console.error(`Error en PUT /api/pacientes/${req.params.pacienteId}/estado`, error);
        res.status(500).json({ msg: 'Error al cambiar el estado del paciente.', error: error.message });
    }
}); 


module.exports = router;