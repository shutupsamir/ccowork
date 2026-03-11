import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.AGENT_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('AGENT_KEY_ENCRYPTION_SECRET is not set');
  }
  // Pad or truncate to 32 bytes
  const key = Buffer.alloc(KEY_LENGTH);
  Buffer.from(secret, 'utf-8').copy(key);
  return key;
}

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encrypted: encrypted + authTag,
    iv: iv.toString('hex'),
  };
}

export function decrypt(encryptedWithTag: string, ivHex: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');

  const authTag = Buffer.from(
    encryptedWithTag.slice(-AUTH_TAG_LENGTH * 2),
    'hex'
  );
  const encrypted = encryptedWithTag.slice(0, -AUTH_TAG_LENGTH * 2);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
