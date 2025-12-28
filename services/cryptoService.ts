
/**
 * Aegis-Link Cryptographic Layer
 * Implements AES-GCM 256-bit encryption for message payloads.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

export class CryptoService {
  private static keyCache: CryptoKey | null = null;

  static async generateMasterKey(): Promise<string> {
    const key = await window.crypto.subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }

  static async importKey(base64Key: string): Promise<CryptoKey> {
    const rawKey = this.base64ToArrayBuffer(base64Key);
    return window.crypto.subtle.importKey(
      'raw',
      rawKey,
      ALGORITHM,
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(text: string, base64Key: string): Promise<{ data: string; iv: string }> {
    const key = await this.importKey(base64Key);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoded
    );

    return {
      data: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  static async decrypt(base64Data: string, base64Iv: string, base64Key: string): Promise<string> {
    try {
      const key = await this.importKey(base64Key);
      const iv = this.base64ToArrayBuffer(base64Iv);
      const data = this.base64ToArrayBuffer(base64Data);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error('Decryption failed', e);
      return '[DECRYPTION_ERROR: CORRUPT_PAYLOAD]';
    }
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + "salt_aegis_2024");
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hash);
  }
}
