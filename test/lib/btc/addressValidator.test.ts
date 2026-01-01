import { describe, it, expect } from 'vitest';
import { validateBtcAddress, validateEvmAddress } from '@/lib/btc/addressValidator';

describe('AddressValidator', () => {
  describe('validateBtcAddress', () => {
    it('should accept valid P2PKH mainnet address (1...)', () => {
      expect(validateBtcAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toEqual({
        valid: true, network: 'mainnet', type: 'p2pkh'
      });
    });

    it('should accept valid P2SH mainnet address (3...)', () => {
      expect(validateBtcAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toEqual({
        valid: true, network: 'mainnet', type: 'p2sh'
      });
    });

    it('should accept valid Bech32 mainnet address (bc1q...)', () => {
      expect(validateBtcAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toEqual({
        valid: true, network: 'mainnet', type: 'bech32'
      });
    });

    it('should accept valid Bech32m mainnet address (bc1p...)', () => {
      expect(validateBtcAddress('bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr')).toEqual({
        valid: true, network: 'mainnet', type: 'bech32m'
      });
    });

    it('should accept valid testnet address (tb1...)', () => {
      expect(validateBtcAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')).toEqual({
        valid: true, network: 'testnet', type: 'bech32'
      });
    });

    it('should reject invalid address', () => {
      expect(validateBtcAddress('invalid')).toEqual({
        valid: false,
        error: 'Invalid BTC address format'
      });
    });

    it('should reject empty address', () => {
      expect(validateBtcAddress('')).toEqual({
        valid: false,
        error: 'Address is required'
      });
    });

    it('should reject address with invalid characters', () => {
      expect(validateBtcAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN0')).toEqual({
        valid: false,
        error: 'Invalid BTC address format'
      });
    });
  });

  describe('validateEvmAddress', () => {
    it('should accept valid checksummed address', () => {
      expect(validateEvmAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toEqual({
        valid: true
      });
    });

    it('should accept valid lowercase address', () => {
      expect(validateEvmAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toEqual({
        valid: true
      });
    });

    it('should accept valid uppercase address', () => {
      expect(validateEvmAddress('0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED')).toEqual({
        valid: true
      });
    });

    it('should reject address with wrong length', () => {
      expect(validateEvmAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1Be')).toEqual({
        valid: false,
        error: 'Invalid address length'
      });
    });

    it('should reject address without 0x prefix', () => {
      expect(validateEvmAddress('5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toEqual({
        valid: false,
        error: 'Missing 0x prefix'
      });
    });

    it('should reject empty address', () => {
      expect(validateEvmAddress('')).toEqual({
        valid: false,
        error: 'Address is required'
      });
    });

    it('should reject address with invalid hex characters', () => {
      expect(validateEvmAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeG')).toEqual({
        valid: false,
        error: 'Invalid hex characters'
      });
    });
  });
});
