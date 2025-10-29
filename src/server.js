const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Para hashear contraseñas
const crypto = require('crypto'); // Para cifrar el RUT
require('dotenv').config({ path: '../.env' });

const Usuario = require('./models/ModeloUsuario');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuración de Seguridad ---
const saltRounds = 10; // Costo del hashing para bcrypt
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Debe ser de 32 caracteres
const IV_LENGTH = 16; // Para el algoritmo AES

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error("❌ Error: La variable de entorno ENCRYPTION_KEY no está definida o no tiene 32 caracteres.");
    process.exit(1);
}

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Funciones de Cifrado para el RUT ---

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Error al descifrar el RUT:", error);
        return "RUT inválido"; // Retornar un valor por defecto en caso de error
    }
}

// --- Conexión a MongoDB Atlas ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (err) {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  }
};

// --- RUTAS DE LA API (ACTUALIZADAS) ---

// [GET] Obtener todos los usuarios con soporte de busqueda 
app.get('/api/usuarios', async (req, res) => { 
  try {
    const { termino } = req.query; 
    let query = {};

    if (termino) {
      // Creamos una expresión regular para búsqueda case-insensitive
      const regex = { $regex: termino, $options: 'i' }; 
      
      query = {
        $or: [
          { nombre: regex },
          { apellido: regex }
        ]
      };
    }

    // Usamos el objeto 'query' para filtrar. Si 'termino' no existe, 'query' será {} y traerá todo.
    const usuariosCifrados = await Usuario.find(query);
    
    // Desciframos el RUT de cada usuario antes de enviarlo al frontend
    const usuariosDescifrados = usuariosCifrados.map(user => {
        const userObject = user.toObject(); // Convertimos el documento de Mongoose a un objeto plano
        userObject.rut = decrypt(user.rut);
        return userObject;
    });
    res.json(usuariosDescifrados);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los usuarios', error: err.message });
  }
});

// [POST] Crear un nuevo usuario
// ... (el resto de tus rutas PUT, POST, DELETE, GET por ID siguen igual) ...

// [POST] Crear un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  const { rut, nombre, apellido, rol, password, correo } = req.body;

  try {
    // 1. Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // 2. Cifrar el RUT
    const rutCifrado = encrypt(rut);

    const nuevoUsuario = new Usuario({
      rut: rutCifrado, // Guardamos el RUT cifrado
      nombre,
      apellido,
      rol,
      password: passwordHash, // Guardamos la contraseña hasheada
      correo,
      estado: 'Activo'
    });

    const usuarioGuardado = await nuevoUsuario.save();
    res.status(201).json(usuarioGuardado);
  } catch (err) {
    // Manejo de error para RUT duplicado
    if (err.code === 11000) {
        return res.status(409).json({ message: 'Error: El RUT o Correo ya están registrados.', error: err.message });
    }
    res.status(400).json({ message: 'Error del servidor', error: err.message });
  }
});

// [DELETE] Eliminar un usuario (sin cambios, usa el _id que no está cifrado)
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuarioEliminado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el usuario', error: err.message });
  }
});

// [GET]  Usado para encontrar un usuario y devolverlo, para su modificación.
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuarioCifrado = await Usuario.findById(req.params.id);
    if (!usuarioCifrado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Desciframos el RUT antes de enviarlo
    const usuarioDescifrado = usuarioCifrado.toObject();
    usuarioDescifrado.rut = decrypt(usuarioCifrado.rut);
    
    res.json(usuarioDescifrado);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el usuario', error: err.message });
  }
});

//[PUT]  Modificar usuario
app.put('/api/usuarios/:id', async (req, res) => {
  const { nombre, apellido, rol, estado } = req.body;

  // Validaciones básicas (puedes agregar más)
  if (!nombre || !apellido || !rol || !estado) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  try {
    const datosActualizados = {
      nombre,
      apellido,
      rol,
      estado
      // No actualizamos el RUT, correo ni contraseña aquí
    };

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id, 
      datosActualizados, 
      { new: true, runValidators: true } // {new: true} devuelve el documento actualizado
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(usuarioActualizado);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar el usuario', error: err.message });
  }
});




// --- Iniciar servidor ---
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
};

startServer();
