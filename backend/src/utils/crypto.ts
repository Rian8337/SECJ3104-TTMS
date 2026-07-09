import crypto from "crypto";
import { config } from "dotenv";

config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

if (!process.env.SESSION_ENCRYPTION_KEY) {
    throw new Error(
        "Session encryption key is not set. Please set the SESSION_ENCRYPTION_KEY environment variable."
    );
}

const ALGORITHM = "aes-256-gcm";

const SECRET_KEY = crypto
    .createHash("sha256")
    .update(Buffer.from(process.env.SESSION_ENCRYPTION_KEY, "hex"))
    .digest();

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a text using AES-256-GCM algorithm.
 *
 * @param text The text to encrypt.
 * @returns The encrypted text in hexadecimal format, prefixed with the IV and auth tag.
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return (
        iv.toString("hex") +
        ":" +
        authTag.toString("hex") +
        ":" +
        encrypted.toString("hex")
    );
}

/**
 * Decrypts a ciphertext using AES-256-GCM algorithm.
 *
 * @param ciphertext The ciphertext to decrypt, in hexadecimal format.
 * @returns The decrypted text.
 */
export function decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}
