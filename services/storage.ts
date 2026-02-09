
import { HyperBit, Message, GenesisEntry } from '../types';

const DB_NAME = 'NEXUS_HyperDB';
const DB_VERSION = 2; // Incremented for Aura 2.0
const STORES = {
  BITS: 'hyperbits',
  MESSAGES: 'messages',
  GENESIS: 'genesis_logs'
};

export const StorageService = {
  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.BITS)) {
          db.createObjectStore(STORES.BITS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.GENESIS)) {
          db.createObjectStore(STORES.GENESIS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async saveHyperBit(bit: HyperBit): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(STORES.BITS, 'readwrite');
    tx.objectStore(STORES.BITS).put(bit);
  },

  async loadHyperBits(): Promise<HyperBit[]> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.BITS, 'readonly');
      const request = tx.objectStore(STORES.BITS).getAll();
      request.onsuccess = () => resolve(request.result || []);
    });
  },

  async saveMessage(msg: Message): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(STORES.MESSAGES, 'readwrite');
    tx.objectStore(STORES.MESSAGES).put(msg);
  },

  async loadMessages(): Promise<Message[]> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.MESSAGES, 'readonly');
      const request = tx.objectStore(STORES.MESSAGES).getAll();
      request.onsuccess = () => resolve(request.result || []);
    });
  },

  // Genesis Logging
  async logGenesis(actionType: string, metadata: any): Promise<void> {
    const entry: GenesisEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      actionType,
      metadata
    };
    const db = await this.openDB();
    const tx = db.transaction(STORES.GENESIS, 'readwrite');
    tx.objectStore(STORES.GENESIS).put(entry);
  }
};
