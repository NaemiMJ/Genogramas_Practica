const crypto = require('crypto');

// --- Configuración de Seguridad ---
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16; 

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error("❌ Error: La variable de entorno ENCRYPTION_KEY no está definida o no tiene 32 caracteres.");
    process.exit(1); 
}

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
        return "RUT inválido";
    }
}

// Exportamos las funciones
module.exports = { encrypt, decrypt };