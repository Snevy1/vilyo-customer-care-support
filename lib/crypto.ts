// lib/crypto.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

function ensureEncryptionKey() {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return ENCRYPTION_KEY;
}

export function encryptJSON(data: any): { iv: string; content: string; tag: string } {
  // Only validate at runtime when function is called
  const key = ensureEncryptionKey();
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
  
  const jsonString = JSON.stringify(data);
  let encrypted = cipher.update(jsonString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    content: encrypted,
    tag: tag.toString('hex'),
  };
}

export function decryptJSON(encrypted: { iv: string; content: string; tag: string }): any {
  // Only validate at runtime when function is called
  const key = ensureEncryptionKey();
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key, 'hex'),
    Buffer.from(encrypted.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
  
  let decrypted = decipher.update(encrypted.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}