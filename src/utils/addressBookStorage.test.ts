import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Coin } from 'qapp-core';
import {
  getAddressBook,
  addAddress,
  updateAddress,
  deleteAddress,
  searchAddresses,
} from './addressBookStorage';
import { AddressBookEntry } from './Types';

describe('addressBookStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getAddressBook', () => {
    it('should return empty array for new coin type', () => {
      const result = getAddressBook(Coin.BTC);
      expect(result).toEqual([]);
    });

    it('should return saved addresses', () => {
      const entry: Omit<AddressBookEntry, 'id' | 'createdAt'> = {
        name: 'Alice',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: 'Test note',
        coinType: Coin.BTC,
      };
      addAddress(entry);

      const result = getAddressBook(Coin.BTC);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
      expect(result[0].address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    });

    it('should return addresses sorted alphabetically by name', () => {
      addAddress({
        name: 'Charlie',
        address: '3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy',
        note: '',
        coinType: Coin.BTC,
      });
      addAddress({
        name: 'Alice',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });
      addAddress({
        name: 'Bob',
        address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        note: '',
        coinType: Coin.BTC,
      });

      const result = getAddressBook(Coin.BTC);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('q-wallets-addressbook-BTC', 'invalid json');
      const result = getAddressBook(Coin.BTC);
      expect(result).toEqual([]);
    });

    it('should sort names case-insensitively', () => {
      addAddress({
        name: 'alice',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });
      addAddress({
        name: 'Bob',
        address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        note: '',
        coinType: Coin.BTC,
      });

      const result = getAddressBook(Coin.BTC);
      expect(result[0].name).toBe('alice');
      expect(result[1].name).toBe('Bob');
    });
  });

  describe('addAddress', () => {
    it('should successfully add a new address', () => {
      const entry: Omit<AddressBookEntry, 'id' | 'createdAt'> = {
        name: 'Test Wallet',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: 'My test wallet',
        coinType: Coin.BTC,
      };

      const result = addAddress(entry);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.name).toBe('Test Wallet');
      expect(result.address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      expect(result.note).toBe('My test wallet');
      expect(result.coinType).toBe(Coin.BTC);
    });

    it('should generate unique IDs', () => {
      const entry1 = addAddress({
        name: 'Wallet 1',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });
      const entry2 = addAddress({
        name: 'Wallet 2',
        address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        note: '',
        coinType: Coin.BTC,
      });

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('should set createdAt timestamp', () => {
      const before = Date.now();
      const result = addAddress({
        name: 'Test',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });
      const after = Date.now();

      expect(result.createdAt).toBeGreaterThanOrEqual(before);
      expect(result.createdAt).toBeLessThanOrEqual(after);
    });

    it('should throw error for name exceeding 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(() =>
        addAddress({
          name: longName,
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          note: '',
          coinType: Coin.BTC,
        })
      ).toThrow('Name must be 50 characters or less');
    });

    it('should throw error for note exceeding 200 characters', () => {
      const longNote = 'a'.repeat(201);
      expect(() =>
        addAddress({
          name: 'Test',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          note: longNote,
          coinType: Coin.BTC,
        })
      ).toThrow('Note must be 200 characters or less');
    });

    it('should console log the operation', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      addAddress({
        name: 'Test',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Address Book: Added Test for BTC')
      );
    });
  });

  describe('updateAddress', () => {
    it('should successfully update an existing address', () => {
      const original = addAddress({
        name: 'Original',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: 'Original note',
        coinType: Coin.BTC,
      });

      const updated = updateAddress(original.id, Coin.BTC, {
        name: 'Updated',
        note: 'Updated note',
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated');
      expect(updated?.note).toBe('Updated note');
      expect(updated?.address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      expect(updated?.updatedAt).toBeDefined();
    });

    it('should set updatedAt timestamp', () => {
      const original = addAddress({
        name: 'Test',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });

      const before = Date.now();
      const updated = updateAddress(original.id, Coin.BTC, { name: 'Updated' });
      const after = Date.now();

      expect(updated?.updatedAt).toBeDefined();
      expect(updated?.updatedAt!).toBeGreaterThanOrEqual(before);
      expect(updated?.updatedAt!).toBeLessThanOrEqual(after);
    });

    it('should return null for non-existent ID', () => {
      const result = updateAddress('non-existent-id', Coin.BTC, { name: 'Test' });
      expect(result).toBeNull();
    });

    it('should throw error for name exceeding 50 characters', () => {
      const original = addAddress({
        name: 'Test',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });

      const longName = 'a'.repeat(51);
      expect(() =>
        updateAddress(original.id, Coin.BTC, { name: longName })
      ).toThrow('Name must be 50 characters or less');
    });

    it('should throw error for note exceeding 200 characters', () => {
      const original = addAddress({
        name: 'Test',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });

      const longNote = 'a'.repeat(201);
      expect(() =>
        updateAddress(original.id, Coin.BTC, { note: longNote })
      ).toThrow('Note must be 200 characters or less');
    });

    it('should console log the operation', () => {
      const original = addAddress({
        name: 'Test',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });

      const consoleSpy = vi.spyOn(console, 'log');
      updateAddress(original.id, Coin.BTC, { name: 'Updated' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Address Book: Updated Updated for BTC')
      );
    });
  });

  describe('deleteAddress', () => {
    it('should successfully delete an existing address', () => {
      const entry = addAddress({
        name: 'Test',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });

      const result = deleteAddress(entry.id, Coin.BTC);
      expect(result).toBe(true);

      const addresses = getAddressBook(Coin.BTC);
      expect(addresses).toHaveLength(0);
    });

    it('should return false for non-existent ID', () => {
      const result = deleteAddress('non-existent-id', Coin.BTC);
      expect(result).toBe(false);
    });

    it('should console log the operation', () => {
      const entry = addAddress({
        name: 'Test',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });

      const consoleSpy = vi.spyOn(console, 'log');
      deleteAddress(entry.id, Coin.BTC);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Address Book: Deleted entry for BTC')
      );
    });

    it('should not affect other addresses', () => {
      const entry1 = addAddress({
        name: 'Test 1',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });
      const entry2 = addAddress({
        name: 'Test 2',
        address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        note: '',
        coinType: Coin.BTC,
      });

      deleteAddress(entry1.id, Coin.BTC);

      const addresses = getAddressBook(Coin.BTC);
      expect(addresses).toHaveLength(1);
      expect(addresses[0].name).toBe('Test 2');
    });
  });

  describe('searchAddresses', () => {
    beforeEach(() => {
      addAddress({
        name: 'Alice Wallet',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: 'Main wallet',
        coinType: Coin.BTC,
      });
      addAddress({
        name: 'Bob Exchange',
        address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        note: 'Exchange account',
        coinType: Coin.BTC,
      });
      addAddress({
        name: 'Charlie Savings',
        address: '3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy',
        note: 'Long term storage',
        coinType: Coin.BTC,
      });
    });

    it('should filter by name (case-insensitive)', () => {
      const result = searchAddresses(Coin.BTC, 'alice');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Wallet');
    });

    it('should filter by address (case-insensitive)', () => {
      const result = searchAddresses(Coin.BTC, '1boat');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob Exchange');
    });

    it('should return partial matches', () => {
      const result = searchAddresses(Coin.BTC, 'a');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return sorted results', () => {
      const result = searchAddresses(Coin.BTC, 'wallet');
      expect(result[0].name).toBe('Alice Wallet');
    });

    it('should return all addresses for empty query', () => {
      const result = searchAddresses(Coin.BTC, '');
      expect(result).toHaveLength(3);
    });

    it('should return empty array for no matches', () => {
      const result = searchAddresses(Coin.BTC, 'nonexistent');
      expect(result).toHaveLength(0);
    });

    it('should handle whitespace in query', () => {
      const result = searchAddresses(Coin.BTC, '  alice  ');
      expect(result).toHaveLength(1);
    });
  });

  describe('coin type separation', () => {
    it('should keep addresses separated by coin type', () => {
      addAddress({
        name: 'BTC Wallet',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: '',
        coinType: Coin.BTC,
      });
      addAddress({
        name: 'DOGE Wallet',
        address: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
        note: '',
        coinType: Coin.DOGE,
      });

      const btcAddresses = getAddressBook(Coin.BTC);
      const dogeAddresses = getAddressBook(Coin.DOGE);

      expect(btcAddresses).toHaveLength(1);
      expect(dogeAddresses).toHaveLength(1);
      expect(btcAddresses[0].name).toBe('BTC Wallet');
      expect(dogeAddresses[0].name).toBe('DOGE Wallet');
    });
  });
});
