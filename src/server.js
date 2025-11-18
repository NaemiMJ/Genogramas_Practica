const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '../.env' }); // Mantenemos tu path de .env

// --- Importar las rutas de la API ---
const apiRoutes = require('./routes/api'); // (Ajusta la ruta si 'routes' está en otro lugar)

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
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

// --- USAR LAS RUTAS DE LA API ---

app.use('/api', apiRoutes);

// --- Iniciar servidor ---
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
};

startServer();