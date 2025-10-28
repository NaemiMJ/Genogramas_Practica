# Proyecto Genogramas - Sintergía

**GenoTree** es una plataforma wb que permitira a la empresa Sintergia crear y modificar genogramas de un paciente, permitiedo ...

## 🧩 Tecnologías principales

- **Node.js** con **Express** — para el servidor backend.  
- **MongoBD Atlas** — como sistema gestor de base de datos.  
- **dotenv** — para la configuración de variables de entorno.  
- **HTML, CSS, Bootstrap y JS** — para el diseño, creaciín y logica de las interfaces.

## ⚙️ Instalación y configuración

Sigue los pasos a continuación para levantar el proyecto en tu entorno local 👇

### 1️⃣ Clonar el repositorio

Esto a realizar en la app Git Bash
```bash
git clone https://github.com/NaemiMJ/Genogramas_Practica
cd Genogramas_Practica
code .
 ``` 
### 2️⃣ Instalar dependencias:

Ejecuta el siguinte comando en la terminal de VisualStudio
```bash
npm install
 ``` 
 Este deberiua instalar las dependencias: bcrypt cors dotenv express mongobd mongoose.
 
 ### 3️⃣ Crear archivo .env

En la carpeta src/ crea un archivo **.env** con las credenciales de tu base de datos
⚠️ Importante: los datos específicos del archivo .env puedes solicitármelos directamente.
```bash
ejemplo:
MONGODB_URI=********
ENCRYPTION_KEY=*******
 ``` 

 ### Por ultimo, ya puedes ejecutar el proyecto 

 Una vez todo configurado , ejecuta en la terminal de Vs (necesario cada vezque necesites 
 corroborar el funcionamiento de la pagina): 
 ```bash
cd src
node server.js
 ``` 
