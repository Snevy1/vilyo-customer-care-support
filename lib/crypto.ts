import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

// Must be 32 bytes (store in env)
const ENCRYPTION_KEY = Buffer.from(
  process.env.CREDENTIALS_ENCRYPTION_KEY!,
  "hex"
);

if (!process.env.CREDENTIALS_ENCRYPTION_KEY) {
  throw new Error("CREDENTIALS_ENCRYPTION_KEY is not set");
}

export function encryptJSON<T extends object>(data: T) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
    tag: authTag.toString("hex"),
  };
}

export function decryptJSON<T = any>(encrypted: {
  iv: string;
  content: string;
  tag: string;
}): T {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(encrypted.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(encrypted.tag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.content, "hex")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}
