import { create } from 'zustand';

interface EncryptionPassword {
  conversationId: string;
  password: string;
  timestamp: number;
}

interface EncryptionStore {
  passwords: Map<string, EncryptionPassword>;
  
  // Guardar contraseña para una conversación
  setPassword: (conversationId: string, password: string) => void;
  
  // Obtener contraseña de una conversación
  getPassword: (conversationId: string) => string | null;
  
  // Eliminar contraseña de una conversación
  removePassword: (conversationId: string) => void;
  
  // Limpiar todas las contraseñas
  clearAllPasswords: () => void;
  
  // Verificar si hay contraseña guardada
  hasPassword: (conversationId: string) => boolean;
}

// Key para sessionStorage
const STORAGE_KEY = 'yeebaam_encryption_passwords';

// Cargar contraseñas desde sessionStorage
const loadFromStorage = (): Map<string, EncryptionPassword> => {
  if (typeof window === 'undefined') return new Map();
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return new Map();
    
    const data = JSON.parse(stored);
    return new Map(Object.entries(data));
  } catch (error) {
    console.error('Error loading encryption passwords from storage:', error);
    return new Map();
  }
};

// Guardar contraseñas en sessionStorage
const saveToStorage = (passwords: Map<string, EncryptionPassword>) => {
  if (typeof window === 'undefined') return;
  
  try {
    const data = Object.fromEntries(passwords);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving encryption passwords to storage:', error);
  }
};

export const useEncryptionStore = create<EncryptionStore>((set, get) => ({
  passwords: loadFromStorage(),

  setPassword: (conversationId: string, password: string) => {
    set((state) => {
      const newPasswords = new Map(state.passwords);
      newPasswords.set(conversationId, {
        conversationId,
        password,
        timestamp: Date.now(),
      });
      saveToStorage(newPasswords);
      return { passwords: newPasswords };
    });
  },

  getPassword: (conversationId: string) => {
    const password = get().passwords.get(conversationId);
    if (!password) return null;
    
    // Verificar que la contraseña no tenga más de 24 horas (opcional)
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    if (Date.now() - password.timestamp > maxAge) {
      get().removePassword(conversationId);
      return null;
    }
    
    return password.password;
  },

  removePassword: (conversationId: string) => {
    set((state) => {
      const newPasswords = new Map(state.passwords);
      newPasswords.delete(conversationId);
      saveToStorage(newPasswords);
      return { passwords: newPasswords };
    });
  },

  clearAllPasswords: () => {
    set({ passwords: new Map() });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  },

  hasPassword: (conversationId: string) => {
    return get().passwords.has(conversationId) && get().getPassword(conversationId) !== null;
  },
}));
