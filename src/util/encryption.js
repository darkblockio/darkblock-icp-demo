import crypto from 'crypto';
const SECRET_KEY_ENV = process.env.SECRET_KEY;
if(!SECRET_KEY_ENV) throw new Error("No Secret Key Set During Deploy")

// Encryption settings
const algorithm = 'aes-256-cbc';
const secretKey = Buffer.from(SECRET_KEY_ENV, "hex"); // 32 bytes for AES-256
const ivLength = 16; // IV length for AES-256-CBC is 16 bytes

// Encryption function
export function encrypt(data) {
    const iv = crypto.randomBytes(ivLength); // Generate a new IV for each encryption
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return {
        iv: iv.toString('hex'),        // Convert IV to hex for storage
        content: new Uint8Array(encrypted) // Store encrypted content as Uint8Array
    };
}

// Decryption function
export function decrypt(encrypted) {
    const iv = Buffer.from(encrypted.iv, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

    const content = Buffer.from(encrypted.content); // Convert Array to Buffer
    let decrypted = decipher.update(content);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted; // Return as Buffer to maintain original data format
}
