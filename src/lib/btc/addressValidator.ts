export type BtcAddressType = 'p2pkh' | 'p2sh' | 'bech32' | 'bech32m';
export type BtcNetwork = 'mainnet' | 'testnet';

export type BtcValidationResult =
  | { valid: true; network: BtcNetwork; type: BtcAddressType }
  | { valid: false; error: string };

export type EvmValidationResult =
  | { valid: true }
  | { valid: false; error: string };

// Base58 alphabet (excludes 0, O, I, l to avoid confusion)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// Bech32 character set
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

/**
 * Decode a Base58Check encoded string and verify the checksum
 */
function decodeBase58Check(address: string): { version: number; valid: boolean } {
  // Check for invalid characters
  for (const char of address) {
    if (!BASE58_ALPHABET.includes(char)) {
      return { version: -1, valid: false };
    }
  }

  // Decode Base58 to bytes
  let value = BigInt(0);
  for (const char of address) {
    value = value * BigInt(58) + BigInt(BASE58_ALPHABET.indexOf(char));
  }

  // Convert to byte array (25 bytes for standard address)
  const bytes: number[] = [];
  while (value > 0n) {
    bytes.unshift(Number(value % 256n));
    value = value / 256n;
  }

  // Add leading zeros for leading '1's in address
  for (const char of address) {
    if (char !== '1') break;
    bytes.unshift(0);
  }

  // Pad to 25 bytes if necessary
  while (bytes.length < 25) {
    bytes.unshift(0);
  }

  if (bytes.length !== 25) {
    return { version: -1, valid: false };
  }

  // Verify checksum using double SHA-256
  const payload = bytes.slice(0, 21);
  const checksum = bytes.slice(21);

  const hash1 = sha256(payload);
  const hash2 = sha256(hash1);

  const valid = hash2[0] === checksum[0] &&
                hash2[1] === checksum[1] &&
                hash2[2] === checksum[2] &&
                hash2[3] === checksum[3];

  return { version: bytes[0], valid };
}

/**
 * Simple SHA-256 implementation for checksum verification
 */
function sha256(data: number[]): number[] {
  // SHA-256 constants
  const K: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  // Initial hash values
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  // Pre-processing: adding padding bits
  const msg = [...data];
  const originalLen = msg.length * 8;
  msg.push(0x80);
  while ((msg.length % 64) !== 56) {
    msg.push(0);
  }

  // Append original length in bits as 64-bit big-endian
  // High 32 bits (0 for messages under 512MB)
  msg.push(0, 0, 0, 0);
  // Low 32 bits
  msg.push((originalLen >>> 24) & 0xff);
  msg.push((originalLen >>> 16) & 0xff);
  msg.push((originalLen >>> 8) & 0xff);
  msg.push(originalLen & 0xff);

  // Process each 512-bit chunk
  for (let i = 0; i < msg.length; i += 64) {
    const w: number[] = new Array(64).fill(0);

    // Copy chunk into first 16 words (use >>> 0 to ensure unsigned)
    for (let j = 0; j < 16; j++) {
      w[j] = ((msg[i + j * 4] << 24) |
              (msg[i + j * 4 + 1] << 16) |
              (msg[i + j * 4 + 2] << 8) |
              (msg[i + j * 4 + 3])) >>> 0;
    }

    // Extend the first 16 words into the remaining 48 words
    for (let j = 16; j < 64; j++) {
      const s0 = (rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3)) >>> 0;
      const s1 = (rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10)) >>> 0;
      w[j] = ((w[j - 16] + s0 + w[j - 7] + s1) >>> 0) & 0xffffffff;
    }

    // Initialize working variables
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    // Compression function main loop
    for (let j = 0; j < 64; j++) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ ((~e >>> 0) & g)) >>> 0;
      const temp1 = ((h + S1 + ch + K[j] + w[j]) >>> 0) & 0xffffffff;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = ((S0 + maj) >>> 0) & 0xffffffff;

      h = g;
      g = f;
      f = e;
      e = ((d + temp1) >>> 0) & 0xffffffff;
      d = c;
      c = b;
      b = a;
      a = ((temp1 + temp2) >>> 0) & 0xffffffff;
    }

    // Add the compressed chunk to the current hash value
    h0 = ((h0 + a) >>> 0) & 0xffffffff;
    h1 = ((h1 + b) >>> 0) & 0xffffffff;
    h2 = ((h2 + c) >>> 0) & 0xffffffff;
    h3 = ((h3 + d) >>> 0) & 0xffffffff;
    h4 = ((h4 + e) >>> 0) & 0xffffffff;
    h5 = ((h5 + f) >>> 0) & 0xffffffff;
    h6 = ((h6 + g) >>> 0) & 0xffffffff;
    h7 = ((h7 + h) >>> 0) & 0xffffffff;
  }

  // Produce the final hash value (big-endian)
  const result: number[] = [];
  for (const h of [h0, h1, h2, h3, h4, h5, h6, h7]) {
    result.push((h >>> 24) & 0xff);
    result.push((h >>> 16) & 0xff);
    result.push((h >>> 8) & 0xff);
    result.push(h & 0xff);
  }

  return result;
}

function rotr(n: number, d: number): number {
  return ((n >>> d) | (n << (32 - d))) >>> 0;
}

/**
 * Bech32 polymod for checksum verification
 */
function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >>> i) & 1) {
        chk ^= GEN[i];
      }
    }
  }
  return chk;
}

/**
 * Expand HRP for bech32 checksum calculation
 */
function bech32HrpExpand(hrp: string): number[] {
  const result: number[] = [];
  for (const c of hrp) {
    result.push(c.charCodeAt(0) >>> 5);
  }
  result.push(0);
  for (const c of hrp) {
    result.push(c.charCodeAt(0) & 31);
  }
  return result;
}

/**
 * Verify Bech32/Bech32m checksum
 */
function verifyBech32Checksum(hrp: string, data: number[], isBech32m: boolean): boolean {
  const BECH32_CONST = 1;
  const BECH32M_CONST = 0x2bc830a3;
  const constant = isBech32m ? BECH32M_CONST : BECH32_CONST;
  return bech32Polymod([...bech32HrpExpand(hrp), ...data]) === constant;
}

/**
 * Decode a Bech32/Bech32m address
 */
function decodeBech32(address: string): { hrp: string; data: number[]; valid: boolean; isBech32m: boolean } | null {
  const lower = address.toLowerCase();

  // Find separator
  const sepIndex = lower.lastIndexOf('1');
  if (sepIndex < 1 || sepIndex + 7 > lower.length) {
    return null;
  }

  const hrp = lower.slice(0, sepIndex);
  const dataStr = lower.slice(sepIndex + 1);

  // Check length constraints
  if (dataStr.length < 6) {
    return null;
  }

  // Decode data part
  const data: number[] = [];
  for (const c of dataStr) {
    const idx = BECH32_CHARSET.indexOf(c);
    if (idx === -1) {
      return null;
    }
    data.push(idx);
  }

  // Try Bech32 first, then Bech32m
  if (verifyBech32Checksum(hrp, data, false)) {
    return { hrp, data: data.slice(0, -6), valid: true, isBech32m: false };
  }
  if (verifyBech32Checksum(hrp, data, true)) {
    return { hrp, data: data.slice(0, -6), valid: true, isBech32m: true };
  }

  return null;
}

/**
 * Validate a Bitcoin address
 */
export function validateBtcAddress(address: string): BtcValidationResult {
  if (!address || address.trim() === '') {
    return { valid: false, error: 'Address is required' };
  }

  const trimmed = address.trim();

  // Check for P2PKH (1...) or P2SH (3...) - Legacy addresses
  if (trimmed.startsWith('1') || trimmed.startsWith('3')) {
    // Length check for legacy addresses (25-34 characters)
    if (trimmed.length < 25 || trimmed.length > 34) {
      return { valid: false, error: 'Invalid BTC address format' };
    }

    const decoded = decodeBase58Check(trimmed);
    if (!decoded.valid) {
      return { valid: false, error: 'Invalid BTC address format' };
    }

    // Version byte determines address type
    // 0x00 = P2PKH mainnet, 0x05 = P2SH mainnet
    // 0x6f = P2PKH testnet, 0xc4 = P2SH testnet
    if (decoded.version === 0x00) {
      return { valid: true, network: 'mainnet', type: 'p2pkh' };
    } else if (decoded.version === 0x05) {
      return { valid: true, network: 'mainnet', type: 'p2sh' };
    } else if (decoded.version === 0x6f) {
      return { valid: true, network: 'testnet', type: 'p2pkh' };
    } else if (decoded.version === 0xc4) {
      return { valid: true, network: 'testnet', type: 'p2sh' };
    }

    return { valid: false, error: 'Invalid BTC address format' };
  }

  // Check for Bech32/Bech32m (bc1... or tb1...)
  const lowerAddr = trimmed.toLowerCase();
  if (lowerAddr.startsWith('bc1') || lowerAddr.startsWith('tb1')) {
    const decoded = decodeBech32(trimmed);
    if (!decoded || !decoded.valid) {
      return { valid: false, error: 'Invalid BTC address format' };
    }

    const network: BtcNetwork = decoded.hrp === 'bc' ? 'mainnet' : 'testnet';

    // First byte of data indicates witness version
    // Version 0 = bech32 (bc1q/tb1q), Version 1 = bech32m (bc1p/tb1p)
    const witnessVersion = decoded.data[0];

    if (witnessVersion === 0) {
      // Bech32 (SegWit v0)
      if (decoded.isBech32m) {
        return { valid: false, error: 'Invalid BTC address format' };
      }
      return { valid: true, network, type: 'bech32' };
    } else if (witnessVersion === 1) {
      // Bech32m (Taproot)
      if (!decoded.isBech32m) {
        return { valid: false, error: 'Invalid BTC address format' };
      }
      return { valid: true, network, type: 'bech32m' };
    }

    return { valid: false, error: 'Invalid BTC address format' };
  }

  // Check for testnet legacy addresses (m, n, or 2)
  if (trimmed.startsWith('m') || trimmed.startsWith('n') || trimmed.startsWith('2')) {
    if (trimmed.length < 25 || trimmed.length > 34) {
      return { valid: false, error: 'Invalid BTC address format' };
    }

    const decoded = decodeBase58Check(trimmed);
    if (!decoded.valid) {
      return { valid: false, error: 'Invalid BTC address format' };
    }

    if (decoded.version === 0x6f) {
      return { valid: true, network: 'testnet', type: 'p2pkh' };
    } else if (decoded.version === 0xc4) {
      return { valid: true, network: 'testnet', type: 'p2sh' };
    }

    return { valid: false, error: 'Invalid BTC address format' };
  }

  return { valid: false, error: 'Invalid BTC address format' };
}

/**
 * Validate an EVM (Ethereum-compatible) address
 */
export function validateEvmAddress(address: string): EvmValidationResult {
  if (!address || address.trim() === '') {
    return { valid: false, error: 'Address is required' };
  }

  const trimmed = address.trim();

  // Check for 0x prefix
  if (!trimmed.startsWith('0x') && !trimmed.startsWith('0X')) {
    return { valid: false, error: 'Missing 0x prefix' };
  }

  // Check length (0x + 40 hex characters = 42 total)
  if (trimmed.length !== 42) {
    return { valid: false, error: 'Invalid address length' };
  }

  // Check for valid hex characters (after 0x prefix)
  const hexPart = trimmed.slice(2);
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(hexPart)) {
    return { valid: false, error: 'Invalid hex characters' };
  }

  return { valid: true };
}
