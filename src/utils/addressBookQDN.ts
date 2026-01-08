import { base64ToObject, Coin, objectToBase64, qortalRequest, useGlobal } from 'qapp-core';
import { AddressBookEntry } from './Types';
import { getAddressBook } from './addressBookStorage';

/**
 * Data structure for QDN storage
 * Includes entries, timestamp, and optional hash for conflict detection
 */
export interface AddressBookQDNData {
  entries: AddressBookEntry[];
  lastUpdated: number;        // Unix timestamp
  hash?: string;              // Optional: hash of entries for quick comparison
}

/**
 * Interface for localStorage structure with metadata
 */
interface AddressBookLocalStorage {
  entries: AddressBookEntry[];
  lastUpdated: number;
}

/**
 * Debounce timeouts for each coin type
 */
let publishTimeouts: { [coinType: string]: NodeJS.Timeout } = {};

/**
 * Generates a hash of the entries for quick comparison
 * Sorts entries by ID before hashing to ensure order-independence
 */
function generateHash(entries: AddressBookEntry[]): string {
  // Sort entries by ID to ensure consistent hash regardless of order
  const sortedEntries = [...entries].sort((a, b) => a.id.localeCompare(b.id));
  const dataString = JSON.stringify(sortedEntries);

  // Simple hash function (djb2 algorithm variant)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Encrypts and publishes the address book to QDN
 * Gracefully handles errors without throwing
 */
async function publishToQDN(coinType: string, entries: AddressBookEntry[]): Promise<void> {
  try {
    // Get user name from global state
    const auth = useGlobal().auth;
    const userName = auth.name;

    if (!userName) {
      console.error('QDN Sync: No authenticated user found');
      return;
    }

    // Prepare data object with metadata
    const qdnData: AddressBookQDNData = {
      entries,
      lastUpdated: Date.now(),
      hash: generateHash(entries),
    };

    // Convert to base64
    const base64 = await objectToBase64(qdnData);

    // Encrypt with user's private key
    const encryptedData = await qortalRequest({
      action: 'ENCRYPT_DATA',
      base64
    });

    // Publish to QDN
    await qortalRequest({
      action: 'PUBLISH_QDN_RESOURCE',
      base64: encryptedData,
      name: userName,
      service: 'DOCUMENT_PRIVATE',
      identifier: `q-wallets-addressbook-${coinType}`,
    });

    console.log(`QDN Sync: Published ${coinType} address book for user ${userName}`);
  } catch (error) {
    console.error(`QDN Sync Error (Publish ${coinType}):`, error);
    // Don't throw - allow localStorage to continue working
  }
}

/**
 * Retrieves and decrypts the address book from QDN
 * Returns null on error or if no data exists
 */
async function fetchFromQDN(coinType: string): Promise<AddressBookQDNData | null> {
  try {
    // Get user name from global state
    const auth = useGlobal().auth;
    const userName = auth.name;

    if (!userName) {
      console.error('QDN Sync: No authenticated user found');
      return null;
    }

    // Fetch encrypted data from QDN
    const fetchData = await qortalRequest({
      action: 'FETCH_QDN_RESOURCE',
      identifier: `q-wallets-addressbook-${coinType}`,
      service: 'DOCUMENT_PRIVATE',
      name: userName,
    });

    if (!fetchData) {
      console.log(`QDN Sync: No data found for ${coinType}`);
      return null;
    }

    // Decrypt data
    const decryptedData = await qortalRequest({
      action: 'DECRYPT_DATA',
      encryptedData: fetchData,
    });

    // Convert from base64 to object
    const qdnData: AddressBookQDNData = await base64ToObject(decryptedData);

    console.log(`QDN Sync: Fetched ${coinType} address book for user ${userName}`);
    return qdnData;
  } catch (error) {
    console.error(`QDN Sync Error (Fetch ${coinType}):`, error);
    return null;
  }
}

/**
 * Syncs a single address book on startup
 * Compares timestamps to determine which version is newer
 * Uses hash comparison when timestamps are equal
 */
async function syncAddressBookOnStartup(coinType: string): Promise<void> {
  try {
    // Get data from both sources
    const localEntries = getAddressBook(coinType as Coin);
    const qdnData = await fetchFromQDN(coinType);

    // If no QDN data exists, publish local data if any
    if (!qdnData) {
      if (localEntries.length > 0) {
        console.log(`QDN Sync: No QDN data, publishing local ${coinType} data`);
        await publishToQDN(coinType, localEntries);
      }
      return;
    }

    // Get local last updated timestamp from localStorage metadata
    const localStorageKey = `q-wallets-addressbook-${coinType}`;
    const localData = localStorage.getItem(localStorageKey);
    let localLastUpdated = 0;

    if (localData) {
      try {
        const parsed: AddressBookLocalStorage = JSON.parse(localData);
        localLastUpdated = parsed.lastUpdated || 0;
      } catch (e) {
        console.error('QDN Sync: Error parsing local data', e);
      }
    }

    // Compare timestamps to determine which is newer
    const qdnLastUpdated = qdnData.lastUpdated || 0;

    if (qdnLastUpdated > localLastUpdated) {
      // QDN data is newer, update localStorage
      console.log(`QDN Sync: QDN data is newer for ${coinType}, updating localStorage`);

      // Save to localStorage with metadata
      const dataToStore: AddressBookLocalStorage = {
        entries: qdnData.entries,
        lastUpdated: qdnData.lastUpdated,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(dataToStore));
    } else if (localLastUpdated > qdnLastUpdated) {
      // Local data is newer, publish to QDN
      console.log(`QDN Sync: Local data is newer for ${coinType}, publishing to QDN`);
      await publishToQDN(coinType, localEntries);
    } else {
      // Same timestamp - use hash comparison if available
      if (qdnData.hash && localData) {
        const localHash = generateHash(localEntries);
        if (localHash !== qdnData.hash) {
          console.log(`QDN Sync: Hash mismatch for ${coinType}, using QDN data`);
          const dataToStore: AddressBookLocalStorage = {
            entries: qdnData.entries,
            lastUpdated: qdnData.lastUpdated,
          };
          localStorage.setItem(localStorageKey, JSON.stringify(dataToStore));
        }
      }
      console.log(`QDN Sync: ${coinType} data is in sync`);
    }
  } catch (error) {
    console.error(`QDN Sync Error (Startup ${coinType}):`, error);
    // Don't throw - allow app to continue with localStorage only
  }
}

/**
 * Syncs all coin address books on app startup
 * Runs in parallel for better performance
 */
export async function syncAllAddressBooksOnStartup(): Promise<void> {
  // Get all supported coin types from the Coin enum
  const coinTypes = [
    Coin.BTC,
    Coin.DOGE,
    Coin.LTC,
    Coin.RVN,
    Coin.DGB,
    Coin.QORT,
    Coin.ARRR
  ];

  console.log('QDN Sync: Starting sync for all address books...');

  try {
    // Sync all coin types in parallel
    await Promise.all(
      coinTypes.map(coinType => syncAddressBookOnStartup(coinType))
    );

    console.log('QDN Sync: All address books synced');
  } catch (error) {
    console.error('QDN Sync: Error during startup sync', error);
    // Don't throw - allow app to continue
  }
}

/**
 * Debounced version of publishToQDN
 * Delays publish to avoid excessive network calls during rapid changes
 */
export function debouncedPublishToQDN(coinType: string, entries: AddressBookEntry[], delay = 2000): void {
  // Clear existing timeout for this coin type
  if (publishTimeouts[coinType]) {
    clearTimeout(publishTimeouts[coinType]);
  }

  // Set new timeout
  publishTimeouts[coinType] = setTimeout(() => {
    publishToQDN(coinType, entries).catch(err =>
      console.error('QDN Sync: Failed to publish:', err)
    );
  }, delay);
}

/**
 * Export for use in addressBookStorage.ts
 */
export { publishToQDN };
